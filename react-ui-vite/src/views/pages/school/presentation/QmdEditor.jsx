/**
 * Editor de código para el contenido `.qmd`.
 *
 * Es fuente, no texto con formato: la sintaxis literal (`::: {.columns}`,
 * `{.fragment}`, `$$…$$`) *es* el contenido, así que un editor visual la
 * destruiría. CodeMirror resalta el Markdown y el Python anidado en los
 * bloques, y deja que Tab indente en lugar de saltar de campo.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { IconMaximize, IconX } from '@tabler/icons-react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { tags } from '@lezer/highlight';

/** Resaltado alineado a la paleta de MUI para que no desentone con el resto. */
const buildHighlightStyle = (palette) =>
    HighlightStyle.define([
        { tag: tags.heading, color: palette.primary.main, fontWeight: '700' },
        { tag: tags.strong, color: palette.text.primary, fontWeight: '700' },
        { tag: tags.emphasis, color: palette.text.primary, fontStyle: 'italic' },
        { tag: tags.link, color: palette.info.main, textDecoration: 'underline' },
        { tag: tags.url, color: palette.info.main },
        { tag: tags.monospace, color: palette.secondary.main },
        { tag: tags.list, color: palette.text.secondary },
        { tag: tags.quote, color: palette.text.secondary, fontStyle: 'italic' },
        { tag: tags.keyword, color: palette.secondary.main },
        { tag: tags.string, color: palette.success.main },
        { tag: tags.number, color: palette.warning.dark },
        { tag: tags.comment, color: palette.text.disabled, fontStyle: 'italic' },
        { tag: tags.function(tags.variableName), color: palette.info.main },
        { tag: tags.definition(tags.variableName), color: palette.text.primary },
        { tag: tags.processingInstruction, color: palette.text.disabled }
    ]);

/** Plantillas de la sintaxis Quarto que cuesta recordar de memoria. */
const SNIPPETS = [
    { label: 'Diapositiva', hint: 'Nueva diapositiva', text: '## Título\n\n' },
    { label: 'Sección', hint: 'Diapositiva de sección con subtítulo', text: '# Título\n[Subtítulo]{.subtitle}\n\n' },
    { label: 'Python', hint: 'Bloque de código con resaltado por líneas', text: '```{.python code-line-numbers="1|2"}\n\n```\n\n' },
    { label: 'Salida', hint: 'Resultado de la ejecución, pegado al bloque anterior', text: '::: {.cell-output}\n\n:::\n\n' },
    { label: 'Columnas', hint: 'Dos columnas lado a lado', text: ':::: {.columns}\n::: {.column width="50%"}\n\n:::\n::: {.column width="50%"}\n\n:::\n::::\n\n' },
    { label: 'Callout', hint: 'Bloque destacado', text: '::: {.callout-tip title="Consejo"}\n\n:::\n\n' },
    { label: 'Imagen', hint: 'Imagen desde una URL pública', text: '![](https://vgy.me/ejemplo.png){width="70%"}\n\n' },
    { label: 'Fondo', hint: 'Diapositiva con una imagen a pantalla completa', text: '# {background-image="https://vgy.me/ejemplo.png"}\n\n' },
    { label: 'Ecuación', hint: 'Fórmula en bloque (LaTeX)', text: '$$\n\n$$\n\n' },
    { label: 'Notas', hint: 'Notas del expositor (tecla S)', text: '::: {.notes}\n\n:::\n\n' },
    { label: 'Fragmento', hint: 'Aparece al avanzar', text: '[Texto]{.fragment}\n\n' }
];

