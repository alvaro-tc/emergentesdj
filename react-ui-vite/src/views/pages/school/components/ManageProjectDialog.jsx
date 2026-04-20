import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    TextField,
    Typography,
    Divider,
    Button,
    Collapse,
    InputAdornment,
    Chip,
    Avatar,
    Box,
    IconButton,
    Stack,
    Tooltip
} from '@mui/material';
import { IconPlus, IconX, IconSearch, IconUsers, IconStar, IconNotes, IconCrown } from '@tabler/icons-react';

const ManageProjectDialog = ({
    open,
    onClose,
    project,
    enrollments,
    unavailableStudentIds = [],
    courseId,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        score: '',
        observations: '',
        members: [],
        student_in_charge: '',
        sub_criterion: null
    });
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    // Mapa de lookup: combina enrollments generales + member_details del proyecto
    // para no depender de que todos los enrollments estén paginados en la lista global
    const enrollmentMap = React.useMemo(() => {
        const map = {};
        enrollments.forEach(e => { map[e.id] = e; });
        if (project?.member_details) {
            project.member_details.forEach(e => { map[e.id] = e; });
        }
        if (project?.leader_details) {
            map[project.leader_details.id] = project.leader_details;
        }
        return map;
    }, [enrollments, project]);

    useEffect(() => {
        if (project && open) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                score: project.score !== null ? project.score : '',
                observations: project.observations || '',
                members: project.members || [],
                student_in_charge: project.student_in_charge || '',
                sub_criterion: project.sub_criterion
            });
            setShowAddMembers(false);
            setMemberSearchQuery('');
        }
    }, [project, open]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleMemberToggle = (enrollmentId) => {
        const currentMembers = formData.members;
        const currentIndex = currentMembers.indexOf(enrollmentId);
        const newMembers = [...currentMembers];

        if (currentIndex === -1) {
            newMembers.push(enrollmentId);
        } else {
            newMembers.splice(currentIndex, 1);
            if (formData.student_in_charge === enrollmentId) {
                setFormData(prev => ({ ...prev, student_in_charge: '', members: newMembers }));
                return;
            }
        }
        setFormData({ ...formData, members: newMembers });
    };

    const handleSaveInternal = () => {
        onSave(formData);
    };

    const SectionHeader = ({ icon: Icon, title }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 2 }}>
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: '8px',
                bgcolor: 'primary.main', color: 'white'
            }}>
                <Icon size={18} />
            </Box>
            <Typography variant="h5" fontWeight={600}>{title}</Typography>
            <Box sx={{ flex: 1 }}><Divider /></Box>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{
            sx: { borderRadius: 3 }
        }}>
            <DialogTitle sx={{
                pb: 1, pt: 2.5, px: 3,
                borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>Gestionar Grupo</Typography>
                    <Typography variant="caption" color="text.secondary">{project?.name}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <IconX size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
                <Grid container spacing={2.5}>

                    {/* ── Información del Proyecto ── */}
                    <Grid size={12}>
                        <SectionHeader icon={IconNotes} title="Información del Proyecto" />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            fullWidth
                            label="Nombre del Proyecto"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Descripción"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            variant="outlined"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>

                    {/* ── Calificación ── */}
                    <Grid size={12}>
                        <SectionHeader icon={IconStar} title="Calificación" />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label={`Calificación (Máx: ${project?.maxScore || 100})`}
                            name="score"
                            type="number"
                            value={formData.score}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const max = parseFloat(project?.maxScore || 100);
                                if (val > max) return;
                                handleInputChange(e);
                            }}
                            variant="outlined"
                            size="small"
                            helperText="Se aplicará a todos los integrantes."
                            inputProps={{ max: project?.maxScore || 100, min: 0 }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            fullWidth
                            label="Observaciones"
                            name="observations"
                            value={formData.observations}
                            onChange={handleInputChange}
                            variant="outlined"
                            multiline
                            rows={3}
                            size="small"
                            placeholder="Añada observaciones sobre el grupo o el desarrollo del proyecto..."
                            helperText="Visible solo para el docente."
                        />
                    </Grid>

                    {/* ── Integrantes ── */}
                    <Grid size={12}>
                        <SectionHeader icon={IconUsers} title="Integrantes" />
                    </Grid>

                    {/* Current Members */}
                    <Grid size={12}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Haz clic en un integrante para asignarlo como líder. El líder actual se muestra resaltado.
                        </Typography>
                        <Box sx={{
                            border: '1px solid', borderColor: 'divider', borderRadius: 2,
                            p: 2, minHeight: 72, bgcolor: 'grey.50'
                        }}>
                            {formData.members.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    No hay integrantes seleccionados.
                                </Typography>
                            ) : (
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {formData.members.map(memId => {
                                        const mem = enrollmentMap[memId];
                                        if (!mem) return null;
                                        const isLeader = formData.student_in_charge === memId;
                                        return (
                                            <Chip
                                                key={memId}
                                                avatar={mem.student_details?.first_name
                                                    ? <Avatar sx={{ bgcolor: isLeader ? 'secondary.main' : 'primary.main' }}>
                                                        {mem.student_details.first_name[0]}
                                                      </Avatar>
                                                    : undefined}
                                                label={`${mem.student_details?.ci_number ? mem.student_details.ci_number + ' · ' : ''}${mem.student_details?.first_name || ''} ${mem.student_details?.paternal_surname || ''}${isLeader ? ' · Líder' : ''}`}
                                                color={isLeader ? 'secondary' : 'primary'}
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    student_in_charge: isLeader ? '' : memId
                                                }))}
                                                onDelete={() => handleMemberToggle(memId)}
                                                variant={isLeader ? 'filled' : 'outlined'}
                                                icon={isLeader ? <IconCrown size={14} /> : undefined}
                                                size="small"
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Grid>

                    {/* Add Members */}
                    <Grid size={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Estudiantes disponibles para agregar al grupo
                            </Typography>
                            <Button
                                size="small"
                                variant={showAddMembers ? 'outlined' : 'contained'}
                                color="primary"
                                onClick={() => setShowAddMembers(!showAddMembers)}
                                startIcon={showAddMembers ? <IconX size={14} /> : <IconPlus size={14} />}
                                sx={{ borderRadius: 2 }}
                            >
                                {showAddMembers ? 'Cerrar' : 'Añadir'}
                            </Button>
                        </Box>

                        <Collapse in={showAddMembers}>
                            <TextField
                                fullWidth
                                placeholder="Buscar estudiante..."
                                variant="outlined"
                                size="small"
                                value={memberSearchQuery}
                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconSearch size={16} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1.5 }}
                            />
                            <Box sx={{
                                maxHeight: 220, overflow: 'auto', p: 1.5,
                                border: '1px solid', borderColor: 'divider', borderRadius: 2
                            }}>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {(() => {
                                        const query = memberSearchQuery.toLowerCase();
                                        const visible = enrollments.filter(e => {
                                            if (formData.members.includes(e.id)) return false;
                                            if (!query) return true;
                                            const str = `${e.student_details?.first_name || ''} ${e.student_details?.paternal_surname || ''} ${e.student_details?.maternal_surname || ''} ${e.student_details?.ci_number || ''}`.toLowerCase();
                                            return str.includes(query);
                                        });

                                        if (visible.length === 0) return (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                                {query ? 'Sin resultados para la búsqueda.' : 'Todos los estudiantes ya están en el grupo.'}
                                            </Typography>
                                        );

                                        return visible.map(enroll => {
                                            const isTaken = unavailableStudentIds.includes(enroll.id);
                                            const sd = enroll.student_details;
                                            const fullLastName = [sd?.paternal_surname, sd?.maternal_surname].filter(Boolean).join(' ');
                                            const label = `${sd?.ci_number ? sd.ci_number + ' · ' : ''}${fullLastName}${sd?.first_name ? ', ' + sd.first_name : ''}`;
                                            return isTaken ? (
                                                <Tooltip key={enroll.id} title="Ya está en otro grupo de esta actividad">
                                                    <Chip
                                                        avatar={<Avatar sx={{ bgcolor: 'error.light' }}>{enroll.student_details?.first_name?.[0]}</Avatar>}
                                                        label={label}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderColor: 'error.main', color: 'error.main', cursor: 'not-allowed', opacity: 0.8 }}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Chip
                                                    key={enroll.id}
                                                    avatar={<Avatar>{enroll.student_details?.first_name?.[0]}</Avatar>}
                                                    label={label}
                                                    clickable
                                                    onClick={() => handleMemberToggle(enroll.id)}
                                                    variant="outlined"
                                                    deleteIcon={<IconPlus size={14} />}
                                                    onDelete={() => handleMemberToggle(enroll.id)}
                                                    size="small"
                                                />
                                            );
                                        });
                                    })()}
                                </Stack>
                            </Box>
                        </Collapse>
                    </Grid>

                </Grid>
            </DialogContent>

            <DialogActions sx={{
                px: 3, py: 2,
                borderTop: '1px solid', borderColor: 'divider',
                gap: 1
            }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
                    Cancelar
                </Button>
                <Button onClick={handleSaveInternal} color="primary" variant="contained" sx={{ borderRadius: 2, px: 3 }}>
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageProjectDialog;
