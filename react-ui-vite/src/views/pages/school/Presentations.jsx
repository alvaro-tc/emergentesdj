import React, { useCallback, useEffect, useState } from 'react';
import {
    Grid, Card, CardContent, Typography, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Chip, Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconPresentation, IconAlertTriangle, IconFileTypePdf } from '@tabler/icons-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import config from '../../../config';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { countSlides, splitSlides } from './presentation/qmd';
import { PALETTE_LABELS, THEMES, getThemeColors, hexToRgb, pickLogo } from './presentation/themes';

/** Colores de una presentación en el formato `[r, g, b]` que consume jsPDF. */
const pdfColors = (presentation) => {
    const colors = getThemeColors(presentation.theme, presentation.palette);
    return {
        bg: hexToRgb(colors.bg),
        fg: hexToRgb(colors.heading),
        muted: hexToRgb(colors.muted),
    };
};

const Presentations = () => {
    const account = useSelector((state) => state.account);
    const activeCourse = account.activeCourse;
    const navigate = useNavigate();

    const [presentations, setPresentations] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Las presentaciones cuelgan de la materia, no del curso: el curso activo
    // solo decide con qué materia se abre la pantalla.
    const [subjectId, setSubjectId] = useState(activeCourse?.subject || '');

    const setAuthHeader = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        }
    };

    useEffect(() => {
        setAuthHeader();
        axios.get(`${config.API_SERVER}subjects/`)
            .then(res => setSubjects(Array.isArray(res.data) ? res.data : (res.data.results ?? [])))
            .catch(console.error);
    }, []);

    const loadPresentations = useCallback(() => {
        setAuthHeader();
        setLoading(true);
        const params = subjectId ? `?subject=${subjectId}` : '';
        axios.get(`${config.API_SERVER}presentations/${params}`)
            .then(res => setPresentations(Array.isArray(res.data) ? res.data : (res.data.results ?? [])))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjectId]);

    useEffect(() => {
        loadPresentations();
    }, [loadPresentations]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        }
        axios.delete(`${config.API_SERVER}presentations/${deleteTarget.id}/`)
            .then(() => {
                setDeleteTarget(null);
                loadPresentations();
                setSnackbar({ open: true, message: 'Presentación eliminada.', severity: 'success' });
            })
            .catch(() => setSnackbar({ open: true, message: 'Error al eliminar.', severity: 'error' }));
    };

    const loadImageAsDataUrl = (url) =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });

    const exportToPdf = async (p) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const W = 297, H = 210;
        const colors = pdfColors(p);
        const [bgR, bgG, bgB] = colors.bg;
        const [fgR, fgG, fgB] = colors.fg;

        // --- Cover page ---
        doc.setFillColor(bgR, bgG, bgB);
        doc.rect(0, 0, W, H, 'F');

        // Misma portada que el deck: logo arriba y el texto arrancando a media
        // página, todo centrado horizontalmente.
        const coverLogo = pickLogo(p, p.palette);

        const logoY = 20;
        const logoH = 28;
        let cursorY = H / 2;
        if (coverLogo) {
            const dataUrl = await loadImageAsDataUrl(coverLogo);
            if (dataUrl) {
                const tmpImg = new Image();
                await new Promise(r => { tmpImg.onload = r; tmpImg.onerror = r; tmpImg.src = dataUrl; });
                const ratio = tmpImg.naturalWidth / tmpImg.naturalHeight;
                const logoW = Math.min(logoH * ratio, 80);
                doc.addImage(dataUrl, 'PNG', (W - logoW) / 2, logoY, logoW, logoH);
                // Un logo desmedido nunca debe quedar debajo del título.
                cursorY = Math.max(cursorY, logoY + logoH + 6);
            }
        }

        doc.setTextColor(fgR, fgG, fgB);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(p.title, W - 40);
        // La `y` de jsPDF es la línea base; se baja para que el texto *empiece*
        // a media página, como en el deck.
        cursorY += 8;
        doc.text(titleLines, W / 2, cursorY, { align: 'center' });
        cursorY += (titleLines.length - 1) * 10;

        if (p.subtitle) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(fgR, fgG, fgB);
            doc.setGState(doc.GState({ opacity: 0.75 }));
            cursorY += 10;
            doc.text(p.subtitle, W / 2, cursorY, { align: 'center' });
            doc.setGState(doc.GState({ opacity: 1 }));
        }

        if (p.autor) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(fgR, fgG, fgB);
            doc.setGState(doc.GState({ opacity: 0.75 }));
            cursorY += 12;
            doc.text(p.autor, W / 2, cursorY, { align: 'center' });
            doc.setGState(doc.GState({ opacity: 1 }));
        }

        // --- Content slides ---
        const slides = splitSlides(p.content).map(s => s.markdown);
        slides.forEach((slideContent, idx) => {
            doc.addPage();
            doc.setFillColor(bgR, bgG, bgB);
            doc.rect(0, 0, W, H, 'F');

            // Slide number
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(fgR, fgG, fgB);
            doc.setGState(doc.GState({ opacity: 0.4 }));
            doc.text(`${idx + 2} / ${slides.length + 1}`, W - 14, H - 8, { align: 'right' });
            doc.setGState(doc.GState({ opacity: 1 }));

            // Strip markdown syntax for plain text rendering
            const lines = slideContent.split('\n');
            let yPos = 20;
            lines.forEach((line) => {
                if (yPos > H - 20) return;
                const heading2 = line.match(/^##\s+(.*)/);
                const heading3 = line.match(/^###\s+(.*)/);
                const heading1 = line.match(/^#\s+(.*)/);
                const bullet = line.match(/^[-*]\s+(.*)/);
                const text = line.replace(/[*_`#]/g, '').trim();
                if (!text) { yPos += 4; return; }

                if (heading1) {
                    doc.setFontSize(22);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(fgR, fgG, fgB);
                    const wrapped = doc.splitTextToSize(heading1[1].replace(/[*_`]/g, ''), W - 40);
                    doc.text(wrapped, W / 2, yPos, { align: 'center' });
                    yPos += wrapped.length * 10 + 4;
                } else if (heading2) {
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(fgR, fgG, fgB);
                    const wrapped = doc.splitTextToSize(heading2[1].replace(/[*_`]/g, ''), W - 40);
                    doc.text(wrapped, W / 2, yPos, { align: 'center' });
                    yPos += wrapped.length * 8 + 4;
                } else if (heading3) {
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(fgR, fgG, fgB);
                    const wrapped = doc.splitTextToSize(heading3[1].replace(/[*_`]/g, ''), W - 40);
                    doc.text(wrapped, W / 2, yPos, { align: 'center' });
                    yPos += wrapped.length * 7 + 3;
                } else if (bullet) {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(fgR, fgG, fgB);
                    const bulletText = '• ' + bullet[1].replace(/[*_`]/g, '');
                    const wrapped = doc.splitTextToSize(bulletText, W - 60);
                    doc.text(wrapped, 30, yPos);
                    yPos += wrapped.length * 6 + 2;
                } else {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(fgR, fgG, fgB);
                    const wrapped = doc.splitTextToSize(text, W - 40);
                    doc.text(wrapped, W / 2, yPos, { align: 'center' });
                    yPos += wrapped.length * 6 + 2;
                }
            });
        });

        doc.save(`${p.title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'presentacion'}.pdf`);
    };

    const orphanCount = presentations.filter(p => !p.subject).length;

    return (
        <Grid container spacing={3}>
            <Grid size={12}>
                <Card>
                    <CardContent>
                        <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                            <Grid>
                                <Typography variant="h3">Presentaciones</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    El material pertenece a la materia y se reutiliza en todos sus cursos.
                                </Typography>
                            </Grid>
                            <Grid sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControl size="small" sx={{ minWidth: 240 }}>
                                    <InputLabel>Materia</InputLabel>
                                    <Select
                                        value={subjectId}
                                        onChange={(e) => setSubjectId(e.target.value)}
                                        label="Materia"
                                    >
                                        <MenuItem value=""><em>Todas las materias</em></MenuItem>
                                        {subjects.map(s => (
                                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<IconPlus />}
                                    onClick={() => navigate('/dashboard/presentations/new')}
                                >
                                    Nueva Presentación
                                </Button>
                            </Grid>
                        </Grid>
                        {!subjectId && orphanCount > 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                {orphanCount === 1
                                    ? 'Hay 1 presentación sin materia asignada. Edítala para asignarle una.'
                                    : `Hay ${orphanCount} presentaciones sin materia asignada. Edítalas para asignarles una.`}
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={12}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Título</TableCell>
                                <TableCell>Materia</TableCell>
                                <TableCell>Tema</TableCell>
                                <TableCell>Slides</TableCell>
                                <TableCell>Última Modificación</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {presentations.map(p => {
                                const colors = getThemeColors(p.theme, p.palette);
                                const themeLabel = (THEMES[p.theme] || THEMES.quarto).label;
                                return (
                                    <TableRow key={p.id} hover>
                                        <TableCell>
                                            <Typography variant="caption" color="textSecondary">#{p.id}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight={600}>{p.title}</Typography>
                                            {p.subtitle && (
                                                <Typography variant="caption" color="textSecondary">{p.subtitle}</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {p.subject_name
                                                ? <Typography variant="body2">{p.subject_name}</Typography>
                                                : <Chip size="small" color="warning" variant="outlined" label="Sin materia" />}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={`${themeLabel} · ${PALETTE_LABELS[p.palette] || PALETTE_LABELS.dark}`}
                                                sx={{
                                                    bgcolor: colors.bg,
                                                    color: colors.heading,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={`${1 + countSlides(p.content)} slides`} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {new Date(p.updated_at).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Presentar">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => window.open(`/present/${p.id}`, '_blank')}
                                                >
                                                    <IconPresentation size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Exportar PDF">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => exportToPdf(p)}
                                                >
                                                    <IconFileTypePdf size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/dashboard/presentations/${p.id}/edit`)}
                                                >
                                                    <IconEdit size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setDeleteTarget(p)}
                                                >
                                                    <IconTrash size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {presentations.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                                            No hay presentaciones. Crea la primera con el botón superior.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>

            {/* Delete dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Presentación</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" icon={<IconAlertTriangle />}>
                        ¿Eliminar <strong>{deleteTarget?.title}</strong>? Esta acción no se puede deshacer.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default Presentations;
