import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Collapse,
    Tooltip,
    Switch,
    FormControlLabel,
    Grid,
    Typography
} from '@mui/material';
import { IconEye, IconEyeOff, IconLock, IconLockOpen, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const GradeSettingsDialog = ({
    open,
    onClose,
    structure,
    onRefresh,
    showCriterionGrades,
    setShowCriterionGrades,
    showFinalGrade,
    setShowFinalGrade,
    visibleColumns,
    setVisibleColumns
}) => {
    const account = useSelector((state) => state.account);
    const [localStructure, setLocalStructure] = useState([]);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        if (open && structure) {
            setLocalStructure(JSON.parse(JSON.stringify(structure))); // Deep copy
            // Expand all by default
            const initialExpanded = {};
            structure.forEach(group => { initialExpanded[group.id] = true; });
            setExpanded(initialExpanded);
        }
    }, [open, structure]);

    const handleToggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleToggleVisible = (parentId, itemId, currentVal, isSpecial = false) => {
        setLocalStructure(prev => prev.map(group => {
            if (group.id === parentId) {
                if (isSpecial) {
                    return {
                        ...group,
                        special_criteria: (group.special_criteria || []).map(spec =>
                            spec.id === itemId ? { ...spec, visible: !currentVal } : spec
                        )
                    };
                } else {
                    return {
                        ...group,
                        sub_criteria: group.sub_criteria.map(sub =>
                            sub.id === itemId ? { ...sub, visible: !currentVal } : sub
                        )
                    };
                }
            }
            return group;
        }));
    };

    const handleToggleEditable = (parentId, itemId, currentVal, isSpecial = false) => {
        setLocalStructure(prev => prev.map(group => {
            if (group.id === parentId) {
                if (isSpecial) {
                    return {
                        ...group,
                        special_criteria: (group.special_criteria || []).map(spec =>
                            spec.id === itemId ? { ...spec, editable: !currentVal } : spec
                        )
                    };
                } else {
                    return {
                        ...group,
                        sub_criteria: group.sub_criteria.map(sub =>
                            sub.id === itemId ? { ...sub, editable: !currentVal } : sub
                        )
                    };
                }
            }
            return group;
        }));
    };

    const handleBulkToggle = (e, parentId, type) => {
        e.stopPropagation();
        setLocalStructure(prev => prev.map(group => {
            if (group.id === parentId) {
                // Smart Toggle: If all are true, switch to false. Otherwise switch to true.
                const allTrue = group.sub_criteria.every(sub => sub[type]);
                const newVal = !allTrue;

                return {
                    ...group,
                    sub_criteria: group.sub_criteria.map(sub => ({
                        ...sub,
                        [type]: newVal
                    }))
                };
            }
            return group;
        }));
    };

    const handleToggleExpandProp = (e, id) => {
        e.stopPropagation();
        handleToggleExpand(id);
    }

    const handleSave = () => {
        // Flatten updates for sub_criteria
        const subUpdates = [];
        const specialUpdates = [];

        localStructure.forEach(group => {
            group.sub_criteria.forEach(sub => {
                subUpdates.push({
                    id: sub.id,
                    visible: sub.visible,
                    editable: sub.editable
                });
            });
            (group.special_criteria || []).forEach(spec => {
                specialUpdates.push({
                    id: spec.id,
                    visible: spec.visible,
                    editable: spec.editable
                });
            });
        });

        const headers = { Authorization: `Token ${account.token}` };

        // Send both updates in parallel
        const subRequest = axios.post(`${configData.API_SERVER}course-sub-criteria/bulk_update_settings/`, { updates: subUpdates }, { headers });
        const specialRequest = specialUpdates.length > 0
            ? axios.post(`${configData.API_SERVER}course-special-criteria/bulk_update_settings/`, { updates: specialUpdates }, { headers })
            : Promise.resolve();

        Promise.all([subRequest, specialRequest])
            .then(() => {
                onRefresh();
                onClose();
            })
            .catch(err => console.error(err));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Ajustes de Calificaciones</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} style={{ marginBottom: 16 }}>
                    <Grid size={12}>
                        <Typography variant="subtitle1" gutterBottom>Visualización General</Typography>
                    </Grid>
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showCriterionGrades}
                                    onChange={(e) => setShowCriterionGrades(e.target.checked)}
                                    name="showCriterionGrades"
                                    color="primary"
                                />
                            }
                            label="Mostrar Notas de Criterios"
                        />
                    </Grid>
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showFinalGrade}
                                    onChange={(e) => setShowFinalGrade(e.target.checked)}
                                    name="showFinalGrade"
                                    color="primary"
                                />
                            }
                            label="Mostrar Nota Final"
                        />
                    </Grid>
                    <Grid size={12}>
                        <Typography variant="subtitle2" gutterBottom style={{ marginTop: 8 }}>Columnas del Estudiante</Typography>
                        <Grid container>
                            <Grid
                                size={{
                                    xs: 6,
                                    sm: 3
                                }}>
                                <FormControlLabel
                                    control={<Switch size="small" checked={visibleColumns.ci} onChange={(e) => setVisibleColumns({ ...visibleColumns, ci: e.target.checked })} />}
                                    label="CI"
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 6,
                                    sm: 3
                                }}>
                                <FormControlLabel
                                    control={<Switch size="small" checked={visibleColumns.paterno} onChange={(e) => setVisibleColumns({ ...visibleColumns, paterno: e.target.checked })} />}
                                    label="Paterno"
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 6,
                                    sm: 3
                                }}>
                                <FormControlLabel
                                    control={<Switch size="small" checked={visibleColumns.materno} onChange={(e) => setVisibleColumns({ ...visibleColumns, materno: e.target.checked })} />}
                                    label="Materno"
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 6,
                                    sm: 3
                                }}>
                                <FormControlLabel
                                    control={<Switch size="small" checked={visibleColumns.nombre} onChange={(e) => setVisibleColumns({ ...visibleColumns, nombre: e.target.checked })} />}
                                    label="Nombres"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Divider style={{ marginBottom: 16 }} />
                <Typography variant="subtitle1" gutterBottom>Configuración por Criterios</Typography>
                <List dense>
                    {localStructure.map(group => {
                        const allVisible = group.sub_criteria.every(s => s.visible);
                        const allEditable = group.sub_criteria.every(s => s.editable);

                        return (
                            <React.Fragment key={group.id}>
                                <ListItem button onClick={() => handleToggleExpand(group.id)} style={{ backgroundColor: '#f5f5f5' }}>
                                    <ListItemText
                                        primary={group.name}
                                        secondary={`${group.weight} Pts Total`}
                                        primaryTypographyProps={{ style: { fontWeight: 'bold' } }}
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title={allVisible ? "Ocultar Todo el Grupo" : "Mostrar Todo el Grupo"}>
                                            <IconButton size="small" onClick={(e) => handleBulkToggle(e, group.id, 'visible')}>
                                                {allVisible ? <IconEye size="20" color="#2196f3" /> : <IconEyeOff size="20" />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={allEditable ? "Bloquear Todo el Grupo" : "Desbloquear Todo el Grupo"}>
                                            <IconButton size="small" onClick={(e) => handleBulkToggle(e, group.id, 'editable')}>
                                                {allEditable ? <IconLockOpen size="20" color="#f50057" /> : <IconLock size="20" />}
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton edge="end" onClick={(e) => handleToggleExpandProp(e, group.id)}>
                                            {expanded[group.id] ? <IconChevronUp /> : <IconChevronDown />}
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Collapse in={expanded[group.id]} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {group.sub_criteria.map(sub => (
                                            <ListItem key={sub.id} style={{ paddingLeft: 32 }}>
                                                <ListItemText primary={sub.name} secondary={`${sub.percentage} Pts`} />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); handleToggleVisible(group.id, sub.id, sub.visible, false); }}
                                                        color={sub.visible ? "primary" : "default"}
                                                    >
                                                        {sub.visible ? <IconEye /> : <IconEyeOff />}
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); handleToggleEditable(group.id, sub.id, sub.editable, false); }}
                                                        color={sub.editable ? "secondary" : "default"}
                                                    >
                                                        {sub.editable ? <IconLockOpen /> : <IconLock />}
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                        {(group.special_criteria || []).map(spec => (
                                            <ListItem key={spec.id} style={{ paddingLeft: 32, backgroundColor: '#fff3e0' }}>
                                                <ListItemText primary={`⭐ ${spec.name}`} secondary={`+${spec.percentage} pts [Extra]`} />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); handleToggleVisible(group.id, spec.id, spec.visible, true); }}
                                                        color={spec.visible ? "primary" : "default"}
                                                    >
                                                        {spec.visible ? <IconEye /> : <IconEyeOff />}
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); handleToggleEditable(group.id, spec.id, spec.editable, true); }}
                                                        color={spec.editable ? "secondary" : "default"}
                                                    >
                                                        {spec.editable ? <IconLockOpen /> : <IconLock />}
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                                <Divider />
                            </React.Fragment>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Cancelar</Button>
                <Button onClick={handleSave} color="secondary" variant="contained">Guardar Ajustes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default GradeSettingsDialog;
