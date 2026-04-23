import React, { useEffect, useState } from 'react';
import {
    Grid, Card, CardContent, Typography, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Chip, Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconPresentation, IconAlertTriangle, IconFileTypePdf } from '@tabler/icons-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import config from '../../../config';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const THEME_LABELS = {
    default:   { label: 'Default',   color: '#555' },
    ocean:     { label: 'Ocean',     color: '#0ea5e9' },
    forest:    { label: 'Forest',    color: '#22c55e' },
    sunset:    { label: 'Sunset',    color: '#f97316' },
    corporate: { label: 'Corporate', color: '#6366f1' },
    neon:      { label: 'Neon',      color: '#a855f7' },
};

const Presentations = () => {
    const account = useSelector((state) => state.account);
    const activeCourse = account.activeCourse;
    const navigate = useNavigate();

    const [presentations, setPresentations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const subjectId = activeCourse?.subject;

    useEffect(() => {
        loadPresentations();
    }, [subjectId]);

    const loadPresentations = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        }
        setLoading(true);
        const params = subjectId ? `?subject=${subjectId}` : '';
        axios.get(`${config.API_SERVER}presentations/${params}`)
            .then(res => setPresentations(Array.isArray(res.data) ? res.data : (res.data.results ?? [])))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

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

    const slideCount = (content) => {
        if (!content) return 1;
        return (content.split('---').length) + 1; // +1 for cover
    };

    const THEME_COLORS = {
        default:   { bg: [28, 28, 28],    fg: [255, 255, 255] },
        ocean:     { bg: [26, 111, 160],   fg: [255, 255, 255] },
        forest:    { bg: [61, 107, 63],    fg: [255, 255, 255] },
        sunset:    { bg: [139, 58, 58],    fg: [232, 213, 183] },
        corporate: { bg: [255, 255, 255],  fg: [34, 34, 34] },
        neon:      { bg: [13, 13, 13],     fg: [168, 85, 247] },
    };

    const LIGHT_THEMES = ['corporate'];

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
                } catch (_) { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });

    const exportToPdf = async (p) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const W = 297, H = 210;
        const colors = THEME_COLORS[p.theme] || THEME_COLORS.default;
        const [bgR, bgG, bgB] = colors.bg;
        const [fgR, fgG, fgB] = colors.fg;

        // --- Cover page ---
        doc.setFillColor(bgR, bgG, bgB);
        doc.rect(0, 0, W, H, 'F');

        const coverLogo = LIGHT_THEMES.includes(p.theme)
            ? (p.logo_oscuro || p.logo_url)
            : (p.logo_url || p.logo_oscuro);

        let logoY = 20;
        const logoH = 28;
        if (coverLogo) {
            const dataUrl = await loadImageAsDataUrl(coverLogo);
            if (dataUrl) {
                const tmpImg = new Image();
                await new Promise(r => { tmpImg.onload = r; tmpImg.onerror = r; tmpImg.src = dataUrl; });
                const ratio = tmpImg.naturalWidth / tmpImg.naturalHeight;
                const logoW = Math.min(logoH * ratio, 80);
                doc.addImage(dataUrl, 'PNG', (W - logoW) / 2, logoY, logoW, logoH);
            }
        }

        // Title centered vertically
        doc.setTextColor(fgR, fgG, fgB);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(p.title, W - 40);
        const titleY = H / 2 - (titleLines.length * 10) / 2;
        doc.text(titleLines, W / 2, titleY, { align: 'center' });

        if (p.subtitle) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(fgR, fgG, fgB);
            doc.setGState(doc.GState({ opacity: 0.75 }));
            doc.text(p.subtitle, W / 2, titleY + titleLines.length * 10 + 8, { align: 'center' });
            doc.setGState(doc.GState({ opacity: 1 }));
        }

        if (p.autor) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(fgR, fgG, fgB);
            doc.setGState(doc.GState({ opacity: 0.75 }));
            doc.text(p.autor, W / 2, H - 18, { align: 'center' });
            doc.setGState(doc.GState({ opacity: 1 }));
        }

        // --- Content slides ---
        const slides = (p.content || '').split(/\n---\n|^---\n/m).map(s => s.trim()).filter(Boolean);
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

    const subjectName = activeCourse
        ? (activeCourse.subject_details?.name || activeCourse.subject?.name || '')
        : '';

    return (
        <Grid container spacing={3}>
            <Grid size={12}>
                <Card>
                    <CardContent>
                        <Grid container alignItems="center" justifyContent="space-between">
                            <Grid>
                                <Typography variant="h3">
                                    Presentaciones{subjectName ? `: ${subjectName}` : ''}
                                </Typography>
                                {!activeCourse && (
                                    <Typography variant="caption" color="textSecondary">
                                        Seleccione un curso para filtrar por materia
                                    </Typography>
                                )}
                            </Grid>
                            <Grid>
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
                                <TableCell>Subtítulo</TableCell>
                                <TableCell>Tema</TableCell>
                                <TableCell>Slides</TableCell>
                                <TableCell>Última Modificación</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {presentations.map(p => {
                                const theme = THEME_LABELS[p.theme] || THEME_LABELS.default;
                                return (
                                    <TableRow key={p.id} hover>
                                        <TableCell>
                                            <Typography variant="caption" color="textSecondary">#{p.id}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight={600}>{p.title}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="textSecondary">{p.subtitle || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={theme.label}
                                                sx={{ bgcolor: theme.color + '22', color: theme.color, fontWeight: 600, borderColor: theme.color, border: '1px solid' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={`${slideCount(p.content)} slides`} />
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
