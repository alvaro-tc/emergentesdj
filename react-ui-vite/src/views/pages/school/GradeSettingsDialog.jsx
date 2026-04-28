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
    Collapse,
    Tooltip,
    Switch,
    FormControlLabel,
    Grid,
    Typography,
    Box,
    Stack,
    Chip,
    Paper,
    Divider
} from '@mui/material';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconLockOpen,
    IconChevronDown,
    IconChevronUp,
    IconAdjustments,
    IconLayoutColumns,
    IconClipboardList,
    IconStar
} from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const SectionHeader = ({ icon, title, subtitle }) => (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
            sx={{
                width: 32,
                height: 32,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.lighter',
                color: 'primary.main'
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
        </Box>
    </Stack>
);

const GradeSettingsDialog = ({
    open,
    onClose,
    structure,
    onRefresh,
    criterionGradeVisibility,
    setCriterionGradeVisibility,
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
                }
                return {
                    ...group,
                    sub_criteria: group.sub_criteria.map(sub =>
                        sub.id === itemId ? { ...sub, visible: !currentVal } : sub
                    )
                };
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
                }
                return {
                    ...group,
                    sub_criteria: group.sub_criteria.map(sub =>
                        sub.id === itemId ? { ...sub, editable: !currentVal } : sub
                    )
                };
            }
            return group;
        }));
    };

    const handleBulkToggle = (e, parentId, type) => {
        e.stopPropagation();
        setLocalStructure(prev => prev.map(group => {
            if (group.id === parentId) {
                const allTrue = group.sub_criteria.every(sub => sub[type]);
                const newVal = !allTrue;
                return {
                    ...group,
                    sub_criteria: group.sub_criteria.map(sub => ({ ...sub, [type]: newVal }))
                };
            }
            return group;
        }));
    };

    const handleToggleCriterionNote = (e, groupId) => {
        e.stopPropagation();
        setCriterionGradeVisibility(prev => ({
            ...prev,
            [groupId]: prev[groupId] === false ? true : false
        }));
    };

    const handleSave = () => {
        const subUpdates = [];
        const specialUpdates = [];

        localStructure.forEach(group => {
            group.sub_criteria.forEach(sub => {
                subUpdates.push({ id: sub.id, visible: sub.visible, editable: sub.editable });
            });
            (group.special_criteria || []).forEach(spec => {
                specialUpdates.push({ id: spec.id, visible: spec.visible, editable: spec.editable });
            });
        });

        const headers = { Authorization: `Token ${account.token}` };

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

    const columnOptions = [
        { key: 'ci', label: 'CI' },
        { key: 'paterno', label: 'Paterno' },
        { key: 'materno', label: 'Materno' },
        { key: 'nombre', label: 'Nombres' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 40, height: 40, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'primary.main', color: 'primary.contrastText'
                        }}
                    >
                        <IconAdjustments size={22} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Ajustes de Calificaciones
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Configura qué columnas, criterios y notas mostrar en la tabla
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: 'grey.50' }}>
                {/* Sección 1: Visualización General */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <SectionHeader
                        icon={<IconLayoutColumns size={18} />}
                        title="Visualización General"
                        subtitle="Controla la nota final y las columnas de identificación del estudiante"
                    />
                    <Box sx={{ pl: { xs: 0, sm: 5.5 } }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showFinalGrade}
                                    onChange={(e) => setShowFinalGrade(e.target.checked)}
                                    color="success"
                                />
                            }
                            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Mostrar Nota Final</Typography>}
                        />
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Columnas del estudiante
                        </Typography>
                        <Grid container spacing={1}>
                            {columnOptions.map(opt => (
                                <Grid key={opt.key} size={{ xs: 6, sm: 3 }}>
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={visibleColumns[opt.key]}
                                                onChange={(e) => setVisibleColumns({ ...visibleColumns, [opt.key]: e.target.checked })}
                                            />
                                        }
                                        label={<Typography variant="body2">{opt.label}</Typography>}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Paper>

                {/* Sección 2: Configuración por Criterios */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <SectionHeader
                        icon={<IconClipboardList size={18} />}
                        title="Configuración por Criterios"
                        subtitle="Para cada criterio puedes ocultar su columna de nota, mostrar/ocultar subcriterios o bloquear su edición"
                    />

                    {/* Leyenda */}
                    <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2, pl: { xs: 0, sm: 5.5 }, rowGap: 1 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconEye size={16} color="#1976d2" />
                            <Typography variant="caption" color="text.secondary">Visible</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconEyeOff size={16} color="#9e9e9e" />
                            <Typography variant="caption" color="text.secondary">Oculto</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconLockOpen size={16} color="#d81b60" />
                            <Typography variant="caption" color="text.secondary">Editable</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconLock size={16} color="#9e9e9e" />
                            <Typography variant="caption" color="text.secondary">Bloqueado</Typography>
                        </Stack>
                    </Stack>

                    <Stack spacing={1.25}>
                        {localStructure.map(group => {
                            const allEditable = group.sub_criteria.every(s => s.editable);
                            const noteVisible = criterionGradeVisibility?.[group.id] !== false;
                            const isOpen = !!expanded[group.id];

                            return (
                                <Paper
                                    key={group.id}
                                    elevation={0}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'background.paper'
                                    }}
                                >
                                    {/* Group header */}
                                    <Box
                                        onClick={() => handleToggleExpand(group.id)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 2,
                                            py: 1.25,
                                            cursor: 'pointer',
                                            bgcolor: 'grey.100',
                                            '&:hover': { bgcolor: 'grey.200' }
                                        }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {group.name}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={`${group.weight} Pts`}
                                                    sx={{ height: 20, fontWeight: 600 }}
                                                />
                                                <Tooltip title={noteVisible ? 'Ocultar columna de nota de este criterio' : 'Mostrar columna de nota de este criterio'}>
                                                    <Chip
                                                        size="small"
                                                        clickable
                                                        onClick={(e) => handleToggleCriterionNote(e, group.id)}
                                                        icon={noteVisible ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                                                        label={noteVisible ? 'Nota visible' : 'Nota oculta'}
                                                        color={noteVisible ? 'primary' : 'default'}
                                                        variant={noteVisible ? 'filled' : 'outlined'}
                                                        sx={{ height: 22, fontWeight: 500 }}
                                                    />
                                                </Tooltip>
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary">
                                                {group.sub_criteria.length} subcriterio{group.sub_criteria.length === 1 ? '' : 's'}
                                                {(group.special_criteria || []).length > 0 && ` · ${(group.special_criteria || []).length} extra`}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <Tooltip title={allEditable ? 'Bloquear todos los subcriterios' : 'Desbloquear todos los subcriterios'}>
                                                <IconButton size="small" onClick={(e) => handleBulkToggle(e, group.id, 'editable')}>
                                                    {allEditable ? <IconLockOpen size={18} color="#d81b60" /> : <IconLock size={18} color="#9e9e9e" />}
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); handleToggleExpand(group.id); }}
                                            >
                                                {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                                            </IconButton>
                                        </Stack>
                                    </Box>

                                    {/* Subcriteria list */}
                                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                        <List dense disablePadding>
                                            {group.sub_criteria.map((sub, idx) => (
                                                <ListItem
                                                    key={sub.id}
                                                    sx={{
                                                        pl: 4,
                                                        borderTop: idx === 0 ? 'none' : '1px solid',
                                                        borderColor: 'divider',
                                                        opacity: sub.visible ? 1 : 0.6
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{sub.name}</Typography>}
                                                        secondary={`${sub.percentage} Pts`}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Tooltip title={sub.visible ? 'Ocultar subcriterio' : 'Mostrar subcriterio'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleToggleVisible(group.id, sub.id, sub.visible, false); }}
                                                            >
                                                                {sub.visible ? <IconEye size={18} color="#1976d2" /> : <IconEyeOff size={18} color="#9e9e9e" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={sub.editable ? 'Bloquear edición' : 'Permitir edición'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleToggleEditable(group.id, sub.id, sub.editable, false); }}
                                                            >
                                                                {sub.editable ? <IconLockOpen size={18} color="#d81b60" /> : <IconLock size={18} color="#9e9e9e" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                            {(group.special_criteria || []).map(spec => (
                                                <ListItem
                                                    key={spec.id}
                                                    sx={{
                                                        pl: 4,
                                                        bgcolor: '#fff8e1',
                                                        borderTop: '1px solid',
                                                        borderColor: 'divider',
                                                        opacity: spec.visible ? 1 : 0.6
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                                <IconStar size={14} color="#e65100" />
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{spec.name}</Typography>
                                                                <Chip size="small" label="Extra" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ffe0b2', color: '#e65100' }} />
                                                            </Stack>
                                                        }
                                                        secondary={`+${spec.percentage} Pts adicionales`}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Tooltip title={spec.visible ? 'Ocultar extra' : 'Mostrar extra'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleToggleVisible(group.id, spec.id, spec.visible, true); }}
                                                            >
                                                                {spec.visible ? <IconEye size={18} color="#1976d2" /> : <IconEyeOff size={18} color="#9e9e9e" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={spec.editable ? 'Bloquear edición' : 'Permitir edición'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleToggleEditable(group.id, spec.id, spec.editable, true); }}
                                                            >
                                                                {spec.editable ? <IconLockOpen size={18} color="#d81b60" /> : <IconLock size={18} color="#9e9e9e" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Collapse>
                                </Paper>
                            );
                        })}
                    </Stack>
                </Paper>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                <Button onClick={handleSave} variant="contained" color="primary" disableElevation>
                    Guardar Ajustes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GradeSettingsDialog;
