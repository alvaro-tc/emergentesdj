import React, { lazy, Suspense, useEffect, useState } from 'react';
import {
    Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
    Select, FormControl, InputLabel, FormHelperText, Box, Chip, Divider,
    Alert, Snackbar, CircularProgress, Tooltip
} from '@mui/material';
import { IconArrowLeft, IconDeviceFloppy, IconPresentation, IconPhoto, IconUpload, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import config from '../../../config';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { countSlides } from './presentation/qmd';
import {
    DEFAULT_PALETTE, DEFAULT_THEME, PALETTE_LABELS, THEME_LIST, getThemeColors
} from './presentation/themes';

// CodeMirror pesa lo suyo y solo hace falta al editar.
const QmdEditor = lazy(() => import('./presentation/QmdEditor'));
// Reveal + KaTeX + highlight.js: todo el peso del deck, solo para previsualizar.
const DeckPreview = lazy(() => import('./presentation/DeckPreview'));

/**
 * Los cuatro overrides de color: título y subtítulo, por cada paleta.
 *
 * El orden importa: se pintan en dos columnas y tienen que caer bajo la
 * pastilla de su paleta —claro a la izquierda, oscuro a la derecha—, en el
 * mismo orden que `PALETTE_LABELS`. Cruzarlos hace elegir el color equivocado.
 */
const COLOR_FIELDS = [
    { field: 'heading_color_light', label: 'Título · claro', palette: 'light' },
    { field: 'heading_color_dark', label: 'Título · oscuro', palette: 'dark' },
    { field: 'subheading_color_light', label: 'Subtítulo · claro', palette: 'light' },
    { field: 'subheading_color_dark', label: 'Subtítulo · oscuro', palette: 'dark' }
];

const PLACEHOLDER_CONTENT = `# Tema de la clase
[Un subtítulo opcional]{.subtitle}

## Primera diapositiva

Cada \`##\` abre una diapositiva nueva.

- Punto importante
- Otro punto

## Un ejemplo en Python

\`\`\`{.python code-line-numbers="1|2-3"}
def promedio(notas):
    total = sum(notas)
    return total / len(notas)
\`\`\`

::: {.cell-output}
7.5
:::

## Dos columnas

:::: {.columns}
::: {.column width="50%"}
Texto a la izquierda.
:::
::: {.column width="50%"}
![](https://vgy.me/ejemplo.png)
:::
::::
`;

/** Extensiones que acepta el endpoint de subida (`upload-logo`). */
const LOGO_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,.gif';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * Un logo de la portada: se puede pegar una URL o subir un archivo.
 *
 * Ambos caminos acaban en el mismo campo de texto, porque el deck y el export a
 * PDF solo saben de URLs; subir un archivo es únicamente otra forma de
 * conseguir una.
 */
const LogoField = ({ label, value, onChange, onFile, onClear, uploading, broken, onBroken, previewBg }) => {
    const inputRef = React.useRef(null);

    const handlePick = (event) => {
        const file = event.target.files?.[0];
        // Se limpia siempre: si no, volver a elegir el mismo archivo no dispara `change`.
        event.target.value = '';
        if (file) onFile(file);
    };

    return (
        <>
            <TextField
                fullWidth size="small"
                label={label}
                value={value}
                onChange={onChange}
                placeholder="Pega una URL o sube un archivo"
                InputProps={{ startAdornment: <IconPhoto size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
            />
            <Box display="flex" gap={1} mt={0.8}>
                <input
                    ref={inputRef}
                    type="file"
                    accept={LOGO_ACCEPT}
                    hidden
                    onChange={handlePick}
                />
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <IconUpload size={16} />}
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? 'Subiendo...' : 'Subir imagen'}
                </Button>
                {value && (
                    <Button size="small" color="inherit" startIcon={<IconTrash size={16} />} onClick={onClear}>
                        Quitar
                    </Button>
                )}
            </Box>
            {value && !broken && (
                <Box mt={1} display="flex" justifyContent="center"
                    sx={{ bgcolor: previewBg, borderRadius: 1, p: 1.5 }}>
                    <img
                        src={value}
                        alt={`${label} preview`}
                        onError={onBroken}
                        style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }}
                    />
                </Box>
            )}
            {value && broken && (
                <Alert severity="warning" sx={{ mt: 1, py: 0 }}>URL de imagen no válida o inaccesible.</Alert>
            )}
        </>
    );
};