const QmdEditor = ({ value, onChange, height = 560, fill = false }) => {
    const theme = useTheme();
    // A pantalla completa el editor ocupa la ventana y la barra de plantillas
    // deja de perderse al bajar: con 20 diapositivas se scrollea mucho.
    const [fullscreen, setFullscreen] = useState(false);
    // `height` admite número (píxeles) o una expresión CSS: la columna del
    // editor se mide contra la ventana, no contra un alto fijo.
    // A pantalla completa manda el flex del contenedor, no un cálculo: así no
    // sobra ni falta un píxel y nunca aparece un scroll por fuera del editor.
    // `fill` es el mismo trato que pantalla completa dentro de la columna: el
    // alto lo pone el contenedor y el texto se desplaza por dentro.
    const stretched = fullscreen || fill;
    const editorHeight = stretched
        ? '100%'
        : (typeof height === 'number' ? `${height}px` : height);
    // Nodo anfitrión como estado y no como ref: MUI monta el contenido del
    // diálogo en un portal, que en su primer render devuelve `null`. Con una
    // ref, el efecto corría con el nodo aún sin montar y no creaba el editor —
    // se veía la barra de plantillas sobre un hueco vacío.
    const [hostEl, setHostEl] = useState(null);
    const viewRef = useRef(null);
    // El callback cambia en cada render del padre; la instancia no debe recrearse.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!hostEl) return undefined;

        const state = EditorState.create({
            doc: value ?? '',
            extensions: [
                lineNumbers(),
                highlightActiveLine(),
                history(),
                indentUnit.of('    '),
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                markdown({ base: markdownLanguage, codeLanguages: [
                    { name: 'python', alias: ['py'], support: python() }
                ] }),
                syntaxHighlighting(buildHighlightStyle(theme.palette)),
                EditorView.lineWrapping,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) onChangeRef.current(update.state.doc.toString());
                }),
                EditorView.theme({
                    '&': {
                        fontSize: '13px',
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        height: editorHeight
                    },
                    '&.cm-focused': { outline: 'none' },
                    '.cm-content': {
                        fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                        lineHeight: '1.6',
                        caretColor: theme.palette.primary.main
                    },
                    '.cm-gutters': {
                        backgroundColor: theme.palette.background.default,
                        color: theme.palette.text.disabled,
                        border: 'none'
                    },
                    '.cm-activeLine': { backgroundColor: theme.palette.action.hover },
                    '.cm-activeLineGutter': { backgroundColor: 'transparent' },
                    // `overscroll-behavior` corta el contagio: al llegar al
                    // final del documento la rueda no arrastra la página.
                    '.cm-scroller': { overflow: 'auto', overscrollBehavior: 'contain' }
                })
            ]
        });

        const view = new EditorView({ state, parent: hostEl });
        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // `value` solo siembra el documento inicial; después manda CodeMirror.
        // Al entrar o salir de pantalla completa el editor se remonta: el
        // documento no se pierde porque el padre guarda cada cambio en `value`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme.palette.mode, editorHeight, hostEl]);

    // Cambios que llegan de fuera (cargar una presentación al editar).
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (value != null && value !== current) {
            view.dispatch({
                changes: { from: 0, to: current.length, insert: value }
            });
        }
    }, [value]);

    /** Inserta una plantilla en el cursor y devuelve el foco al editor. */
    const insertSnippet = (snippet) => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const prefix = from > 0 && view.state.doc.sliceString(from - 1, from) !== '\n' ? '\n' : '';
        const text = `${prefix}${snippet}`;
        view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length }
        });
        view.focus();
    };

    const body = (
        <Box
            sx={stretched
                ? {
                    // Altura fija y sin desbordamiento: el único que se desplaza
                    // es CodeMirror. La barra queda fuera de esa caja, así que
                    // no puede irse por mucho que se baje en el documento.
                    ...(fullscreen ? { p: 2, height: '100vh' } : { height: '100%' }),
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }
                : undefined}
        >
            {/* La barra se queda pegada arriba al desplazarse: es lo que se usa
                en cada diapositiva nueva y desaparecía al bajar por el texto. */}
            <Box
                sx={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, mb: 1,
                    position: 'sticky', top: 0, zIndex: 2,
                    bgcolor: 'background.paper', py: 0.5,
                    flexShrink: 0
                }}
            >
                {fullscreen && (
                    <Typography variant="subtitle2" sx={{ mr: 1 }}>Contenido (Quarto)</Typography>
                )}
                {SNIPPETS.map((snippet) => (
                    <Tooltip key={snippet.label} title={snippet.hint}>
                        <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            onClick={() => insertSnippet(snippet.text)}
                            sx={{ minWidth: 0, px: 1, fontSize: '0.7rem', textTransform: 'none' }}
                        >
                            {snippet.label}
                        </Button>
                    </Tooltip>
                ))}
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title={fullscreen ? 'Salir (Esc)' : 'Editar a pantalla completa'}>
                    <IconButton size="small" onClick={() => setFullscreen(f => !f)}>
                        {fullscreen ? <IconX size={18} /> : <IconMaximize size={18} />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Box
                ref={setHostEl}
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    // `minHeight: 0` es lo que deja encoger a un hijo flex; sin
                    // él el editor desbordaría la ventana en pantalla completa.
                    ...(stretched ? { flex: 1, minHeight: 0 } : null),
                    '& .cm-editor': { height: '100%' }
                }}
            />
        </Box>
    );

    if (fullscreen) {
        return (
            <Dialog fullScreen open onClose={() => setFullscreen(false)}>
                {body}
            </Dialog>
        );
    }

    return body;
};

export default QmdEditor;
