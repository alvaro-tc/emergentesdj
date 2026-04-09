import React, { useEffect, useState } from 'react';
import {
    Grid,
    Button,
    Card,
    CardContent,
    Typography,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    FormControl,
    InputLabel,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    Divider,
    Checkbox,
    List,
    ListItem,
    ListItemText,
    InputAdornment,
    Collapse,
    ListItemSecondaryAction,
    Snackbar,
    Alert,
    Switch,
    FormControlLabel
} from '@mui/material';
import { IconPlus, IconTrash, IconUsers, IconUserCheck, IconTarget, IconSearch, IconX, IconSettings, IconAlertTriangle } from '@tabler/icons-react';
// Rename or use directly
import axios from 'axios';
import config from '../../../config';
import { useSelector } from 'react-redux';
import ManageProjectDialog from './components/ManageProjectDialog';
import { useLocation, useNavigate } from 'react-router-dom';

const Projects = () => {
    const activeCourse = useSelector((state) => state.account.activeCourse);
    const location = useLocation();
    const navigate = useNavigate();

    const [subCriteria, setSubCriteria] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedSubCriterion, setSelectedSubCriterion] = useState('');

    // Dialogs State
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

    // Edit Rules State
    const [editRulesDialogOpen, setEditRulesDialogOpen] = useState(false);
    const [subCriterionToEdit, setSubCriterionToEdit] = useState(null);
    const [maxMembersInput, setMaxMembersInput] = useState('');
    const [registrationOpen, setRegistrationOpen] = useState(false);
    const [registrationStart, setRegistrationStart] = useState('');
    const [registrationEnd, setRegistrationEnd] = useState('');

    const [pendingToggle, setPendingToggle] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);

    // Manage UI State
    // Manage UI State
    const [createMemberSearchQuery, setCreateMemberSearchQuery] = useState('');

    // Snackbar State
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Create Form Data
    const [createFormData, setCreateFormData] = useState({
        name: '',
        description: '',
        sub_criterion: '',
        student_in_charge: '',
        members: []
    });

    // Manage Form Data
    const [currentProject, setCurrentProject] = useState(null);

    // Load Data when Course Changes
    useEffect(() => {
        if (activeCourse) {
            loadData();
        }
    }, [activeCourse]);

    // Check for URL parameter to pre-select sub-criterion
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subCritId = params.get('sub_criterion');
        if (subCritId && subCriteria.length > 0) {
            setSelectedSubCriterion(parseInt(subCritId));
        }
    }, [location.search, subCriteria]);

    const loadData = () => {
        Promise.all([
            axios.get(`${config.API_SERVER}enrollments/?course=${activeCourse.id}`),
            axios.get(`${config.API_SERVER}course-sub-criteria/?course=${activeCourse.id}`),
            axios.get(`${config.API_SERVER}projects/?course=${activeCourse.id}`)
        ]).then(([enrollRes, subCritRes, projRes]) => {
            setEnrollments(enrollRes.data);
            setSubCriteria(subCritRes.data);
            setProjects(projRes.data);

            // Auto-select if only one project sub-criterion exists
            const projectSubs = subCritRes.data.filter(sc => sc.is_project);
            if (projectSubs.length === 1 && !selectedSubCriterion) {
                setSelectedSubCriterion(projectSubs[0].id);
            }
        }).catch(err => {
            console.error(err);
        });
    };

    // Assign Project Dialog (Toggle SubCriterion is_project)
    const handleRequestToggle = (subCriterionId) => {
        const subCrit = subCriteria.find(sc => sc.id === subCriterionId);
        if (!subCrit) return;

        setPendingToggle({ id: subCriterionId, currentState: subCrit.is_project });
        setConfirmDialogOpen(true);
    };

    const handleConfirmToggle = () => {
        if (!pendingToggle) return;

        const payload = {
            is_project: !pendingToggle.currentState
        };

        // Only send max_members if marking as project
        if (!pendingToggle.currentState) {
            payload.max_members = maxMembersInput === '' ? null : parseInt(maxMembersInput);
        }

        axios.patch(`${config.API_SERVER}course-sub-criteria/${pendingToggle.id}/`, payload)
            .then(() => {
                setConfirmDialogOpen(false);
                setPendingToggle(null);
                setMaxMembersInput('');
                loadData();
            }).catch(err => {
                console.error(err);
                setConfirmDialogOpen(false);
                setPendingToggle(null);
            });
    };

    // Edit Rules Handlers
    const handleOpenEditRules = (sc) => {
        setSubCriterionToEdit(sc);
        setMaxMembersInput(sc.max_members || '');
        setRegistrationOpen(sc.is_project_registration_open || false);

        const formatForInput = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setRegistrationStart(formatForInput(sc.registration_start));
        setRegistrationEnd(formatForInput(sc.registration_end));
        setEditRulesDialogOpen(true);
    };

    const handleSaveRules = () => {
        if (!subCriterionToEdit) return;

        const payload = {
            max_members: maxMembersInput === '' ? null : parseInt(maxMembersInput),
            is_project_registration_open: registrationOpen,
            registration_start: registrationStart ? registrationStart : null,
            registration_end: registrationEnd ? registrationEnd : null
        };
        console.log("Sending Payload:", payload);

        axios.patch(`${config.API_SERVER}course-sub-criteria/${subCriterionToEdit.id}/`, payload).then(() => {
            setEditRulesDialogOpen(false);
            setSubCriterionToEdit(null);
            setMaxMembersInput('');
            loadData();
            showSnackbar('Reglas actualizadas correctamente.', 'success');
        }).catch(err => {
            console.error(err);
            showSnackbar('Error al actualizar reglas.', 'error');
        });
    };

    // Create Handlers
    const handleOpenCreateDialog = () => {
        setCreateFormData({
            name: '',
            description: '',
            sub_criterion: selectedSubCriterion || '',
            student_in_charge: '',
            members: []
        });
        setCreateMemberSearchQuery('');
        setCreateDialogOpen(true);
    };

    const handleCreateInputChange = (e) => {
        setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
    };

    const handleCreateMemberToggle = (enrollmentId) => {
        const currentMembers = [...createFormData.members];
        const index = currentMembers.indexOf(enrollmentId);
        if (index === -1) {
            currentMembers.push(enrollmentId);
        } else {
            currentMembers.splice(index, 1);
            if (createFormData.student_in_charge === enrollmentId) {
                setCreateFormData(prev => ({ ...prev, student_in_charge: '', members: currentMembers }));
                return;
            }
        }
        setCreateFormData({ ...createFormData, members: currentMembers });
    };

    const getUnavailableStudentIds = (subCriterionId, excludeProjectId = null) => {
        if (!subCriterionId) return [];
        const ids = [];
        projects.forEach(p => {
            if (p.sub_criterion === subCriterionId && p.id !== excludeProjectId) {
                ids.push(...p.members);
            }
        });
        return ids;
    };

    const handleCreateSave = () => {
        if (!activeCourse) return;
        if (!createFormData.name || !createFormData.sub_criterion) {
            alert('Nombre y Sub-Criterio son obligatorios');
            return;
        }

        // Local max_members check
        const selectedSc = subCriteria.find(sc => sc.id === createFormData.sub_criterion);
        if (selectedSc && selectedSc.max_members && createFormData.members.length > selectedSc.max_members) {
            showSnackbar(`El proyecto excede el límite de ${selectedSc.max_members} integrantes.`, 'error');
            return;
        }

        const payload = {
            ...createFormData,
            course: activeCourse.id,
            score: 0
        };

        axios.post(`${config.API_SERVER}projects/`, payload)
            .then(() => {
                setCreateDialogOpen(false);
                loadData();
                showSnackbar('Proyecto creado exitosamente', 'success');
            })
            .catch(err => {
                console.error(err);
                if (err.response && err.response.data && err.response.data[0]) {
                    showSnackbar(err.response.data[0], 'error');
                } else if (err.response && err.response.data && typeof err.response.data === 'object') {
                    // Try to get first value of first key
                    const key = Object.keys(err.response.data)[0];
                    if (key) showSnackbar(`${key}: ${err.response.data[key]}`, 'error');
                    else showSnackbar('Error al crear proyecto', 'error');
                } else {
                    showSnackbar('Error al crear proyecto', 'error');
                }
            });
    };

    // Manage Handlers
    const handleOpenManageDialog = (project) => {
        // Calculate max score from sub-criterion
        let maxScore = 100;
        const subCrit = subCriteria.find(sc => sc.id === project.sub_criterion);
        if (subCrit) {
            maxScore = subCrit.percentage;
        }

        setCurrentProject({ ...project, maxScore });
        setManageDialogOpen(true);
    };

    const handleManageSave = (formData) => {
        if (!currentProject) return;

        const payload = {
            ...formData,
            course: activeCourse.id,
            score: formData.score === '' ? null : formData.score
        };

        axios.put(`${config.API_SERVER}projects/${currentProject.id}/`, payload)
            .then(() => {
                setManageDialogOpen(false);
                loadData();
                showSnackbar('Cambios guardados exitosamente', 'success');
            })
            .catch(err => {
                console.error(err);
                if (err.response && err.response.data && err.response.data[0]) {
                    showSnackbar(err.response.data[0], 'error');
                } else if (err.response && err.response.data && typeof err.response.data === 'object') {
                    // Try to get first value of first key
                    const key = Object.keys(err.response.data)[0];
                    if (key) showSnackbar(`${key}: ${err.response.data[key]}`, 'error');
                    else showSnackbar('Error al actualizar proyecto', 'error');
                } else {
                    showSnackbar('Error al actualizar proyecto', 'error');
                }
            });
    };

    const handleDeleteClick = (project) => {
        setProjectToDelete(project);
        setDeleteConfirmDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!projectToDelete) return;

        axios.delete(`${config.API_SERVER}projects/${projectToDelete.id}/`)
            .then(() => {
                setDeleteConfirmDialogOpen(false);
                setProjectToDelete(null);
                loadData();
            })
            .catch(err => console.error(err));
    };

    const getSubCriteriaName = (id) => {
        const sc = subCriteria.find(c => c.id === id);
        return sc ? sc.name : 'Unknown';
    };

    const subjectName = activeCourse ? (activeCourse.subject_details?.name || activeCourse.subject?.name || 'Materia') : '';
    const projectSubCriteria = subCriteria.filter(sc => sc.is_project);

    const filteredProjects = selectedSubCriterion
        ? projects.filter(p => p.sub_criterion === selectedSubCriterion)
        : projects;

    if (!activeCourse) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h3" gutterBottom>Proyectos</Typography>
                    <Alert severity="warning">Seleccione un curso para gestionar los proyectos.</Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Grid container spacing={3}>
            <Grid size={12}>
                <Card>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                            <Grid>
                                <Typography variant="h3">
                                    Proyectos: {activeCourse ? `${subjectName} - ${activeCourse.parallel}` : 'Seleccione un Curso'}
                                </Typography>
                            </Grid>
                            <Grid>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<IconTarget />}
                                    onClick={() => setAssignDialogOpen(true)}
                                    disabled={!activeCourse}
                                    style={{ marginRight: 8 }}
                                >
                                    Asignar Proyecto
                                </Button>
                                {selectedSubCriterion && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<IconSettings />}
                                        onClick={() => {
                                            const sc = subCriteria.find(s => s.id === selectedSubCriterion);
                                            if (sc) handleOpenEditRules(sc);
                                        }}
                                        style={{ marginRight: 8 }}
                                    >
                                        Configurar Inscripción
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<IconPlus />}
                                    onClick={handleOpenCreateDialog}
                                    disabled={!activeCourse || projectSubCriteria.length === 0}
                                >
                                    Crear Proyecto
                                </Button>
                            </Grid>
                        </Grid>

                        {/* SubCriterion Selector */}
                        {projectSubCriteria.length > 0 && (
                            <Grid container spacing={2} style={{ marginTop: 16 }}>
                                <Grid
                                    size={{
                                        xs: 12,
                                        sm: 6
                                    }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Filtrar por Sub-Criterio</InputLabel>
                                        <Select
                                            value={selectedSubCriterion}
                                            onChange={(e) => setSelectedSubCriterion(e.target.value)}
                                            label="Filtrar por Sub-Criterio"
                                        >
                                            <MenuItem value="">
                                                <em>Todos los Proyectos</em>
                                            </MenuItem>
                                            {projectSubCriteria.map(sc => (
                                                <MenuItem key={sc.id} value={sc.id}>
                                                    {sc.name} ({sc.percentage}%)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={12}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre del Proyecto</TableCell>
                                <TableCell>Líder</TableCell>
                                <TableCell>Miembros</TableCell>
                                <TableCell>
                                    {selectedSubCriterion ? (
                                        (() => {
                                            const sc = subCriteria.find(s => s.id === selectedSubCriterion);
                                            return `Calificación (0-${sc ? sc.percentage : '?'})`;
                                        })()
                                    ) : 'Calificación (Puntos)'}
                                </TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProjects.map(project => (
                                <TableRow key={project.id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{project.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">{project.description}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const leader = enrollments.find(e => e.id === project.student_in_charge);
                                            return leader ? (
                                                <Chip
                                                    icon={<IconUserCheck size="1rem" />}
                                                    label={`${leader.student_details?.first_name} ${leader.student_details?.paternal_surname}`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ) : '-';
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {project.members && project.members.map(memId => {
                                                const mem = enrollments.find(e => e.id === memId);
                                                if (!mem) return null;
                                                return (
                                                    <Tooltip title={`${mem.student_details?.first_name} ${mem.student_details?.paternal_surname}`} key={memId}>
                                                        <Avatar style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                                            {mem.student_details?.first_name?.[0]}{mem.student_details?.paternal_surname?.[0]}
                                                        </Avatar>
                                                    </Tooltip>
                                                );
                                            })}
                                            <Typography variant="caption" style={{ alignSelf: 'center', marginLeft: 4 }}>
                                                ({project.members.length})
                                            </Typography>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h4" color={project.score ? 'primary' : 'textSecondary'}>
                                            {project.score || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<IconUsers />}
                                            onClick={() => handleOpenManageDialog(project)}
                                            style={{ marginRight: 8 }}
                                        >
                                            Gestionar
                                        </Button>
                                        <IconButton size="small" onClick={() => handleDeleteClick(project)}>
                                            <IconTrash />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProjects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        {selectedSubCriterion
                                            ? 'No hay proyectos para este sub-criterio.'
                                            : 'No hay proyectos para este curso.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirmar Cambio</DialogTitle>
                <DialogContent>
                    {pendingToggle && (
                        <>
                            {pendingToggle.currentState ? (
                                <Alert severity="warning" style={{ marginBottom: 16 }}>
                                    <Typography variant="body2">
                                        <strong>Desmarcar como Proyecto</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                        Al desmarcar este sub-criterio como proyecto, todas las calificaciones grupales se eliminarán
                                        y los estudiantes podrán ser calificados individualmente.
                                    </Typography>
                                </Alert>
                            ) : (
                                <Alert severity="info" style={{ marginBottom: 16 }}>
                                    <Typography variant="body2">
                                        <strong>Marcar como Proyecto</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                        Esta acción permitirá asignar calificaciones grupales a este sub-criterio.
                                    </Typography>
                                </Alert>
                            )}
                            {!pendingToggle.currentState && (
                                <TextField
                                    fullWidth
                                    label="Cantidad Máxima de Participantes (Opcional)"
                                    type="number"
                                    value={maxMembersInput}
                                    onChange={(e) => setMaxMembersInput(e.target.value)}
                                    variant="outlined"
                                    style={{ marginTop: 16, marginBottom: 8 }}
                                    helperText="Deje vacío para sin límite"
                                />
                            )}
                            <Typography variant="body1">
                                ¿Está seguro de que desea continuar?
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmToggle} color="primary" variant="contained">Confirmar</Button>
                </DialogActions>
            </Dialog>
            {/* Assign Project Dialog */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Asignar Proyectos a Sub-Criterios</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        Marque los sub-criterios que requieren trabajo grupal (proyectos)
                    </Typography>
                    <List>
                        {subCriteria.map(sc => (
                            <ListItem key={sc.id}>
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }} onClick={() => handleRequestToggle(sc.id)}>
                                    <Checkbox
                                        checked={sc.is_project}
                                        edge="start"
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                    <ListItemText
                                        primary={sc.name}
                                        secondary={`${sc.percentage}%`}
                                    />
                                </div>
                                {sc.is_project && (
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Configurar reglas (Max Integrantes)">
                                            <IconButton edge="end" onClick={() => handleOpenEditRules(sc)}>
                                                <IconSettings />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                )}
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Nuevo Proyecto</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Proyecto"
                                name="name"
                                value={createFormData.name}
                                onChange={handleCreateInputChange}
                                variant="outlined"
                                style={{ marginTop: 16 }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Sub-Criterio (Obligatorio)</InputLabel>
                                <Select
                                    name="sub_criterion"
                                    value={createFormData.sub_criterion}
                                    onChange={handleCreateInputChange}
                                    label="Sub-Criterio (Obligatorio)"
                                >
                                    {projectSubCriteria.map(sc => (
                                        <MenuItem key={sc.id} value={sc.id}>
                                            {sc.name} ({sc.percentage}%)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="description"
                                value={createFormData.description}
                                onChange={handleCreateInputChange}
                                variant="outlined"
                                multiline
                                rows={2}
                            />
                        </Grid>

                        <Grid size={12}>
                            <Typography variant="subtitle1" gutterBottom style={{ marginTop: 8 }}>
                                Seleccionar Integrantes
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Buscar estudiante..."
                                variant="outlined"
                                size="small"
                                value={createMemberSearchQuery}
                                onChange={(e) => setCreateMemberSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconSearch size={16} />
                                        </InputAdornment>
                                    ),
                                }}
                                style={{ marginBottom: 8 }}
                            />
                            <Paper style={{ maxHeight: 200, overflow: 'auto', padding: 8 }} variant="outlined">
                                <Grid container spacing={1}>
                                    {enrollments.map(enroll => {
                                        // Filter by search
                                        if (createMemberSearchQuery) {
                                            const fullName = `${enroll.student_details?.first_name} ${enroll.student_details?.paternal_surname}`.toLowerCase();
                                            if (!fullName.includes(createMemberSearchQuery.toLowerCase())) return null;
                                        }

                                        const isSelected = createFormData.members.includes(enroll.id);
                                        const unavailableIds = getUnavailableStudentIds(createFormData.sub_criterion);
                                        const isUnavailable = unavailableIds.includes(enroll.id);

                                        if (isUnavailable) return null; // Don't show unavailable students

                                        return (
                                            <Grid key={enroll.id}>
                                                <Chip
                                                    avatar={<Avatar>{enroll.student_details?.first_name?.[0]}</Avatar>}
                                                    label={`${enroll.student_details?.first_name} ${enroll.student_details?.paternal_surname}`}
                                                    clickable
                                                    onClick={() => handleCreateMemberToggle(enroll.id)}
                                                    color={isSelected ? "primary" : "default"}
                                                    variant={isSelected ? "default" : "outlined"}
                                                />
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid size={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Líder del Proyecto</InputLabel>
                                <Select
                                    name="student_in_charge"
                                    value={createFormData.student_in_charge}
                                    onChange={handleCreateInputChange}
                                    label="Líder del Proyecto"
                                >
                                    <MenuItem value=""><em>Ninguno</em></MenuItem>
                                    {createFormData.members.map(memId => {
                                        const mem = enrollments.find(e => e.id === memId);
                                        if (!mem) return null;
                                        return (
                                            <MenuItem key={mem.id} value={mem.id}>
                                                {mem.student_details?.first_name} {mem.student_details?.paternal_surname}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateSave} color="primary" variant="contained">Crear</Button>
                </DialogActions>
            </Dialog>
            {/* Manage Dialog */}
            <ManageProjectDialog
                open={manageDialogOpen}
                onClose={() => setManageDialogOpen(false)}
                project={currentProject}
                enrollments={enrollments}
                unavailableStudentIds={currentProject ? getUnavailableStudentIds(currentProject.sub_criterion, currentProject.id) : []}
                onSave={handleManageSave}
            />
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmDialogOpen} onClose={() => setDeleteConfirmDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Proyecto</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" icon={<IconAlertTriangle />}>
                        <Typography variant="body2">
                            ¿Está seguro de que desea eliminar el proyecto <strong>{projectToDelete?.name}</strong>?
                        </Typography>
                        <Typography variant="body2" style={{ marginTop: 8 }}>
                            Esta acción no se puede deshacer.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="secondary" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>
            {/* Edit Rules (Max Members) Dialog */}
            <Dialog open={editRulesDialogOpen} onClose={() => setEditRulesDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Configurar Reglas</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" gutterBottom>
                        {subCriterionToEdit?.name}
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={registrationOpen}
                                onChange={(e) => setRegistrationOpen(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Habilitar Registro de Estudiantes"
                    />
                    <Typography variant="caption" display="block" color="textSecondary" style={{ marginBottom: 16 }}>
                        Permitir que los estudiantes registren sus propios grupos.
                    </Typography>

                    {registrationOpen && (
                        <>
                            <TextField
                                fullWidth
                                label="Inicio de Registro"
                                type="datetime-local"
                                value={registrationStart}
                                onChange={(e) => setRegistrationStart(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                style={{ marginBottom: 16 }}
                            />
                            <TextField
                                fullWidth
                                label="Fin de Registro"
                                type="datetime-local"
                                value={registrationEnd}
                                onChange={(e) => setRegistrationEnd(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                style={{ marginBottom: 16 }}
                            />
                        </>
                    )}

                    <TextField
                        fullWidth
                        label="Cantidad Máxima de Participantes"
                        type="number"
                        value={maxMembersInput}
                        onChange={(e) => setMaxMembersInput(e.target.value)}
                        variant="outlined"
                        helperText="Deje vacío para sin límite"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditRulesDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveRules} color="primary" variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default Projects;
