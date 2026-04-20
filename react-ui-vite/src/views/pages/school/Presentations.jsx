import React, { useEffect, useState } from 'react';
import {
    Grid, Card, CardContent, Typography, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Chip, Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconPresentation, IconAlertTriangle } from '@tabler/icons-react';
import axios from 'axios';
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
