import React, { useState, useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import {
    Grid,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Snackbar,
    Divider,
    Paper,
    Chip,
    Alert,
    InputAdornment,
    CircularProgress,
    Box
} from '@mui/material';
import { IconTrash, IconUserPlus, IconCheck, IconArrowRight, IconClipboardList, IconCrown, IconUsers } from '@tabler/icons-react';
import axios from 'axios';
import config from '../../../config';
import { KEYFRAMES, fadeUp } from '../../pages/landing/LandingTheme';

const StudentProjectRegistration = () => {
    const { isDark, C, DOT } = useOutletContext();

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preSelectedProjectId = queryParams.get('projectId');

    const [availableProjects, setAvailableProjects] = useState([]);
    const [activeStep, setActiveStep] = useState(0);
    const [selectedProject, setSelectedProject] = useState(null);

    // Form Data
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');

    const [memberCiInput, setMemberCiInput] = useState('');
    const [members, setMembers] = useState([]);           // todos los integrantes
    const [selectedLeaderCi, setSelectedLeaderCi] = useState(''); // elegido de la lista

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [loading, setLoading] = useState(false);
    const [addingMember, setAddingMember] = useState(false);
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        axios.get(`${config.API_SERVER}project-registration/available_projects/`)
            .then(res => {
                const projects = res.data;
                setAvailableProjects(projects);

                if (preSelectedProjectId) {
                    const found = projects.find(p => p.id === parseInt(preSelectedProjectId));
                    if (found && found.is_active_time) {
                        setSelectedProject(found);
                        setActiveStep(1);
                    }
                }
            })
            .catch(err => console.error(err));
    }, [preSelectedProjectId]);

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const checkStudent = async (ci) => {
        try {
            const res = await axios.get(`${config.API_SERVER}project-registration/validate_student/`, {
                params: { ci, sub_criterion_id: selectedProject.id }
            });
            return res.data.name;
        } catch (error) {
            const msg = error.response?.data?.error || 'Estudiante no encontrado o no inscrito en la materia';
            setSnackbar({ open: true, message: msg, severity: 'error' });
            return null;
        }
    };

    const handleAddMember = async () => {
        const ci = memberCiInput.trim();
        if (!ci) return;

        if (members.some(m => m.ci === ci)) {
            setSnackbar({ open: true, message: 'Este estudiante ya fue agregado al grupo', severity: 'warning' });
            return;
        }

        if (selectedProject.max_members && members.length >= selectedProject.max_members) {
            setSnackbar({ open: true, message: `Máximo ${selectedProject.max_members} integrantes por grupo`, severity: 'warning' });
            return;
        }

        setAddingMember(true);
        const name = await checkStudent(ci);
        setAddingMember(false);

        if (name) {
            setMembers(prev => [...prev, { ci, name }]);
            setMemberCiInput('');
        }
    };

    const handleRemoveMember = (ci) => {
        setMembers(prev => prev.filter(m => m.ci !== ci));
        if (selectedLeaderCi === ci) setSelectedLeaderCi('');
    };

    const handleToggleLeader = (ci) => {
        setSelectedLeaderCi(prev => (prev === ci ? '' : ci));
    };

    const handleSubmit = () => {
        setLoading(true);
        const payload = {
            sub_criterion_id: selectedProject.id,
            leader_ci: selectedLeaderCi,
            members_ci: members.filter(m => m.ci !== selectedLeaderCi).map(m => m.ci),
            name: projectName,
            description: projectDesc
        };

        axios.post(`${config.API_SERVER}project-registration/register/`, payload)
            .then(res => {
                setLoading(false);
                setSuccessData(res.data);
                setActiveStep(2);
            })
            .catch(err => {
                setLoading(false);
                const msg = err.response?.data?.error || 'Error al registrar el grupo';
                setSnackbar({ open: true, message: msg, severity: 'error' });
            });
    };

    const resetForm = () => {
        setSuccessData(null);
        setActiveStep(0);
        setSelectedProject(null);
        setMembers([]);
        setSelectedLeaderCi('');
        setProjectName('');
        setProjectDesc('');
        setMemberCiInput('');
    };

    // ── shared input sx ──────────────────────────────────────────────────────
    const inputSx = {
        input: { color: C.text },
        '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: C.border },
            '&:hover fieldset': { borderColor: C.purpleLight },
        },
        '& .MuiFormHelperText-root': { color: C.textMuted },
    };

    const renderStepContent = (step) => {
        switch (step) {
            // ── Step 0: elegir actividad ─────────────────────────────────────
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', serif", color: C.text, fontSize: '1.4rem' }} gutterBottom>
                                Seleccione una Actividad
                            </Typography>
                            <Typography variant="body2" sx={{ color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }} paragraph>
                                Elija la materia y actividad a la que desea inscribirse.
                            </Typography>
                        </Grid>

                        {availableProjects.length === 0 ? (
                            <Grid size={12}>
                                <Alert severity="info" sx={{ background: C.purpleDim, color: C.purple, border: `1px solid ${C.purple}40`, '& .MuiAlert-icon': { color: C.purple } }}>
                                    No hay actividades abiertas para registro en este momento.
                                </Alert>
                            </Grid>
                        ) : (
                            availableProjects.map((proj) => (
                                <Grid key={proj.id} size={{ xs: 12, md: 6, lg: 4 }}>
                                    <Paper
                                        elevation={0}
                                        style={{
                                            padding: 24,
                                            cursor: proj.is_active_time ? 'pointer' : 'default',
                                            border: selectedProject?.id === proj.id ? `2px solid ${C.purpleLight}` : `1px solid ${C.border}`,
                                            backgroundColor: !proj.is_active_time ? C.bg : (selectedProject?.id === proj.id ? C.purpleDim : C.card),
                                            opacity: proj.is_active_time ? 1 : 0.6,
                                            borderRadius: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => proj.is_active_time && setSelectedProject(proj)}
                                    >
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <IconClipboardList stroke={1.5} size="1.5rem" color={C.purple} />
                                            <Typography variant="h4" sx={{ color: proj.is_active_time ? C.purple : C.textMuted, marginLeft: 1, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                                                {proj.course_details?.subject_details?.name || proj.course_name}
                                            </Typography>
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
                                            {proj.name}
                                        </Typography>
                                        <Divider style={{ margin: '12px 0', borderColor: C.border }} />
                                        <Typography variant="body2" sx={{ color: C.textMuted }}>
                                            {proj.description}
                                        </Typography>
                                        {proj.max_members && (
                                            <Chip size="small" label={`Max. ${proj.max_members} personas`} style={{ marginTop: 12, marginRight: 8, background: C.border, color: C.text }} />
                                        )}
                                        {!proj.is_active_time && (
                                            <Chip size="small" label="Inscripción Cerrada" style={{ marginTop: 12, backgroundColor: '#ff5f5720', color: '#ff5f57' }} />
                                        )}
                                        {proj.is_active_time && proj.registration_end && (
                                            <Typography variant="caption" display="block" style={{ marginTop: 8, color: '#febc2e' }}>
                                                Cierra: {new Date(proj.registration_end).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            ))
                        )}

                        <Grid size={12}>
                            <Button
                                variant="contained"
                                disabled={!selectedProject}
                                onClick={handleNext}
                                endIcon={<IconArrowRight />}
                                sx={{ borderRadius: 2, px: 4, fontWeight: 600, background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`, color: '#fff', '&:hover': { filter: 'brightness(1.1)' } }}
                            >
                                Siguiente
                            </Button>
                        </Grid>
                    </Grid>
                );

            // ── Step 1: datos + integrantes + líder ─────────────────────────
            case 1: {
                const leaderMember = members.find(m => m.ci === selectedLeaderCi);
                const canSubmit = projectName.trim() && members.length >= 1 && selectedLeaderCi;

                return (
                    <Grid container spacing={3}>
                        {/* Actividad seleccionada */}
                        <Grid size={12}>
                            <Alert severity="info" sx={{ background: C.purpleDim, color: C.purple, border: `1px solid ${C.purple}40`, '& .MuiAlert-icon': { color: C.purple } }} icon={<IconClipboardList />}>
                                Estás registrando un grupo para: <strong>{selectedProject?.name}</strong><br />
                                Materia: <strong>{selectedProject?.course_details?.subject_details?.name || selectedProject?.course_name}</strong> (Paralelo {selectedProject?.course_details?.parallel})
                            </Alert>
                        </Grid>

                        {/* ── Columna izquierda: formulario ── */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Grid container spacing={2.5}>

                                {/* 1. Datos del grupo */}
                                <Grid size={12}>
                                    <Typography variant="h5" sx={{ color: C.purple, fontFamily: "'DM Serif Display', serif" }}>
                                        1. Datos del Grupo
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Nombre del Grupo"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        variant="outlined"
                                        required
                                        InputLabelProps={{ style: { color: C.textMuted } }}
                                        sx={inputSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Descripción (Opcional)"
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                        variant="outlined"
                                        InputLabelProps={{ style: { color: C.textMuted } }}
                                        sx={inputSx}
                                    />
                                </Grid>

                                {/* 2. Agregar integrantes */}
                                <Grid size={12}>
                                    <Typography variant="h5" sx={{ color: C.purple, fontFamily: "'DM Serif Display', serif", mt: 1 }}>
                                        2. Agregar Integrantes
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: C.textMuted, mt: 0.5 }}>
                                        Ingrese el carnet de cada integrante del grupo.
                                        {selectedProject?.max_members && (
                                            <> El grupo puede tener un máximo de <strong>{selectedProject.max_members}</strong> integrantes.</>
                                        )}
                                    </Typography>
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Carnet de Identidad (CI)"
                                        value={memberCiInput}
                                        onChange={(e) => setMemberCiInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                        variant="outlined"
                                        disabled={addingMember}
                                        helperText="Presione Enter o el botón para agregar"
                                        InputLabelProps={{ style: { color: C.textMuted } }}
                                        sx={inputSx}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleAddMember}
                                                        disabled={!memberCiInput.trim() || addingMember}
                                                        sx={{ color: C.purple }}
                                                    >
                                                        {addingMember
                                                            ? <CircularProgress size={20} sx={{ color: C.purple }} />
                                                            : <IconUserPlus />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                {/* 3. Elegir líder */}
                                <Grid size={12}>
                                    <Typography variant="h5" sx={{ color: C.purple, fontFamily: "'DM Serif Display', serif", mt: 1 }}>
                                        3. Elegir Líder
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: C.textMuted, mt: 0.5 }}>
                                        {members.length === 0
                                            ? 'Agregue al menos un integrante para poder elegir al líder.'
                                            : 'Haz clic en un integrante de la lista para designarlo como líder del grupo (obligatorio).'}
                                    </Typography>
                                </Grid>

                                {members.length > 0 && !selectedLeaderCi && (
                                    <Grid size={12}>
                                        <Alert severity="warning" sx={{ py: 0.5 }}>
                                            Debe seleccionar un líder antes de registrar el grupo.
                                        </Alert>
                                    </Grid>
                                )}

                                {leaderMember && (
                                    <Grid size={12}>
                                        <Alert severity="success" sx={{ py: 0.5 }} icon={<IconCrown size={18} />}>
                                            Líder seleccionado: <strong>{leaderMember.name}</strong> (CI: {leaderMember.ci})
                                        </Alert>
                                    </Grid>
                                )}

                                {/* Botones de navegación */}
                                <Grid size={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Button
                                            onClick={handleBack}
                                            sx={{ color: C.textMuted, border: `1px solid ${C.border}`, '&:hover': { background: C.borderLight } }}
                                        >
                                            Atrás
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleSubmit}
                                            disabled={!canSubmit || loading}
                                            sx={{ borderRadius: 2, px: 4, fontWeight: 600, background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`, color: '#fff', '&:hover': { filter: 'brightness(1.1)' } }}
                                        >
                                            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Registrar Grupo'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* ── Columna derecha: lista de integrantes ── */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Paper variant="outlined" sx={{ padding: 2, background: C.surface, borderColor: C.border, borderRadius: '12px', position: 'sticky', top: 16 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <IconUsers size={18} color={C.purple} />
                                    <Typography variant="h5" sx={{ color: C.purple, fontFamily: "'DM Sans', sans-serif" }}>
                                        Integrantes del Grupo
                                    </Typography>
                                    {members.length > 0 && (
                                        <Chip size="small" label={members.length} sx={{ bgcolor: C.purpleDim, color: C.purple, height: 20, fontSize: '0.7rem' }} />
                                    )}
                                </Box>
                                <Typography variant="caption" sx={{ color: C.textMuted, display: 'block', mb: 1 }}>
                                    Haz clic en un integrante para asignarlo como líder
                                </Typography>
                                <Divider sx={{ mb: 1, borderColor: C.border }} />

                                {members.length === 0 ? (
                                    <Typography variant="body2" align="center" sx={{ padding: '24px 8px', color: C.textMuted }}>
                                        Aún no hay integrantes agregados.
                                    </Typography>
                                ) : (
                                    <List dense disablePadding>
                                        {members.map((mem) => {
                                            const isLeader = selectedLeaderCi === mem.ci;
                                            return (
                                                <ListItem
                                                    key={mem.ci}
                                                    onClick={() => handleToggleLeader(mem.ci)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        mb: 0.5,
                                                        border: isLeader ? `1px solid ${C.purple}60` : `1px solid transparent`,
                                                        bgcolor: isLeader ? C.purpleDim : 'transparent',
                                                        transition: 'all 0.15s',
                                                        '&:hover': { bgcolor: isLeader ? C.purpleDim : `${C.purple}10` },
                                                        pr: 6
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center" gap={0.8}>
                                                                {isLeader && <IconCrown size={14} color={C.purple} />}
                                                                <Typography sx={{ color: C.text, fontWeight: isLeader ? 600 : 400, fontSize: '0.9rem' }}>
                                                                    {mem.name}
                                                                </Typography>
                                                                {isLeader && (
                                                                    <Chip
                                                                        size="small"
                                                                        label="Líder"
                                                                        sx={{ bgcolor: C.purple, color: '#fff', height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.8 } }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography sx={{ color: C.textMuted, fontSize: '0.78rem' }}>
                                                                CI: {mem.ci}
                                                            </Typography>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton
                                                            edge="end"
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(mem.ci); }}
                                                            sx={{ color: '#ff5f57', '&:hover': { bgcolor: '#ff5f5720' } }}
                                                        >
                                                            <IconTrash size="1rem" stroke={1.5} />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                );
            }

            // ── Step 2: confirmación ─────────────────────────────────────────
            case 2:
                return (
                    <Grid container justifyContent="center" style={{ textAlign: 'center', padding: 40 }}>
                        <Grid size={12}>
                            <IconCheck size={64} style={{ color: C.green, marginBottom: 16 }} />
                            <Typography variant="h3" gutterBottom sx={{ color: C.purple, fontFamily: "'DM Serif Display', serif" }}>
                                ¡Registro Exitoso!
                            </Typography>
                            <Typography variant="h5" sx={{ color: C.text }} paragraph>
                                El grupo <strong>{projectName}</strong> ha sido registrado correctamente.
                            </Typography>
                            <Typography variant="body1" sx={{ color: C.textMuted }}>
                                NOTA: Guarde el ID de su actividad si es necesario: {successData?.project_id}
                            </Typography>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    onClick={resetForm}
                                    sx={{ color: C.text, borderColor: C.border, '&:hover': { background: C.borderLight } }}
                                >
                                    Registrar Otra Actividad
                                </Button>
                                <Button
                                    variant="contained"
                                    href="/"
                                    sx={{ borderRadius: 2, px: 4, fontWeight: 600, background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`, color: '#fff', '&:hover': { filter: 'brightness(1.1)' } }}
                                >
                                    Volver al Inicio
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', background: C.bg, backgroundImage: DOT, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
            <style>{KEYFRAMES}</style>
            <Box sx={{ position: 'absolute', top: '5%', right: '-5%', width: { xs: 280, md: 480 }, height: { xs: 280, md: 480 }, borderRadius: '50%', background: `radial-gradient(circle, ${C.purpleLight}15 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', bottom: '10%', left: '-10%', width: { xs: 180, md: 380 }, height: { xs: 180, md: 380 }, borderRadius: '50%', background: `radial-gradient(circle, ${C.purple}10 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

            <Box sx={{ pt: { xs: 4, md: 6 }, pb: 10, px: 2, position: 'relative', zIndex: 1, ...fadeUp(0.1) }}>
                <Grid container justifyContent="center">
                    <Grid size={{ xs: 12, md: 10, lg: 9 }}>
                        <Box sx={{ p: { xs: 3, md: 5 }, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '24px', boxShadow: `0 24px 64px ${C.frameShadow}` }}>
                            <Typography sx={{ fontFamily: "'DM Serif Display', serif", fontSize: { xs: '2rem', md: '2.5rem' }, color: C.text, textAlign: 'center', mb: 1 }}>
                                Registro de Actividades
                            </Typography>
                            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: C.textMuted, textAlign: 'center', mb: 5 }}>
                                Inscribe a tu grupo en las asignaturas disponibles
                            </Typography>

                            <Stepper
                                activeStep={activeStep}
                                alternativeLabel
                                sx={{
                                    mb: 6,
                                    '& .MuiStepLabel-label': { color: C.textMuted, fontFamily: "'DM Sans', sans-serif" },
                                    '& .MuiStepIcon-root': { color: C.border },
                                    '& .MuiStepIcon-root.Mui-active': { color: C.purple },
                                    '& .MuiStepIcon-root.Mui-completed': { color: C.green }
                                }}
                            >
                                <Step key="Select"><StepLabel>Seleccionar Actividad</StepLabel></Step>
                                <Step key="Form"><StepLabel>Datos del Grupo</StepLabel></Step>
                                <Step key="Confirm"><StepLabel>Confirmación</StepLabel></Step>
                            </Stepper>

                            <Box>{renderStepContent(activeStep)}</Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StudentProjectRegistration;
