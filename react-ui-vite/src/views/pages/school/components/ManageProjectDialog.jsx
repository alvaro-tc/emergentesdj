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
    Paper,
    Button,
    Collapse,
    InputAdornment,
    Chip,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { IconPlus, IconX, IconSearch, IconUserCheck } from '@tabler/icons-react';

const ManageProjectDialog = ({
    open,
    onClose,
    project,
    enrollments,
    unavailableStudentIds = [],
    onSave,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        score: '',
        members: [], // Array of enrollment IDs
        student_in_charge: '',
        sub_criterion: null
    });
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    useEffect(() => {
        if (project && open) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                score: project.score !== null ? project.score : '',
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
            // If leader is removed, clear leader
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Gestionar Proyecto: {project?.name}</DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <TextField
                            fullWidth
                            label="Nombre del Proyecto"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            variant="outlined"
                            style={{ marginTop: 16 }}
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
                        />
                    </Grid>

                    <Grid size={12}>
                        <Typography variant="h4" color="primary" gutterBottom style={{ marginTop: 16 }}>
                            Calificación y Miembros
                        </Typography>
                        <Divider />
                    </Grid>

                    <Grid
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <TextField
                            fullWidth
                            label={`Calificación (Máx: ${project?.maxScore || 100})`}
                            name="score"
                            type="number"
                            value={formData.score}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const max = parseFloat(project?.maxScore || 100);
                                if (val > max) return; // Prevent exceeding max
                                handleInputChange(e);
                            }}
                            variant="outlined"
                            helperText="Esta nota se aplicará a todos los integrantes."
                            inputProps={{ max: project?.maxScore || 100, min: 0 }}
                        />
                    </Grid>

                    {/* Current Members Section */}
                    <Grid size={12}>
                        <Typography variant="subtitle1" gutterBottom style={{ marginTop: 8 }}>
                            Integrantes del Proyecto ({formData.members.length})
                        </Typography>
                        <Paper style={{ padding: 16, minHeight: 80, backgroundColor: '#fcfcfc' }} variant="outlined">
                            {formData.members.length === 0 ? (
                                <Typography variant="body2" color="textSecondary">No hay integrantes seleccionados.</Typography>
                            ) : (
                                <Grid container spacing={1}>
                                    {formData.members.map(memId => {
                                        const mem = enrollments.find(e => e.id === memId);
                                        if (!mem) return null; // Should not happen if enrollments list is complete
                                        const isLeader = formData.student_in_charge === memId;
                                        return (
                                            <Grid key={memId}>
                                                <Chip
                                                    avatar={mem.student_details?.first_name ? <Avatar>{mem.student_details.first_name[0]}</Avatar> : undefined}
                                                    label={`${mem.student_details?.first_name || ''} ${mem.student_details?.paternal_surname || ''} ${isLeader ? '(Líder)' : ''}`}
                                                    color={isLeader ? "secondary" : "primary"}
                                                    onDelete={() => handleMemberToggle(memId)}
                                                    variant={isLeader ? "default" : "outlined"}
                                                    icon={isLeader ? <IconUserCheck /> : undefined}
                                                />
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>

                    {/* Available Students Section */}
                    <Grid size={12}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Typography variant="subtitle1">
                                Añadir Participantes
                            </Typography>
                            <Button
                                size="small"
                                variant={showAddMembers ? "outlined" : "contained"}
                                color="primary"
                                onClick={() => setShowAddMembers(!showAddMembers)}
                                startIcon={showAddMembers ? <IconX size={16} /> : <IconPlus size={16} />}
                            >
                                {showAddMembers ? 'Cerrar' : 'Añadir'}
                            </Button>
                        </div>

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
                                style={{ marginBottom: 16 }}
                            />
                            <Paper style={{ maxHeight: 200, overflow: 'auto', padding: 16 }} variant="outlined">
                                <Grid container spacing={1}>
                                    {enrollments
                                        .filter(e => !formData.members.includes(e.id))
                                        .filter(e => {
                                            if (!memberSearchQuery) return true;
                                            const fullName = `${e.student_details?.first_name} ${e.student_details?.paternal_surname}`.toLowerCase();
                                            return fullName.includes(memberSearchQuery.toLowerCase());
                                        })
                                        .map(enroll => {
                                            if (unavailableStudentIds.includes(enroll.id)) return null;

                                            return (
                                                <Grid key={enroll.id}>
                                                    <Chip
                                                        avatar={enroll.student_details?.first_name ? <Avatar>{enroll.student_details.first_name[0]}</Avatar> : undefined}
                                                        label={`${enroll.student_details?.first_name || ''} ${enroll.student_details?.paternal_surname || ''}`}
                                                        clickable
                                                        onClick={() => handleMemberToggle(enroll.id)}
                                                        variant="outlined"
                                                        deleteIcon={<IconPlus />}
                                                        onDelete={() => handleMemberToggle(enroll.id)}
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    {enrollments.filter(e => !formData.members.includes(e.id)).length === 0 && (
                                        <Typography variant="body2" color="textSecondary" style={{ padding: 8 }}>
                                            Todos los estudiantes están asignados a este proyecto.
                                        </Typography>
                                    )}
                                </Grid>
                            </Paper>
                        </Collapse>
                    </Grid>

                    <Grid
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <FormControl fullWidth variant="outlined" style={{ marginTop: 16 }}>
                            <InputLabel>Líder del Proyecto</InputLabel>
                            <Select
                                name="student_in_charge"
                                value={formData.student_in_charge}
                                onChange={handleInputChange}
                                label="Líder del Proyecto"
                            >
                                <MenuItem value=""><em>Ninguno</em></MenuItem>
                                {formData.members.map(memId => {
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
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSaveInternal} color="primary" variant="contained">Guardar Cambios</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageProjectDialog;
