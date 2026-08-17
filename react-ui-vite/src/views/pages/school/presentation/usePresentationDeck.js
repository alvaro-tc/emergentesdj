/**
 * Monta un deck de Reveal a partir de una presentación.
 *
 * Sirve a los dos usos con el mismo código:
 *   - exposición a pantalla completa (`/present/:id`),
 *   - vista previa embebida dentro del editor (`embedded: true`).
 *
 * Tema y paleta se aplican como `data-reveal-theme` / `data-reveal-palette`,
 * porque Reveal pinta el fondo en `.reveal-viewport`, un ancestro del deck.
 * A pantalla completa van en `:root`; embebido, en el propio contenedor, para
 * no teñir el resto de la pantalla. Cambiarlos no reinicializa nada: solo se
 * recalculan las custom properties.
 *
 * Manda la paleta guardada en la presentación. La tecla `T` la alterna durante
 * la exposición, y esa alternancia se recuerda **por presentación y solo en la
 * pestaña actual**, para sobrevivir a un F5 en medio de la clase sin acabar
 * imponiéndose a las demás presentaciones.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Reveal from 'reveal.js';
import RevealHighlight from 'reveal.js/plugin/highlight';
import RevealNotes from 'reveal.js/plugin/notes';
import renderMathInElement from 'katex/contrib/auto-render';
import 'reveal.js/reveal.css';
import 'katex/dist/katex.min.css';
import './quartoTheme.scss';

import { renderDeck } from './qmd';
import { DEFAULT_PALETTE, DEFAULT_THEME } from './themes';

/** Clave de la alternancia manual. Lleva el id: no se comparte entre decks. */
const overrideKey = (id) => `presentation-palette:${id}`;

const readOverride = (id) => {
    if (id == null) return null;
    try {
        return sessionStorage.getItem(overrideKey(id));
    } catch {
        // Modo privado o storage bloqueado: se vive sin recordar la alternancia.
        return null;
    }
};

const writeOverride = (id, palette) => {
    if (id == null) return;
    try {
        sessionStorage.setItem(overrideKey(id), palette);
    } catch {
        // Ídem: no poder recordarlo no debe romper la exposición.
    }
};

const MATH_DELIMITERS = [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$', right: '$', display: false }
];

/** Overrides de color de la presentación, vacíos incluidos. */
const applyColorOverrides = (element, presentation, palette) => {
    const heading =
        palette === 'light' ? presentation.heading_color_light : presentation.heading_color_dark;
    const subheading =
        palette === 'light'
            ? presentation.subheading_color_light
            : presentation.subheading_color_dark;

    // Sin valor se quita el override y vuelve a mandar el tema.
    element.style.setProperty('--r-heading-color', heading || '');
    element.style.setProperty('--r-subheading-color', subheading || '');
};

export const usePresentationDeck = (presentation, { embedded = false } = {}) => {
    const deckRef = useRef(null);
    const instanceRef = useRef(null);
    const id = presentation?.id;
    const theme = presentation?.theme || DEFAULT_THEME;
    const storedPalette = presentation?.palette || DEFAULT_PALETTE;

    // Alternancia manual de esta pestaña; `null` significa "manda la presentación".
    const [override, setOverride] = useState(() => (embedded ? null : readOverride(id)));

    // La presentación llega por fetch, así que ni su id ni su paleta existen en
    // el primer render: la alternancia guardada hay que recogerla cuando ya se
    // sabe de cuál es. Se ajusta durante el render y no en un efecto, porque un
    // efecto llegaría tarde y costaría un montaje de Reveal de más.
    // Embebido no se persiste nada, y la alternancia se descarta en cuanto el
    // editor cambia la paleta, que es justo la que se está configurando.
    const syncKey = `${embedded}:${id}:${storedPalette}`;
    const [syncedFrom, setSyncedFrom] = useState(syncKey);
    if (syncedFrom !== syncKey) {
        setSyncedFrom(syncKey);
        setOverride(embedded ? null : readOverride(id));
    }

    const palette = override || storedPalette;

    const togglePalette = useCallback(() => {
        setOverride((current) => {
            const base = current || storedPalette;
            const next = base === 'dark' ? 'light' : 'dark';
            if (!embedded) writeOverride(id, next);
            return next;
        });
    }, [id, embedded, storedPalette]);

    // Embebido tiñe solo su contenedor; a pantalla completa, el documento.
    useEffect(() => {
        const target = embedded ? deckRef.current : document.documentElement;
        if (!target) return undefined;

        const previous = { theme: target.dataset.revealTheme, palette: target.dataset.revealPalette };
        target.dataset.revealTheme = theme;
        target.dataset.revealPalette = palette;

        return () => {
            if (previous.theme) target.dataset.revealTheme = previous.theme;
            else delete target.dataset.revealTheme;
            if (previous.palette) target.dataset.revealPalette = previous.palette;
            else delete target.dataset.revealPalette;
        };
    }, [theme, palette, embedded]);

    // `T` alterna claro/oscuro durante la exposición. Embebido no se registra:
    // el editor tiene sus propios controles y la tecla iría al texto.
    useEffect(() => {
        if (embedded) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 't' || event.key === 'T') togglePalette();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [togglePalette, embedded]);

    // El logo de la portada depende de la paleta, así que el deck se reconstruye
    // al cambiarla. Reveal conserva el índice de diapositiva.
    useEffect(() => {
        if (!presentation || !deckRef.current) return undefined;

        const slidesEl = deckRef.current.querySelector('.slides');
        if (!slidesEl) return undefined;

        const previousIndices = instanceRef.current?.getIndices?.();
        if (instanceRef.current) {
            try {
                instanceRef.current.destroy();
            } catch {
                // Un deck a medio inicializar puede fallar al destruirse; da igual.
            }
            instanceRef.current = null;
        }

        slidesEl.innerHTML = renderDeck(presentation, palette);
        applyColorOverrides(deckRef.current, presentation, palette);

        const deck = new Reveal(deckRef.current, {
            plugins: [RevealHighlight, RevealNotes],
            // Embebido no puede tocar el hash ni robar el teclado: comparte
            // pantalla con el editor de texto.
            embedded,
            hash: !embedded,
            respondToHashChanges: !embedded,
            keyboard: !embedded,
            slideNumber: 'c/t',
            transition: embedded ? 'none' : 'slide',
            transitionSpeed: 'default',
            controls: true,
            progress: !embedded,
            width: 1280,
            height: 720,
            margin: 0.06,
            minScale: 0.2,
            maxScale: 2.0,
            center: false
        });

        deck.initialize().then(() => {
            instanceRef.current = deck;
            renderMathInElement(slidesEl, {
                delimiters: MATH_DELIMITERS,
                throwOnError: false,
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
            });
            // Las fórmulas cambian la altura de las diapositivas.
            deck.layout();
            if (previousIndices) deck.slide(previousIndices.h, previousIndices.v);
        });

        return () => {
            if (!instanceRef.current) return;
            try {
                instanceRef.current.destroy();
            } catch {
                // Ídem: destruir un deck ya desmontado no debe romper la salida.
            }
            instanceRef.current = null;
        };
    }, [presentation, palette, embedded]);

    return { deckRef, palette, theme, togglePalette };
};

export default usePresentationDeck;