const PresentationForm = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const account = useSelector((state) => state.account);
    const activeCourse = account.activeCourse;

    const setAuthHeader = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        }
    };

    const [subjects, setSubjects] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEditing);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [logoError, setLogoError] = useState(false);

    const [logoOscuroError, setLogoOscuroError] = useState(false);
    // Campo cuyo logo se está subiendo ahora mismo, o `null`.
    const [uploading, setUploading] = useState(null);

    const [form, setForm] = useState({
        // El curso activo solo sugiere la materia; se puede cambiar libremente,
        // porque una presentación cuelga de la materia y no del curso.
        subject: activeCourse?.subject || '',
        title: '',
        subtitle: '',
        autor: '',
        logo_url: '',
        logo_oscuro: '',
        theme: DEFAULT_THEME,
        palette: DEFAULT_PALETTE,
        heading_color_light: '',
        heading_color_dark: '',
        subheading_color_light: '',
        subheading_color_dark: '',
        content: PLACEHOLDER_CONTENT,
    });

    // Load subjects
    useEffect(() => {
        setAuthHeader();
        axios.get(`${config.API_SERVER}subjects/`)
            .then(res => setSubjects(Array.isArray(res.data) ? res.data : (res.data.results ?? [])))
            .catch(console.error);
    }, []);

    // Load existing presentation when editing
    useEffect(() => {
        if (!isEditing) return;
        setAuthHeader();
        axios.get(`${config.API_SERVER}presentations/${id}/`)
            .then(res => {
                const p = res.data;
                setForm({
                    subject: p.subject || '',
                    title: p.title || '',
                    subtitle: p.subtitle || '',
                    autor: p.autor || '',
                    logo_url: p.logo_url || '',
                    logo_oscuro: p.logo_oscuro || '',
                    theme: p.theme || DEFAULT_THEME,
                    palette: p.palette || DEFAULT_PALETTE,
                    heading_color_light: p.heading_color_light || '',
                    heading_color_dark: p.heading_color_dark || '',
                    subheading_color_light: p.subheading_color_light || '',
                    subheading_color_dark: p.subheading_color_dark || '',
                    content: p.content || '',
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        if (field === 'logo_url') setLogoError(false);
        if (field === 'logo_oscuro') setLogoOscuroError(false);
    };

    /** Escribe un logo y reinicia su marca de "imagen rota". */
    const setLogoField = (field, url) => {
        setForm(f => ({ ...f, [field]: url }));
        if (field === 'logo_url') setLogoError(false);
        else setLogoOscuroError(false);
    };

    /**
     * Sube el archivo y deja su URL en el campo.
     *
     * El logo se guarda en cuanto se guarda la presentación: la subida es
     * independiente, así que la imagen ya vive en el servidor aunque después se
     * abandone el formulario.
     */
    const uploadLogo = async (field, file) => {
        if (file.size > MAX_LOGO_BYTES) {
            setSnackbar({ open: true, message: 'El logo no puede superar los 2 MB.', severity: 'error' });
            return;
        }
        setAuthHeader();
        setUploading(field);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await axios.post(`${config.API_SERVER}presentations/upload-logo/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLogoField(field, res.data.url);
        } catch (err) {
            const msg = err.response?.data?.detail || 'No se pudo subir la imagen.';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setUploading(null);
        }
    };

    // Portada + una diapositiva por cada `#` o `##`, igual que el viewer.
    const slides = 1 + countSlides(form.content);

    const handleSave = async () => {
        if (!form.title.trim()) {
            setSnackbar({ open: true, message: 'El título es obligatorio.', severity: 'error' });
            return;
        }
        if (!form.subject) {
            setSnackbar({ open: true, message: 'Selecciona la materia a la que pertenece.', severity: 'error' });
            return;
        }
        setAuthHeader();
        setSaving(true);
        try {
            const payload = { ...form };
            if (isEditing) {
                await axios.put(`${config.API_SERVER}presentations/${id}/`, payload);
            } else {
                await axios.post(`${config.API_SERVER}presentations/`, payload);
            }
            setSnackbar({ open: true, message: isEditing ? 'Presentación actualizada.' : 'Presentación creada.', severity: 'success' });
            setTimeout(() => navigate('/dashboard/presentations'), 1000);
        } catch (err) {
            const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
    );

    return (
        <Grid container spacing={3}>
            {/* Header */}
            <Grid size={12}>
                <Card>
                    <CardContent>
                        <Grid container alignItems="center" justifyContent="space-between">
                            <Grid>
                                <Button
                                    startIcon={<IconArrowLeft />}
                                    onClick={() => navigate('/dashboard/presentations')}
                                    sx={{ mr: 2 }}
                                >
                                    Volver
                                </Button>
                                <Typography variant="h3" component="span">
                                    {isEditing ? 'Editar Presentación' : 'Nueva Presentación'}
                                </Typography>
                            </Grid>
                            <Grid>
                                <Button
                                    variant="outlined"
                                    startIcon={<IconPresentation />}
                                    onClick={() => id && window.open(`/present/${id}`, '_blank')}
                                    disabled={!isEditing}
                                    sx={{ mr: 1 }}
                                >
                                    Presentar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy />}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Columna izquierda: vista previa arriba y datos debajo. El ancho
                se lo lleva el editor, que es donde se trabaja. */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Suspense fallback={
                            <Box sx={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CircularProgress />
                            </Box>
                        }>
                            <DeckPreview presentation={form} />
                        </Suspense>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h5" fontWeight={600} gutterBottom>Datos de la Presentación</Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <FormControl fullWidth size="small" error={!form.subject}>
                                    <InputLabel>Materia *</InputLabel>
                                    <Select
                                        value={form.subject}
                                        onChange={handleChange('subject')}
                                        label="Materia *"
                                    >
                                        {subjects.map(s => (
                                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        {form.subject
                                            ? 'La presentación se reutiliza en todos los cursos de esta materia.'
                                            : 'Selecciona la materia a la que pertenece.'}
                                    </FormHelperText>
                                </FormControl>
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth size="small"
                                    label="Título *"
                                    value={form.title}
                                    onChange={handleChange('title')}
                                />
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth size="small"
                                    label="Subtítulo"
                                    value={form.subtitle}
                                    onChange={handleChange('subtitle')}
                                />
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth size="small"
                                    label="Autor"
                                    value={form.autor}
                                    onChange={handleChange('autor')}
                                    placeholder="Nombre del autor"
                                />
                            </Grid>

                            <Grid size={12}>
                                <LogoField
                                    label="Logo claro (temas oscuros)"
                                    value={form.logo_url}
                                    onChange={handleChange('logo_url')}
                                    onFile={(file) => uploadLogo('logo_url', file)}
                                    onClear={() => setLogoField('logo_url', '')}
                                    uploading={uploading === 'logo_url'}
                                    broken={logoError}
                                    onBroken={() => setLogoError(true)}
                                    previewBg="#1c1c1c"
                                />
                            </Grid>

                            <Grid size={12}>
                                <LogoField
                                    label="Logo oscuro (temas claros)"
                                    value={form.logo_oscuro}
                                    onChange={handleChange('logo_oscuro')}
                                    onFile={(file) => uploadLogo('logo_oscuro', file)}
                                    onClear={() => setLogoField('logo_oscuro', '')}
                                    uploading={uploading === 'logo_oscuro'}
                                    broken={logoOscuroError}
                                    onBroken={() => setLogoOscuroError(true)}
                                    previewBg="#f5f5f5"
                                />
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" gutterBottom>Tema</Typography>
                                <Grid container spacing={1}>
                                    {THEME_LIST.map((t) => {
                                        const sample = t.palettes[form.palette] || t.palettes[DEFAULT_PALETTE];
                                        const selected = form.theme === t.id;
                                        return (
                                            <Grid size={3} key={t.id}>
                                                <Tooltip title={t.description}>
                                                    <Box
                                                        onClick={() => setForm(f => ({ ...f, theme: t.id }))}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            p: 1,
                                                            borderRadius: 1,
                                                            bgcolor: sample.bg,
                                                            border: '2px solid',
                                                            borderColor: selected ? 'primary.main' : 'divider',
                                                            boxShadow: selected ? 3 : 0,
                                                            transition: 'all 0.15s',
                                                            userSelect: 'none',
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                color: sample.heading, fontSize: '0.68rem', fontWeight: 700,
                                                                lineHeight: 1.2, whiteSpace: 'nowrap',
                                                                overflow: 'hidden', textOverflow: 'ellipsis'
                                                            }}
                                                        >
                                                            {t.label}
                                                        </Typography>
                                                        <Typography sx={{ color: sample.subheading, fontSize: '0.55rem' }}>
                                                            Subtítulo
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.4, mt: 0.6 }}>
                                                            {[sample.main, sample.accent, sample.muted].map((c) => (
                                                                <Box key={c} sx={{ width: 12, height: 6, borderRadius: 0.5, bgcolor: c }} />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Tooltip>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" gutterBottom>Paleta inicial</Typography>
                                <Grid container spacing={1}>
                                    {Object.entries(PALETTE_LABELS).map(([value, label]) => {
                                        const sample = getThemeColors(form.theme, value);
                                        return (
                                            <Grid key={value}>
                                                <Box
                                                    onClick={() => setForm(f => ({ ...f, palette: value }))}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        px: 1.5, py: 0.8,
                                                        borderRadius: 1,
                                                        bgcolor: sample.bg,
                                                        color: sample.heading,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        border: '2px solid',
                                                        borderColor: form.palette === value ? 'primary.main' : 'divider',
                                                        boxShadow: form.palette === value ? 3 : 0,
                                                        transition: 'all 0.15s',
                                                        userSelect: 'none',
                                                    }}
                                                >
                                                    {label}
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                                <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                                    Con la que se abre la presentación. Durante la exposición se
                                    alterna con la tecla <strong>T</strong>.
                                </Typography>
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                    Colores de títulos
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                                    Vacío usa el color del tema. Cada paleta lleva el suyo: un mismo
                                    tono no funciona sobre fondo claro y oscuro a la vez.
                                </Typography>
                                <Grid container spacing={1}>
                                    {COLOR_FIELDS.map(({ field, label, palette }) => (
                                        <Grid size={6} key={field}>
                                            <TextField
                                                fullWidth size="small" type="color"
                                                label={label}
                                                value={form[field] || getThemeColors(form.theme, palette)[
                                                    field.startsWith('heading') ? 'heading' : 'subheading'
                                                ]}
                                                onChange={handleChange(field)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& input': { height: 28, cursor: 'pointer', p: 0.5 } }}
                                            />
                                            {form[field] && (
                                                <Button
                                                    size="small"
                                                    onClick={() => setForm(f => ({ ...f, [field]: '' }))}
                                                    sx={{ fontSize: '0.65rem', p: 0, minWidth: 0, mt: 0.3 }}
                                                >
                                                    Restablecer
                                                </Button>
                                            )}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Editor .qmd. La tarjeta se queda pegada a la ventana: la columna
                izquierda es más larga, y sin esto el editor se iba hacia arriba
                con el scroll y se llevaba la barra de plantillas. */}
            <Grid size={{ xs: 12, md: 8 }}>
                <Card
                    sx={{
                        position: { md: 'sticky' },
                        top: 16,
                        // Alto definido y contenido en columna flexible: el
                        // desplazamiento vive dentro de CodeMirror, no en la
                        // página, así que la barra de plantillas no se mueve.
                        height: { md: 'calc(100vh - 120px)' },
                        display: 'flex',
                        flexDirection: 'column',
                        // La tarjeta tiene que caber holgadamente en la ventana.
                        // Si mide casi lo mismo que la pantalla, al llegar al
                        // final de la columna izquierda el anclaje se agota y la
                        // empuja hacia arriba con la barra de plantillas dentro.
                        // `Card` además trae `overflow: hidden`, que anula el
                        // `position: sticky` de esa barra.
                        overflow: 'visible'
                    }}
                >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="h5" fontWeight={600}>Contenido (Quarto)</Typography>
                            <Chip
                                size="small"
                                label={`${slides} slide${slides !== 1 ? 's' : ''}`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                        <Typography variant="caption" color="textSecondary" display="block" mb={1.5}>
                            Cada <strong>##</strong> abre una diapositiva y cada <strong>#</strong> una de
                            sección. La portada (logo + título + subtítulo) se genera automáticamente.
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Suspense fallback={<Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>}>
                            <Box sx={{ flex: 1, minHeight: { xs: 460, md: 0 } }}>
                                <QmdEditor
                                    value={form.content}
                                    onChange={(content) => setForm(f => ({ ...f, content }))}
                                    fill
                                />
                            </Box>
                        </Suspense>
                    </CardContent>
                </Card>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default PresentationForm;
