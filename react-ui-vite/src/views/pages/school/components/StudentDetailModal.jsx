import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    Divider,
    Box,
    TextField,
    IconButton,
    Tooltip,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { IconChevronDown, IconEye, IconNotebook, IconLock, IconLockOpen } from '@tabler/icons-react';
import StudentTaskModal from './StudentTaskModal';

const GROUP_COLORS = [
    { bg: '#e3f2fd', border: '#1976d2', chipBg: '#1565c0' },
    { bg: '#f3e5f5', border: '#7b1fa2', chipBg: '#6a1b9a' },
];

// Recalculate final grade from local grades + structure
const calcFinalGrade = (localGrades, structure) => {
    let total = 0;
    structure.forEach(group => {
        let groupTotal = 0;
        group.sub_criteria.forEach(sub => {
            const v = localGrades[sub.id];
            if (v !== undefined && v !== null && v !== '') groupTotal += parseFloat(v);
        });
        (group.special_criteria || []).forEach(spec => {
            const v = localGrades[spec.id];
            if (v !== undefined && v !== null && v !== '') groupTotal += parseFloat(v);
        });
        const capped = Math.min(groupTotal, parseFloat(group.weight));
        if (capped > 0) total += capped;
    });
    return total > 0 ? total.toFixed(2) : '-';
};

const calcCriterionGrade = (localGrades, group) => {
    let total = 0;
    group.sub_criteria.forEach(sub => {
        const v = localGrades[sub.id];
        if (v !== undefined && v !== null && v !== '') total += parseFloat(v);
    });
    (group.special_criteria || []).forEach(spec => {
        const v = localGrades[spec.id];
        if (v !== undefined && v !== null && v !== '') total += parseFloat(v);
    });
    const capped = Math.min(total, parseFloat(group.weight));
    return capped > 0 ? capped.toFixed(2) : '-';
};

