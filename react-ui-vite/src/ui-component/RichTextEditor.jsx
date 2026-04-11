import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import {
    Box, IconButton, Divider, Tooltip, Stack, Paper,
} from '@mui/material';
import {
    IconBold, IconItalic, IconUnderline, IconStrikethrough,
    IconCode, IconH1, IconH2, IconH3,
    IconList, IconListNumbers, IconBlockquote,
    IconLink, IconUnlink, IconAlignLeft, IconAlignCenter,
    IconAlignRight, IconMinus, IconArrowBackUp, IconArrowForwardUp,
    IconClearFormatting,
} from '@tabler/icons-react';

const lowlight = createLowlight();
lowlight.register('javascript', js);
lowlight.register('python', python);
lowlight.register('css', css);
lowlight.register('html', xml);

const ToolbarButton = ({ title, onClick, active, disabled, children }) => (
    <Tooltip title={title} placement="top">
        <span>
            <IconButton
                size="small"
                onClick={onClick}
                disabled={disabled}
                sx={{
                    borderRadius: 1,
                    color: active ? 'secondary.main' : 'text.secondary',
                    bgcolor: active ? 'secondary.lighter' : 'transparent',
                    '&:hover': { bgcolor: active ? 'secondary.light' : 'action.hover' },
                }}
            >
                {children}
            </IconButton>
        </span>
    </Tooltip>
);

const RichTextEditor = ({ value, onChange, placeholder = 'Escribe el contenido aquí...' }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder }),
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync external value changes (e.g., when opening edit dialog)
    useEffect(() => {
        if (!editor) return;
        const currentHTML = editor.getHTML();
        if (value !== currentHTML) {
            editor.commands.setContent(value || '', false);
        }
    }, [value, editor]);

    const handleSetLink = () => {
        const url = window.prompt('URL del enlace:');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    if (!editor) return null;

    const iconSize = '1.1rem';

    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {/* Toolbar */}
            <Paper
                elevation={0}
                sx={{
                    px: 1, py: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.25,
                    alignItems: 'center',
                }}
            >
                {/* History */}
                <ToolbarButton title="Deshacer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <IconArrowBackUp size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Rehacer (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <IconArrowForwardUp size={iconSize} />
                </ToolbarButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

                {/* Headings */}
                <ToolbarButton title="Encabezado 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
                    <IconH1 size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Encabezado 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
                    <IconH2 size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Encabezado 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
                    <IconH3 size={iconSize} />
                </ToolbarButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

                {/* Inline styles */}
                <ToolbarButton title="Negrita (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
                    <IconBold size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Cursiva (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
                    <IconItalic size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Subrayado (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
                    <IconUnderline size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
                    <IconStrikethrough size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Código inline" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
                    <IconCode size={iconSize} />
                </ToolbarButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

                {/* Alignment */}
                <ToolbarButton title="Alinear izquierda" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
                    <IconAlignLeft size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Centrar" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
                    <IconAlignCenter size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Alinear derecha" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
                    <IconAlignRight size={iconSize} />
                </ToolbarButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

                {/* Lists */}
                <ToolbarButton title="Lista con viñetas" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
                    <IconList size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
                    <IconListNumbers size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Cita" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
                    <IconBlockquote size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Bloque de código" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
                    <Box sx={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1, color: 'inherit', px: 0.25 }}>{'</>'}</Box>
                </ToolbarButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

                {/* Link */}
                <ToolbarButton title="Insertar enlace" onClick={handleSetLink} active={editor.isActive('link')}>
                    <IconLink size={iconSize} />
                </ToolbarButton>
                <ToolbarButton title="Quitar enlace" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}>
                    <IconUnlink size={iconSize} />
                </ToolbarButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

                {/* Horizontal rule */}
                <ToolbarButton title="Línea divisoria" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <IconMinus size={iconSize} />
                </ToolbarButton>

                {/* Clear formatting */}
                <ToolbarButton title="Limpiar formato" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                    <IconClearFormatting size={iconSize} />
                </ToolbarButton>
            </Paper>

            {/* Editor area */}
            <Box
                sx={{
                    '& .ProseMirror': {
                        minHeight: 280,
                        p: 2,
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        lineHeight: 1.7,
                        color: 'text.primary',
                        '& h1': { fontSize: '1.75rem', fontWeight: 700, mt: 2, mb: 1 },
                        '& h2': { fontSize: '1.4rem', fontWeight: 700, mt: 2, mb: 1 },
                        '& h3': { fontSize: '1.15rem', fontWeight: 700, mt: 1.5, mb: 0.75 },
                        '& p': { my: 0.5 },
                        '& ul, & ol': { pl: 3, my: 0.5 },
                        '& blockquote': {
                            borderLeft: '3px solid',
                            borderColor: 'secondary.main',
                            pl: 2,
                            ml: 0,
                            color: 'text.secondary',
                            fontStyle: 'italic',
                            my: 1,
                        },
                        '& code': {
                            bgcolor: 'action.hover',
                            px: 0.5,
                            borderRadius: 0.5,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                        },
                        '& pre': {
                            bgcolor: '#1e1e2e',
                            color: '#cdd6f4',
                            p: 2,
                            borderRadius: 1,
                            overflowX: 'auto',
                            my: 1,
                            '& code': { bgcolor: 'transparent', p: 0, color: 'inherit' },
                        },
                        '& a': { color: 'secondary.main', textDecoration: 'underline' },
                        '& hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2 },
                        '& p.is-editor-empty:first-of-type::before': {
                            content: 'attr(data-placeholder)',
                            color: 'text.disabled',
                            pointerEvents: 'none',
                            float: 'left',
                            height: 0,
                        },
                    },
                }}
            >
                <EditorContent editor={editor} />
            </Box>
        </Box>
    );
};

export default RichTextEditor;
