/**
 * Pipeline Quarto (`.qmd`) → HTML de diapositivas para Reveal.js.
 *
 * Regla de corte, idéntica a `api/school/qmd.py` (cualquier cambio va en ambos):
 *   `#`  abre una diapositiva de sección
 *   `##` abre una diapositiva normal
 * Los encabezados dentro de bloques de código no cuentan: un comentario de
 * Python (`# calcula el promedio`) no debe partir la diapositiva.
 */
import MarkdownIt from 'markdown-it';
import attrs from 'markdown-it-attrs';
import container from 'markdown-it-container';

import { pickLogo } from './themes';

const FENCE_RE = /^\s*(```+|~~~+)/;
const SECTION_RE = /^#(?!#)\s/;
const SLIDE_RE = /^##(?!#)\s/;

/** Recorre las líneas indicando cuáles caen dentro de un bloque de código. */
const scanLines = (content) => {
    const result = [];
    let fence = null;
    for (const line of (content || '').split('\n')) {
        const match = FENCE_RE.exec(line);
        if (fence === null) {
            if (match) fence = match[1][0];
            result.push({ line, inCode: false });
        } else {
            result.push({ line, inCode: true });
            if (match && match[1][0] === fence) fence = null;
        }
    }
    return result;
};

/**
 * Parte el contenido en diapositivas.
 * Lo que aparezca antes del primer encabezado se descarta: en Quarto es
 * metadata o preámbulo, no una diapositiva.
 */
export const splitSlides = (content) => {
    const slides = [];
    let current = null;

    for (const { line, inCode } of scanLines(content)) {
        if (!inCode && (SECTION_RE.test(line) || SLIDE_RE.test(line))) {
            if (current) slides.push(current);
            current = {
                type: SECTION_RE.test(line) ? 'section' : 'slide',
                lines: [line]
            };
        } else if (current) {
            current.lines.push(line);
        }
    }
    if (current) slides.push(current);

    return slides.map((slide) => ({
        type: slide.type,
        markdown: slide.lines.join('\n').trim()
    }));
};

export const countSlides = (content) => splitSlides(content).length;

/**
 * Regla inline para los spans de Quarto: `[texto]{.clase}`.
 *
 * markdown-it no tiene concepto de span, y `markdown-it-attrs` solo aplica
 * atributos a bloques. Al registrarla como regla inline, el código entre
 * backticks queda protegido de forma natural.
 */
const quartoSpan = (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5b /* [ */) return false;

    const labelEnd = state.md.helpers.parseLinkLabel(state, start, false);
    if (labelEnd < 0) return false;

    const braceStart = labelEnd + 1;
    if (state.src.charCodeAt(braceStart) !== 0x7b /* { */) return false;

    const braceEnd = state.src.indexOf('}', braceStart);
    if (braceEnd < 0) return false;

    const spec = state.src.slice(braceStart + 1, braceEnd);
    const classes = [...spec.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    if (!classes.length) return false;

    if (!silent) {
        const savedMax = state.posMax;
        const open = state.push('span_open', 'span', 1);
        open.attrs = [['class', classes.join(' ')]];

        state.pos = start + 1;
        state.posMax = labelEnd;
        state.md.inline.tokenize(state);
        state.posMax = savedMax;

        state.push('span_close', 'span', -1);
    }

    state.pos = braceEnd + 1;
    return true;
};

/** Clases de un token de contenedor, puestas ahí por `markdown-it-attrs`. */
const classesOf = (token) => {
    const attr = token.attrGet && token.attrGet('class');
    if (attr) return attr.split(/\s+/).filter(Boolean);
    // Forma sin llaves: `::: columns`
    const bare = /^([\w-]+)/.exec((token.info || '').trim());
    return bare ? [bare[1]] : [];
};

const renderContainer = (tokens, idx, options, env) => {
    const token = tokens[idx];
    // Cada apertura apila su etiqueta para cerrarla con la correcta: las notas
    // del expositor son un `<aside>`, no un `<div>`.
    const stack = (env.quartoTags ||= []);

    if (token.nesting !== 1) return `</${stack.pop() || 'div'}>\n`;

    const classes = classesOf(token);

    // Las notas del expositor tienen su propio elemento en Reveal.
    if (classes.includes('notes')) {
        stack.push('aside');
        return '<aside class="notes">\n';
    }
    stack.push('div');

    const title = token.attrGet && token.attrGet('title');
    const isCallout = classes.some((c) => c.startsWith('callout-'));
    const heading = isCallout
        ? `<span class="callout-title">${escapeHtml(title || calloutLabel(classes))}</span>\n`
        : '';
    const classAttr = isCallout ? ['callout', ...classes].join(' ') : classes.join(' ');

    return `<div class="${escapeHtml(classAttr)}">\n${heading}`;
};

const CALLOUT_LABELS = {
    'callout-note': 'Nota',
    'callout-tip': 'Consejo',
    'callout-important': 'Importante',
    'callout-warning': 'Atención',
    'callout-caution': 'Cuidado'
};

const calloutLabel = (classes) =>
    CALLOUT_LABELS[classes.find((c) => c.startsWith('callout-'))] || 'Nota';

export const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/**
 * Normaliza los bloques de código a lo que espera el plugin `highlight` de
 * Reveal: clase `language-x` y `data-line-numbers` en vez del
 * `code-line-numbers` de Quarto.
 */
const normalizeCodeFences = (md) => {
    const original = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const lineNumbers = token.attrGet('code-line-numbers');
        if (lineNumbers !== null) {
            token.attrJoin('data-line-numbers', lineNumbers);
            const kept = token.attrs.filter(([name]) => name !== 'code-line-numbers');
            token.attrs = kept;
        }
        // `{.python}` deja `class="python"`; hljs necesita el prefijo. El
        // renderer de markdown-it ya añade el suyo desde el info string, así
        // que hay que deduplicar o sale `language-python language-python`.
        const className = token.attrGet('class');
        if (className) {
            const language = className.split(/\s+/)[0].replace(/^language-/, '');
            if (!token.info) token.info = language;
            const normalized = [
                ...new Set(
                    className
                        .split(/\s+/)
                        .map((c) => (/^(language-|hljs)/.test(c) ? c : `language-${c}`))
                )
            ].filter((c) => c !== `language-${token.info.trim().split(/\s+/)[0]}`);
            if (normalized.length) token.attrSet('class', normalized.join(' '));
            else token.attrs = token.attrs.filter(([name]) => name !== 'class');
        }
        return original(tokens, idx, options, env, self);
    };
};

/** Crea el renderizador. Es puro: se puede reutilizar entre diapositivas. */
export const createRenderer = () => {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: false,
        typographer: false
    });

    md.use(attrs, { allowedAttributes: [] });
    md.use(container, 'quarto', {
        // Un `:::` a secas es el cierre, no la apertura de otro contenedor.
        validate: (params) => params.trim().length > 0,
        render: renderContainer
    });
    md.inline.ruler.push('quarto_span', quartoSpan);
    normalizeCodeFences(md);

    return md;
};

/**
 * Atributos de fondo de Quarto. En Reveal no viven en el encabezado sino en la
 * `<section>`, como `data-background-*`, y de ahí sale el fondo a sangre.
 */
const BACKGROUND_KEYS = [
    'background-image', 'background-color', 'background-size',
    'background-position', 'background-repeat', 'background-opacity',
    'background-video', 'background-iframe'
];

const HEADING_ATTRS_RE = /\{([^}]*)\}\s*$/;

/**
 * Saca del encabezado los `background-*` y los devuelve como atributos de la
 * diapositiva. Lo demás (`{.inverse}`, etc.) se deja intacto para que
 * `markdown-it-attrs` siga aplicándolo al encabezado.
 */
const extractBackground = (markdown) => {
    const lines = markdown.split('\n');
    const match = HEADING_ATTRS_RE.exec(lines[0] || '');
    if (!match) return { markdown, attrs: '' };

    const found = [];
    const rest = match[1].replace(/([\w-]+)\s*=\s*"([^"]*)"/g, (all, key, value) => {
        if (!BACKGROUND_KEYS.includes(key)) return all;
        found.push(` data-${key}="${escapeHtml(value)}"`);
        return '';
    });
    if (!found.length) return { markdown, attrs: '' };

    const kept = rest.trim();
    lines[0] = lines[0].slice(0, match.index) + (kept ? `{${kept}}` : '');
    return { markdown: lines.join('\n'), attrs: found.join('') };
};

/** Envuelve el markdown de una diapositiva en su `<section>`. */
export const renderSlide = (md, slide) => {
    const { markdown, attrs } = extractBackground(slide.markdown);
    const body = md.render(markdown);

    // El cuerpo de una sección va en su propia caja: así se centra en vertical
    // desde el CSS sin tocar el `display` de la `<section>`, que es de Reveal
    // y decide qué diapositiva se ve.
    if (slide.type === 'section') {
        return `<section class="quarto-section"${attrs}>\n<div class="section-body">\n${body}</div>\n</section>`;
    }
    return `<section${attrs}>\n${body}\n</section>`;
};

/**
 * Portada: logo, título, subtítulo y autor. No sale del `.qmd`.
 *
 * El texto va en su propio bloque porque la portada lo ancla a media
 * diapositiva, independientemente de lo alto que sea el logo.
 */
export const renderCover = (presentation, palette) => {
    const logo = pickLogo(presentation, palette);

    const text = [
        `<h1>${escapeHtml(presentation.title)}</h1>`,
        presentation.subtitle
            ? `<p class="cover-subtitle">${escapeHtml(presentation.subtitle)}</p>`
            : '',
        presentation.autor
            ? `<p class="cover-author">${escapeHtml(presentation.autor)}</p>`
            : ''
    ].filter(Boolean);

    const parts = [
        logo ? `<img class="cover-logo" src="${escapeHtml(logo)}" alt="" />` : '',
        `<div class="cover-text">\n${text.join('\n')}\n</div>`
    ];

    return `<section class="quarto-cover">\n${parts.filter(Boolean).join('\n')}\n</section>`;
};

/** HTML completo del deck: portada + una `<section>` por encabezado. */
export const renderDeck = (presentation, palette) => {
    const md = createRenderer();
    const slides = splitSlides(presentation.content)
        .map((slide) => renderSlide(md, slide))
        .join('\n');
    return `${renderCover(presentation, palette)}\n${slides}`;
};