const StudentDetailModal = ({
    open,
    onClose,
    studentRow,
    structure,
    projects,
    activeCourse,
    onScoreChange,
    onManageProject
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [localGrades, setLocalGrades] = useState({});
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalSubCritId, setTaskModalSubCritId] = useState(null);
    const [editingEnabled, setEditingEnabled] = useState(false);

    useEffect(() => {
        if (studentRow) setLocalGrades({ ...(studentRow.grades || {}) });
        setEditingEnabled(false);
    }, [studentRow?.enrollment_id, open]);

    if (!studentRow) return null;

    const fullName = `${studentRow.paterno} ${studentRow.materno} ${studentRow.nombre}`.trim();
    const finalGrade = calcFinalGrade(localGrades, structure);

    const handleChange = (critId, value, max) => {
        if (value !== '') {
            const num = parseFloat(value);
            if (num > max || num < 0) return;
        }
        setLocalGrades(prev => ({ ...prev, [critId]: value }));
        onScoreChange?.(studentRow.enrollment_id, critId, value);
    };

    const handleOpenTasks = (subCritId) => {
        setTaskModalSubCritId(subCritId);
        setTaskModalOpen(true);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="xs"
                scroll="paper"
                PaperProps={{
                    sx: isMobile ? {
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        m: 0,
                        width: '100%',
                        maxWidth: '100%',
                        borderRadius: '20px 20px 0 0',
                        maxHeight: '88vh',
                    } : { borderRadius: 3 }
                }}
                sx={{ zIndex: 1400 }}
            >
                {/* Drag handle (mobile only) */}
                {isMobile && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.25, pb: 0 }}>
                        <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'divider' }} />
                    </Box>
                )}

                <DialogTitle component="div" sx={{ pt: isMobile ? 1 : 2, pb: 1.5, px: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3} noWrap>
                                {fullName}
                            </Typography>
                            <Box sx={{ mt: 0.75, display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Chip
                                    label={studentRow.ci}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                                />
                                <Chip
                                    label={finalGrade !== '-' ? `${finalGrade} pts` : 'Sin nota'}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        ...(finalGrade !== '-'
                                            ? { backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }
                                            : { backgroundColor: '#f5f5f5', color: '#9e9e9e' }
                                        )
                                    }}
                                />
                            </Box>
                        </Box>
                        <Tooltip title={editingEnabled ? 'Deshabilitar edición' : 'Habilitar edición'}>
                            <IconButton
                                size="small"
                                onClick={() => setEditingEnabled(prev => !prev)}
                                sx={{
                                    ml: 1,
                                    mt: 0.25,
                                    color: editingEnabled ? 'primary.main' : 'text.disabled',
                                    border: '1px solid',
                                    borderColor: editingEnabled ? 'primary.main' : 'divider',
                                    borderRadius: 1.5,
                                    p: '4px',
                                }}
                            >
                                {editingEnabled ? <IconLockOpen size="1rem" /> : <IconLock size="1rem" />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </DialogTitle>

                <Divider />

                <DialogContent sx={{ p: 0, overflowX: 'hidden' }}>
                    {structure.map((group, gIdx) => {
                        const { bg, border, chipBg } = GROUP_COLORS[gIdx % 2];
                        const criterionGrade = calcCriterionGrade(localGrades, group);

                        return (
                            <Accordion key={group.id} disableGutters elevation={0} square defaultExpanded={gIdx === 0}>
                                <AccordionSummary
                                    expandIcon={<IconChevronDown size="1rem" color={border} />}
                                    sx={{
                                        minHeight: 40,
                                        backgroundColor: bg,
                                        borderLeft: `3px solid ${border}`,
                                        borderBottom: '1px solid',
                                        borderBottomColor: 'divider',
                                        '& .MuiAccordionSummary-content': { my: 0.75 }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', pr: 0.5 }}>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: chipBg }}>
                                            {group.name}
                                            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 400 }}>
                                                / {group.weight} pts
                                            </Typography>
                                        </Typography>
                                        <Chip
                                            label={criterionGrade !== '-' ? criterionGrade : '—'}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                backgroundColor: chipBg,
                                                color: '#fff',
                                                minWidth: 40
                                            }}
                                        />
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ p: 0 }}>
                                    <List dense disablePadding>
                                        {group.sub_criteria.map((sub, sIdx) => {
                                            const rawScore = localGrades[sub.id];
                                            const score = rawScore !== undefined && rawScore !== null && rawScore !== ''
                                                ? parseFloat(rawScore).toFixed(2) : '-';
                                            const project = sub.has_projects
                                                ? projects.find(p => p.sub_criterion === sub.id && p.members.includes(studentRow.enrollment_id))
                                                : null;

                                            return (
                                                <React.Fragment key={sub.id}>
                                                    {sIdx > 0 && <Divider component="li" />}
                                                    <ListItem sx={{ px: 2.5, py: 1, gap: 1 }}>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                                {sub.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Máx {sub.percentage} pts
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                                            {sub.has_tasks ? (
                                                                <>
                                                                    <Typography variant="body2" fontWeight={700} sx={{ color: border, minWidth: 32, textAlign: 'right' }}>
                                                                        {score}
                                                                    </Typography>
                                                                    <Tooltip title="Ver Tareas">
                                                                        <IconButton size="small" color="primary" onClick={() => handleOpenTasks(sub.id)}>
                                                                            <IconEye size="1rem" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </>
                                                            ) : sub.has_projects ? (
                                                                <>
                                                                    <Typography variant="body2" fontWeight={700} sx={{ color: border, minWidth: 32, textAlign: 'right' }}>
                                                                        {score}
                                                                    </Typography>
                                                                    <Tooltip title={project ? `Proyecto: ${project.name}` : 'Sin proyecto'}>
                                                                        <IconButton
                                                                            size="small"
                                                                            color={project ? 'secondary' : 'default'}
                                                                            onClick={() => project && onManageProject(project, group)}
                                                                            sx={{ color: project ? undefined : '#ccc' }}
                                                                        >
                                                                            <IconNotebook size="1rem" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </>
                                                            ) : sub.editable && editingEnabled ? (
                                                                <TextField
                                                                    type="number"
                                                                    value={localGrades[sub.id] ?? ''}
                                                                    onChange={e => handleChange(sub.id, e.target.value, sub.percentage)}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ width: 72 }}
                                                                    inputProps={{
                                                                        min: 0, max: sub.percentage, step: '0.01',
                                                                        style: { textAlign: 'center', padding: '4px 6px', fontSize: '0.85rem' }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
                                                                    {score}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </ListItem>
                                                </React.Fragment>
                                            );
                                        })}

                                        {(group.special_criteria || []).map((spec) => {
                                            const rawScore = localGrades[spec.id];
                                            const score = rawScore !== undefined && rawScore !== null && rawScore !== ''
                                                ? `+${parseFloat(rawScore).toFixed(2)}` : '-';

                                            return (
                                                <React.Fragment key={`spec-${spec.id}`}>
                                                    <Divider component="li" />
                                                    <ListItem sx={{ px: 2.5, py: 1, gap: 1, backgroundColor: '#fffde7' }}>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" fontWeight={500} noWrap sx={{ color: '#e65100' }}>
                                                                ⭐ {spec.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#bf360c' }}>
                                                                Máx +{spec.percentage} pts
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                                            {spec.has_tasks ? (
                                                                <>
                                                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#e65100', minWidth: 36, textAlign: 'right' }}>
                                                                        {score}
                                                                    </Typography>
                                                                    <Tooltip title="Ver Tareas Extra">
                                                                        <IconButton size="small" onClick={() => handleOpenTasks(`special-${spec.id}`)} sx={{ color: '#e65100' }}>
                                                                            <IconEye size="1rem" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </>
                                                            ) : editingEnabled ? (
                                                                <TextField
                                                                    type="number"
                                                                    value={localGrades[spec.id] ?? ''}
                                                                    onChange={e => handleChange(spec.id, e.target.value, spec.percentage)}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ width: 72 }}
                                                                    inputProps={{
                                                                        min: 0, max: spec.percentage, step: '0.01',
                                                                        style: { textAlign: 'center', padding: '4px 6px', fontSize: '0.85rem', color: '#e65100' }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography variant="body2" fontWeight={700} sx={{ color: '#e65100', minWidth: 36, textAlign: 'right' }}>
                                                                    {localGrades[spec.id] !== undefined && localGrades[spec.id] !== null && localGrades[spec.id] !== ''
                                                                        ? `+${parseFloat(localGrades[spec.id]).toFixed(2)}` : '-'}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </ListItem>
                                                </React.Fragment>
                                            );
                                        })}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </DialogContent>

                <DialogActions sx={{ px: 2.5, py: 1.5 }}>
                    <Button onClick={onClose} variant="contained" fullWidth disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            <StudentTaskModal
                open={taskModalOpen}
                onClose={() => { setTaskModalOpen(false); setTaskModalSubCritId(null); }}
                courseId={activeCourse?.id}
                subCriterionId={taskModalSubCritId}
                studentRow={studentRow}
            />
        </>
    );
};

export default StudentDetailModal;
