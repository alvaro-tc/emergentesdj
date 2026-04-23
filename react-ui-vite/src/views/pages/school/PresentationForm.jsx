import React, { useEffect, useState, useRef } from 'react';
import {
    Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
    Select, FormControl, InputLabel, Box, Chip, Divider, Alert, Snackbar,
    Paper, CircularProgress
} from '@mui/material';
import { IconArrowLeft, IconDeviceFloppy, IconPresentation, IconPhoto } from '@tabler/icons-react';
import axios from 'axios';
import config from '../../../config';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const THEMES = [
    { value: 'default',   label: 'Default',   bg: '#1c1c1c', fg: '#fff' },
    { value: 'ocean',     label: 'Ocean',     bg: '#1a6fa0', fg: '#fff' },
    { value: 'forest',    label: 'Forest',    bg: '#3d6b3f', fg: '#fff' },
    { value: 'sunset',    label: 'Sunset',    bg: '#8b3a3a', fg: '#e8d5b7' },
    { value: 'corporate', label: 'Corporate', bg: '#ffffff', fg: '#222' },
    { value: 'neon',      label: 'Neon',      bg: '#0d0d0d', fg: '#a855f7' },
];

const PLACEHOLDER_CONTENT = `## Primera Diapositiva

Escribe el contenido de esta diapositiva aquí.

- Punto importante 1
- Punto importante 2

---

## Segunda Diapositiva

Usa \`---\` para separar diapositivas.

---

## Tercera Diapositiva

Soporta **negrita**, *cursiva* y \`código\`.
`;

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

    const [form, setForm] = useState({
        subject: activeCourse?.subject || '',
        title: '',
        subtitle: '',
        autor: '',
        logo_url: '',
        logo_oscuro: '',
        theme: 'default',
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
                    theme: p.theme || 'default',
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

    // Light themes use logo_oscuro; dark themes use logo_url
    const LIGHT_THEMES = ['corporate'];
    const activeLogo = LIGHT_THEMES.includes(form.theme)
        ? (form.logo_oscuro || form.logo_url)
        : (form.logo_url || form.logo_oscuro);
    const activeLogoError = LIGHT_THEMES.includes(form.theme)
        ? (form.logo_oscuro ? logoOscuroError : logoError)
        : (form.logo_url ? logoError : logoOscuroError);

    const slideCount = () => {
        const extra = (form.content || '').split('---').filter(s => s.trim()).length;
        return 1 + extra; // +1 cover
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            setSnackbar({ open: true, message: 'El título es obligatorio.', severity: 'error' });
            return;
        }
        setAuthHeader();
        setSaving(true);
        try {
            const payload = { ...form, subject: form.subject || null };
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

    const selectedTheme = THEMES.find(t => t.value === form.theme) || THEMES[0];

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

            {/* Left column: fields */}
            <Grid size={{ xs: 12, lg: 4 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" fontWeight={600} gutterBottom>Datos de la Presentación</Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Materia (Opcional)</InputLabel>
                                    <Select
                                        value={form.subject}
                                        onChange={handleChange('subject')}
                                        label="Materia (Opcional)"
                                    >
                                        <MenuItem value=""><em>Sin asignar</em></MenuItem>
                                        {subjects.map(s => (
                                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                                        ))}
                                    </Select>
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
                                <TextField
                                    fullWidth size="small"
                                    label="Logo claro (temas oscuros)"
                                    value={form.logo_url}
                                    onChange={handleChange('logo_url')}
                                    InputProps={{ startAdornment: <IconPhoto size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
                                />
                                {form.logo_url && !logoError && (
                                    <Box mt={1} display="flex" justifyContent="center"
                                        sx={{ bgcolor: '#1c1c1c', borderRadius: 1, p: 1.5 }}>
                                        <img
                                            src={form.logo_url}
                                            alt="logo preview"
                                            onError={() => setLogoError(true)}
                                            style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }}
                                        />
                                    </Box>
                                )}
                                {form.logo_url && logoError && (
                                    <Alert severity="warning" sx={{ mt: 1, py: 0 }}>URL de imagen no válida o inaccesible.</Alert>
                                )}
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth size="small"
                                    label="Logo oscuro (temas claros)"
                                    value={form.logo_oscuro}
                                    onChange={handleChange('logo_oscuro')}
                                    InputProps={{ startAdornment: <IconPhoto size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
                                />
                                {form.logo_oscuro && !logoOscuroError && (
                                    <Box mt={1} display="flex" justifyContent="center"
                                        sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1.5 }}>
                                        <img
                                            src={form.logo_oscuro}
                                            alt="logo oscuro preview"
                                            onError={() => setLogoOscuroError(true)}
                                            style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }}
                                        />
                                    </Box>
                                )}
                                {form.logo_oscuro && logoOscuroError && (
                                    <Alert severity="warning" sx={{ mt: 1, py: 0 }}>URL de imagen no válida o inaccesible.</Alert>
                                )}
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" gutterBottom>Tema</Typography>
                                <Grid container spacing={1}>
                                    {THEMES.map(t => (
                                        <Grid key={t.value}>
                                            <Box
                                                onClick={() => setForm(f => ({ ...f, theme: t.value }))}
                                                sx={{
                                                    cursor: 'pointer',
                                                    px: 1.5, py: 0.8,
                                                    borderRadius: 1,
                                                    bgcolor: t.bg,
                                                    color: t.fg,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    border: form.theme === t.value ? '2px solid' : '2px solid transparent',
                                                    borderColor: form.theme === t.value ? 'primary.main' : 'transparent',
                                                    boxShadow: form.theme === t.value ? 3 : 1,
                                                    transition: 'all 0.15s',
                                                    userSelect: 'none',
                                                }}
                                            >
                                                {t.label}
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                            {/* Cover preview */}
                            <Grid size={12}>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>Vista previa de portada</Typography>
                                <Box sx={{
                                    bgcolor: selectedTheme.bg, color: selectedTheme.fg,
                                    borderRadius: 2, textAlign: 'center',
                                    minHeight: 160, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'space-between',
                                    p: 2, gap: 0,
                                }}>
                                    {/* Logo - top */}
                                    <Box sx={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {activeLogo && !activeLogoError && (
                                            <img src={activeLogo} alt="logo"
                                                style={{ maxHeight: 44, maxWidth: '80%', objectFit: 'contain' }} />
                                        )}
                                    </Box>
                                    {/* Title + Subtitle - center */}
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1 }}>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: selectedTheme.fg, lineHeight: 1.2 }}>
                                            {form.title || 'Título de la presentación'}
                                        </Typography>
                                        {form.subtitle && (
                                            <Typography variant="body2" sx={{ color: selectedTheme.fg, opacity: 0.8 }}>
                                                {form.subtitle}
                                            </Typography>
                                        )}
                                    </Box>
                                    {/* Author - bottom */}
                                    <Box sx={{ minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {form.autor && (
                                            <Typography variant="caption" sx={{ color: selectedTheme.fg, opacity: 0.75 }}>
                                                {form.autor}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Right column: markdown editor */}
            <Grid size={{ xs: 12, lg: 8 }}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="h5" fontWeight={600}>Contenido (Markdown)</Typography>
                            <Chip
                                size="small"
                                label={`${slideCount()} slide${slideCount() !== 1 ? 's' : ''}`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                        <Typography variant="caption" color="textSecondary" display="block" mb={1.5}>
                            Use <strong>---</strong> en una línea sola para separar diapositivas. La portada (logo + título + subtítulo) se genera automáticamente.
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <TextField
                            fullWidth
                            multiline
                            rows={28}
                            value={form.content}
                            onChange={handleChange('content')}
                            variant="outlined"
                            placeholder={PLACEHOLDER_CONTENT}
                            inputProps={{
                                style: {
                                    fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.6,
                                }
                            }}
                        />
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
