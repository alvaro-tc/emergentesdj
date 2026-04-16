import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    Grid, Typography, Box, Card, CardContent, Button, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Stack, Alert, CircularProgress,
    Divider, Avatar, IconButton, Tooltip, LinearProgress
} from '@mui/material';
import axios from 'axios';
import configData from '../../../config';

import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LockIcon from '@mui/icons-material/Lock';

const CARD_GRADIENTS = [
    ['#1565C0', '#1976D2'],
    ['#2E7D32', '#388E3C'],
    ['#6A1B9A', '#7B1FA2'],
    ['#E65100', '#F57C00'],
    ['#00695C', '#00897B'],
    ['#AD1457', '#C2185B'],
];

const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const GroupRegistration = () => {
    const account = useSelector((s) => s.account);
    const activeCourse = useSelector((s) => s.account.activeCourse);

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState([]);
    const [memberInput, setMemberInput] = useState('');
    const [memberError, setMemberError] = useState('');
    const [validatingMember, setValidatingMember] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const authHeader = { Authorization: `Bearer ${account.token}` };

    const fetchProjects = useCallback(async () => {
        if (!activeCourse?.id) return;
        setLoading(true);
        try {
            const { data } = await axios.get(
                `${configData.API_SERVER}project-registration/available_projects/?course_id=${activeCourse.id}`,
                { headers: authHeader }
            );
            setProjects(data.filter((p) => p.is_active_time));
        } catch {
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [activeCourse?.id, account.token]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const openDialog = (proj) => {
        setSelectedProject(proj);
        setGroupName('');
        setDescription('');
        setMemberInput('');
        setMemberError('');
        setFormError('');
        setSuccessMsg('');
        const u = account.user;
        const selfEntry = u
            ? {
                ci: u.ci_number,
                name: `${u.first_name || ''} ${u.paternal_surname || ''}`.trim() || u.email,
                isLeader: true,
                isSelf: true,
            }
            : null;
        setMembers(selfEntry ? [selfEntry] : []);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (!submitting) setDialogOpen(false);
    };

    const handleAddMember = async () => {
        const ci = memberInput.trim();
        if (!ci) return;
        setMemberError('');

        if (members.some((m) => m.ci === ci)) {
            setMemberError('Este estudiante ya está en el grupo');
            return;
        }
        if (selectedProject?.max_members && members.length >= selectedProject.max_members) {
            setMemberError(`Límite de ${selectedProject.max_members} integrantes alcanzado`);
            return;
        }

        setValidatingMember(true);
        try {
            const { data } = await axios.get(
                `${configData.API_SERVER}project-registration/validate_student/?ci=${ci}&sub_criterion_id=${selectedProject.id}`,
                { headers: authHeader }
            );
            if (data.valid) {
                setMembers((prev) => [...prev, { ci, name: data.name, isLeader: false, isSelf: false }]);
                setMemberInput('');
            }
        } catch (e) {
            setMemberError(e.response?.data?.error || 'Estudiante no encontrado o no inscrito en este curso');
        } finally {
            setValidatingMember(false);
        }
    };

    const handleSetLeader = (ci) => {
        setMembers((prev) => prev.map((m) => ({ ...m, isLeader: m.ci === ci })));
    };

    const handleRemoveMember = (ci) => {
        setMembers((prev) => prev.filter((m) => m.ci !== ci));
    };

    const handleSubmit = async () => {
        if (!groupName.trim()) { setFormError('El nombre del grupo es requerido'); return; }
        const leader = members.find((m) => m.isLeader);
        if (!leader) { setFormError('Debes seleccionar un líder de grupo'); return; }
        if (members.length < 1) { setFormError('El grupo debe tener al menos un integrante'); return; }

        setSubmitting(true);
        setFormError('');
        try {
            await axios.post(
                `${configData.API_SERVER}project-registration/register/`,
                {
                    sub_criterion_id: selectedProject.id,
                    name: groupName.trim(),
                    description: description.trim(),
                    leader_ci: leader.ci,
                    members_ci: members.filter((m) => !m.isLeader).map((m) => m.ci),
                },
                { headers: authHeader }
            );
            setDialogOpen(false);
            setSuccessMsg('');
            fetchProjects();
        } catch (e) {
            setFormError(e.response?.data?.error || 'Error al registrar el grupo. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!activeCourse) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <GroupsIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h4" color="text.secondary">Sin paralelo seleccionado</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                    Usa el buscador del encabezado para seleccionar un paralelo.
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {/* Header */}
            <Grid size={12}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <GroupsIcon color="primary" sx={{ fontSize: 30 }} />
                    <Box>
                        <Typography variant="h2">Registro de Grupo</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {activeCourse.subject_details?.name} — Paralelo {activeCourse.parallel}
                        </Typography>
                    </Box>
                </Box>
            </Grid>

            {loading ? (
                <Grid size={12}><LinearProgress sx={{ borderRadius: 2 }} /></Grid>
            ) : projects.length === 0 ? (
                <Grid size={12}>
                    <Box sx={{
                        textAlign: 'center', py: 10, px: 4,
                        bgcolor: 'background.paper', borderRadius: 3,
                        border: '2px dashed', borderColor: 'divider',
                    }}>
                        <LockIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h4" color="text.secondary">Sin proyectos disponibles</Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            No hay proyectos grupales abiertos para este paralelo en este momento.
                        </Typography>
                    </Box>
                </Grid>
            ) : (
                projects.map((proj, idx) => {
                    const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                    return (
                        <Grid key={proj.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{
                                height: '100%', display: 'flex', flexDirection: 'column',
                                borderRadius: 3, overflow: 'hidden',
                                boxShadow: '0 2px 14px rgba(0,0,0,0.09)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 26px rgba(0,0,0,0.14)' },
                            }}>
                                {/* Gradient header */}
                                <Box sx={{ background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`, p: 2.5 }}>
                                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                                        {proj.name}
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {proj.max_members && (
                                            <Chip
                                                icon={<PeopleAltIcon sx={{ fontSize: '0.85rem !important', color: 'white !important' }} />}
                                                label={`Máx. ${proj.max_members} integrantes`}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.68rem', height: 22 }}
                                            />
                                        )}
                                    </Stack>
                                </Box>

                                {/* Body */}
                                <CardContent sx={{ flex: 1, p: 2 }}>
                                    <Stack spacing={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <EventIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Apertura: {formatDate(proj.registration_start)}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <EventIcon sx={{ fontSize: 15, color: 'error.main', flexShrink: 0 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Cierre: {formatDate(proj.registration_end)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>

                                {/* Action */}
                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Divider sx={{ mb: 1.5 }} />
                                    {proj.already_registered ? (
                                        <Button
                                            fullWidth variant="outlined" color="success"
                                            disabled startIcon={<CheckCircleIcon />}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            Ya estás inscrito
                                        </Button>
                                    ) : (
                                        <Button
                                            fullWidth variant="contained"
                                            startIcon={<GroupsIcon />}
                                            onClick={() => openDialog(proj)}
                                            sx={{
                                                borderRadius: 2, textTransform: 'none', fontWeight: 600,
                                                background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
                                                '&:hover': { background: `linear-gradient(135deg, ${grad[1]} 0%, ${grad[0]} 100%)` },
                                            }}
                                        >
                                            Registrar Grupo
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    );
                })
            )}

            {/* ── Registration Dialog ── */}
            <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 40, height: 40 }}>
                            <GroupsIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>Registrar Grupo</Typography>
                            <Typography variant="caption" color="text.secondary">{selectedProject?.name}</Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2.5}>
                        {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}

                        <TextField
                            label="Nombre del grupo *"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            fullWidth size="small"
                            inputProps={{ maxLength: 100 }}
                        />
                        <TextField
                            label="Descripción (opcional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth size="small" multiline rows={2}
                        />

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Integrantes del grupo
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Haz clic en un integrante para asignarlo como líder (
                                <StarRoundedIcon sx={{ fontSize: 13, color: 'warning.main', verticalAlign: 'middle' }} />
                                ). Tú estás añadido automáticamente.
                            </Typography>
                        </Box>

                        {/* Members list */}
                        <Stack spacing={0.75}>
                            {members.map((m) => (
                                <Box
                                    key={m.ci}
                                    display="flex" alignItems="center" gap={1}
                                    onClick={() => handleSetLeader(m.ci)}
                                    sx={{
                                        p: 1, borderRadius: 2,
                                        bgcolor: m.isLeader ? 'primary.light' : 'action.hover',
                                        cursor: 'pointer',
                                        border: '1px solid',
                                        borderColor: m.isLeader ? 'primary.main' : 'transparent',
                                        transition: 'all 0.15s',
                                        '&:hover': { bgcolor: m.isLeader ? 'primary.light' : 'action.selected' },
                                    }}
                                >
                                    <Avatar sx={{
                                        width: 32, height: 32, fontSize: '0.85rem',
                                        bgcolor: m.isLeader ? 'primary.main' : 'grey.400',
                                    }}>
                                        {(m.name || '?').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box flex={1} minWidth={0}>
                                        <Typography variant="body2" fontWeight={m.isLeader ? 700 : 400} noWrap>
                                            {m.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">CI: {m.ci}</Typography>
                                    </Box>
                                    {m.isLeader && (
                                        <Tooltip title="Líder del grupo">
                                            <StarRoundedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                                        </Tooltip>
                                    )}
                                    {!m.isSelf && (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.ci); }}
                                            sx={{ '&:hover': { color: 'error.main' } }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Stack>

                        {/* Add member */}
                        {(!selectedProject?.max_members || members.length < selectedProject.max_members) && (
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <TextField
                                    label="Añadir compañero por CI"
                                    value={memberInput}
                                    onChange={(e) => { setMemberInput(e.target.value); setMemberError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                    size="small" fullWidth
                                    error={!!memberError}
                                    helperText={memberError}
                                />
                                <Button
                                    variant="outlined" onClick={handleAddMember}
                                    disabled={validatingMember || !memberInput.trim()}
                                    startIcon={validatingMember ? <CircularProgress size={14} /> : <PersonAddIcon />}
                                    sx={{ minWidth: 100, whiteSpace: 'nowrap', mt: 0 }}
                                >
                                    {validatingMember ? 'Buscando' : 'Añadir'}
                                </Button>
                            </Box>
                        )}

                        {selectedProject?.max_members && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <PeopleAltIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {members.length} / {selectedProject.max_members} integrantes
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={closeDialog} disabled={submitting} sx={{ borderRadius: 2 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained" onClick={handleSubmit}
                        disabled={submitting || !groupName.trim()}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <GroupsIcon />}
                        sx={{ borderRadius: 2, fontWeight: 600, minWidth: 150 }}
                    >
                        {submitting ? 'Registrando...' : 'Registrar Grupo'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default GroupRegistration;
