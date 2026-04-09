import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Card, CardContent, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, LinearProgress, Chip, Snackbar
} from '@mui/material';
import MainCard from '../../../ui-component/cards/MainCard';
import { IconTrash, IconEdit, IconPlus, IconLock, IconStar } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';


const Weightings = () => {
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);

    const [criteria, setCriteria] = useState([]);
    const [subCriteria, setSubCriteria] = useState([]);
    const [specialCriteria, setSpecialCriteria] = useState([]);

    // eslint-disable-next-line
    const [loading, setLoading] = useState(true);

    // Regular SubCriteria Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [currentSubCriterion, setCurrentSubCriterion] = useState(null);
    const [parentCriterionId, setParentCriterionId] = useState(null);
    const [formData, setFormData] = useState({ name: '', percentage: '' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Special Criteria Dialog State
    const [openSpecialDialog, setOpenSpecialDialog] = useState(false);
    const [currentSpecialCriterion, setCurrentSpecialCriterion] = useState(null);
    const [specialParentId, setSpecialParentId] = useState(null);
    const [specialFormData, setSpecialFormData] = useState({ name: '', percentage: '' });
    const [deleteSpecialConfirmOpen, setDeleteSpecialConfirmOpen] = useState(false);
    const [specialItemToDelete, setSpecialItemToDelete] = useState(null);



    // Snackbar State
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const fetchData = () => {
        if (!activeCourse) return;

        setLoading(true);
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

        // 1. Fetch Subject Criteria (via EvaluationTemplate)
        const templateId = activeCourse.subject_details?.evaluation_template;

        const fetchCriteriaReq = templateId
            ? axios.get(`${configData.API_SERVER}evaluation-templates/${templateId}`)
            : Promise.resolve({ data: { criteria: [] } });

        // 2. Fetch Course SubCriteria
        const fetchSubCriteriaReq = axios.get(`${configData.API_SERVER}course-sub-criteria/?course=${activeCourse.id}`);

        // 3. Fetch Course Special Criteria
        const fetchSpecialCriteriaReq = axios.get(`${configData.API_SERVER}course-special-criteria/?course=${activeCourse.id}`);

        Promise.all([fetchCriteriaReq, fetchSubCriteriaReq, fetchSpecialCriteriaReq])
            .then(([criteriaRes, subCriteriaRes, specialRes]) => {
                setCriteria(criteriaRes.data.criteria || []);
                setSubCriteria(subCriteriaRes.data);
                setSpecialCriteria(specialRes.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (activeCourse) {
            fetchData();
        }
        // eslint-disable-next-line
    }, [activeCourse, account.token]);

    // --- Regular SubCriteria Handlers ---

    const handleOpenDialog = (parentCritId, subCrit = null) => {
        setParentCriterionId(parentCritId);
        setCurrentSubCriterion(subCrit);
        setFormData(subCrit ? { name: subCrit.name, percentage: subCrit.percentage } : { name: '', percentage: '' });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentSubCriterion(null);
        setFormData({ name: '', percentage: '' });
    };

    const handleSave = () => {
        // Validation: Check if total points exceed parent criterion weight
        const parent = criteria.find(c => c.id === parentCriterionId);
        if (parent) {
            const currentSubs = subCriteria.filter(s => s.parent_criterion === parentCriterionId);
            const otherSubs = currentSubCriterion
                ? currentSubs.filter(s => s.id !== currentSubCriterion.id)
                : currentSubs;

            const currentTotal = otherSubs.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0);
            const newVal = parseFloat(formData.percentage);
            const maxVal = parseFloat(parent.weight);

            if (currentTotal + newVal > maxVal) {
                showSnackbar(`No puedes asignar más puntaje. El límite del criterio es ${maxVal} Pts. (Actual: ${currentTotal} + Nuevo: ${newVal} = ${currentTotal + newVal})`, "error");
                return;
            }
        }

        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        const payload = {
            ...formData,
            course: activeCourse.id,
            parent_criterion: parentCriterionId
        };

        if (currentSubCriterion) {
            axios.put(`${configData.API_SERVER}course-sub-criteria/${currentSubCriterion.id}/`, payload)
                .then(() => {
                    fetchData();
                    handleCloseDialog();
                    showSnackbar("Sub-criterio actualizado correctamente", "success");
                })
                .catch(err => {
                    console.error("Error updating sub-criterion:", err);
                    showSnackbar("Error al actualizar sub-criterio", "error");
                });
        } else {
            axios.post(`${configData.API_SERVER}course-sub-criteria/`, payload)
                .then(() => {
                    fetchData();
                    handleCloseDialog();
                    showSnackbar("Sub-criterio creado correctamente", "success");
                })
                .catch(err => {
                    console.error("Error creating sub-criterion:", err);
                    showSnackbar("Error al crear sub-criterio", "error");
                });
        }
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.delete(`${configData.API_SERVER}course-sub-criteria/${itemToDelete}/`)
            .then(() => {
                fetchData();
                setDeleteConfirmOpen(false);
            })
            .catch(err => console.error("Error deleting sub-criterion:", err));
    };

    // --- Special Criteria Handlers ---

    const handleOpenSpecialDialog = (parentCritId, item = null) => {
        setSpecialParentId(parentCritId);
        setCurrentSpecialCriterion(item);
        setSpecialFormData(item ? { name: item.name, percentage: item.percentage } : { name: '', percentage: '' });
        setOpenSpecialDialog(true);
    };

    const handleCloseSpecialDialog = () => {
        setOpenSpecialDialog(false);
        setCurrentSpecialCriterion(null);
        setSpecialFormData({ name: '', percentage: '' });
    };

    const handleSaveSpecial = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        const payload = {
            ...specialFormData,
            course: activeCourse.id,
            parent_criterion: specialParentId
        };

        const request = currentSpecialCriterion
            ? axios.put(`${configData.API_SERVER}course-special-criteria/${currentSpecialCriterion.id}/`, payload)
            : axios.post(`${configData.API_SERVER}course-special-criteria/`, payload);

        request
            .then(() => {
                fetchData();
                handleCloseSpecialDialog();
                showSnackbar(currentSpecialCriterion ? "Criterio especial actualizado" : "Criterio especial creado", "success");
            })
            .catch(err => {
                console.error("Error saving special criterion:", err);
                const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Error al guardar. Verifique los datos.";
                showSnackbar(msg, "error");
            });
    };

    const handleDeleteSpecialClick = (id) => {
        setSpecialItemToDelete(id);
        setDeleteSpecialConfirmOpen(true);
    };

    const handleConfirmDeleteSpecial = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.delete(`${configData.API_SERVER}course-special-criteria/${specialItemToDelete}/`)
            .then(() => {
                fetchData();
                setDeleteSpecialConfirmOpen(false);
            })
            .catch(err => console.error("Error deleting special criterion:", err));
    };


    if (!activeCourse) {
        return (
            <MainCard title="Ponderaciones">
                <Alert severity="warning">Por favor seleccione un Paralelo en el buscador superior para verificar sus ponderaciones.</Alert>
            </MainCard>
        );
    }

    return (
        <MainCard title={
            <Grid container justifyContent="space-between" alignItems="center">
                <Typography variant="h3">Ponderaciones - {activeCourse.subject_details?.name}</Typography>
            </Grid>
        }>
            {!activeCourse.subject_details?.evaluation_template && (
                <Alert severity="error">Esta materia no tiene un Modelo de Evaluación asignado. Contacte al administrador.</Alert>
            )}

            {criteria.map((criterion) => {
                const criterionSubCriteria = subCriteria.filter(sc => sc.parent_criterion === criterion.id);
                // We create a combined list, but "Special" ones are filtered separately to display with specific styling
                const criterionSpecialCriteria = specialCriteria.filter(sc => sc.parent_criterion === criterion.id);

                const totalRegularPoints = criterionSubCriteria.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0);

                return (
                    <Card key={criterion.id} sx={{ mb: 2, border: '1px solid', borderColor: 'grey.400', boxShadow: 2 }}>
                        <CardContent>
                            <Grid container justifyContent="space-between" alignItems="center">
                                <Typography variant="h4" color="primary">
                                    {criterion.name} ({parseFloat(criterion.weight)} Pts de la Nota Final)
                                </Typography>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<IconStar size="1rem" />}
                                        onClick={() => handleOpenSpecialDialog(criterion.id)}
                                    >
                                        Puntos Extra
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="small"
                                        startIcon={<IconPlus size="1rem" />}
                                        onClick={() => handleOpenDialog(criterion.id)}
                                        disabled={totalRegularPoints >= parseFloat(criterion.weight)}
                                    >
                                        Añadir Sub-criterio
                                    </Button>
                                </div>
                            </Grid>

                            <LinearProgress
                                variant="determinate"
                                value={parseFloat(criterion.weight) > 0 ? (totalRegularPoints / parseFloat(criterion.weight)) * 100 : 0}
                                sx={{ height: 10, borderRadius: 5, mt: 1, mb: 1 }}
                                color={totalRegularPoints >= parseFloat(criterion.weight) ? "primary" : "secondary"}
                            />
                            <Typography variant="caption" align="right" display="block">
                                Total Asignado: {totalRegularPoints} Pts / {parseFloat(criterion.weight)} Pts
                            </Typography>

                            <TableContainer sx={{ mt: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell align="right">Valor</TableCell>
                                            <TableCell align="center">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Regular SubCriteria */}
                                        {criterionSubCriteria.length === 0 && criterionSpecialCriteria.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">No hay sub-criterios definidos.</TableCell>
                                            </TableRow>
                                        ) : (
                                            <>
                                                {criterionSubCriteria.map((sub) => (
                                                    <TableRow key={`sub-${sub.id}`}>
                                                        <TableCell>{sub.name}</TableCell>
                                                        <TableCell align="right">{sub.percentage} Pts</TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="Editar">
                                                                <IconButton color="primary" onClick={() => handleOpenDialog(criterion.id, sub)}>
                                                                    <IconEdit size="1.1rem" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Eliminar">
                                                                <IconButton color="error" onClick={() => handleDeleteClick(sub.id)}>
                                                                    <IconTrash size="1.1rem" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {/* Special Criteria */}
                                                {criterionSpecialCriteria.map((special) => (
                                                    <TableRow key={`special-${special.id}`} sx={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800', '&:hover': { backgroundColor: '#ffe0b2 !important' } }}>
                                                        <TableCell>
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <IconStar size="1rem" style={{ marginRight: 8, color: '#f57c00' }} />
                                                                <strong>{special.name}</strong>
                                                                <Chip label="Extra" size="small" style={{ marginLeft: 8, height: 20, backgroundColor: '#ffe0b2', color: '#e65100' }} />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell align="right" style={{ color: '#e65100', fontWeight: 'bold' }}>
                                                            +{special.percentage} pts
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="Editar">
                                                                <IconButton color="primary" onClick={() => handleOpenSpecialDialog(criterion.id, special)}>
                                                                    <IconEdit size="1.1rem" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Eliminar">
                                                                <IconButton color="error" onClick={() => handleDeleteSpecialClick(special.id)}>
                                                                    <IconTrash size="1.1rem" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                );
            })
            }

            {/* Dialog for Add/Edit Regular SubCriteria */}
            < Dialog open={openDialog} onClose={handleCloseDialog} >
                <DialogTitle>{currentSubCriterion ? 'Editar Sub-criterio' : 'Añadir Sub-criterio'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nombre"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Valor (Puntos)"
                        type="number"
                        fullWidth
                        value={formData.percentage}
                        onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                        helperText="Puntos para este sub-criterio"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">Cancelar</Button>
                    <Button onClick={handleSave} color="primary" variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Regular */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de que desea eliminar este sub-criterio?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for Add/Edit Special Criteria */}
            <Dialog open={openSpecialDialog} onClose={handleCloseSpecialDialog}>
                <DialogTitle>{currentSpecialCriterion ? 'Editar Puntos Extra' : 'Añadir Puntos Extra'}</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" style={{ marginBottom: 10 }}>
                        Estos puntos se sumarán adicionalmente a la nota.
                    </Alert>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Motivo / Nombre"
                        fullWidth
                        value={specialFormData.name}
                        onChange={(e) => setSpecialFormData({ ...specialFormData, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Puntos Extra"
                        type="number"
                        fullWidth
                        value={specialFormData.percentage}
                        onChange={(e) => setSpecialFormData({ ...specialFormData, percentage: e.target.value })}
                        helperText="Cantidad de puntos a sumar"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSpecialDialog} color="primary">Cancelar</Button>
                    <Button onClick={handleSaveSpecial} color="primary" variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Special */}
            <Dialog open={deleteSpecialConfirmOpen} onClose={() => setDeleteSpecialConfirmOpen(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de que desea eliminar este criterio especial? Se descontarán los puntos extra.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteSpecialConfirmOpen(false)} color="primary">Cancelar</Button>
                    <Button onClick={handleConfirmDeleteSpecial} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} elevation={6} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </MainCard >
    );
};

export default Weightings;
