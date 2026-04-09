import React, { useState } from 'react';
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
    ListItemText,
    IconButton,
    Tooltip,
    Divider,
    Box,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { IconChevronDown, IconEye, IconNotebook } from '@tabler/icons-react';
import StudentTaskModal from './StudentTaskModal';

// Mirrors the alternating group colors used in the Grades table
const GROUP_COLORS = [
    { bg: '#e3f2fd', border: '#2196f3', chipBg: '#1565c0' },  // primary light / primary800
    { bg: '#f3e5f5', border: '#673ab7', chipBg: '#5e35b1' },  // secondary light / secondaryDark
];

const StudentDetailModal = ({
    open,
    onClose,
    studentRow,
    structure,
    projects,
    activeCourse,
    onManageProject
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalSubCritId, setTaskModalSubCritId] = useState(null);

    if (!studentRow) return null;

    const fullName = `${studentRow.paterno} ${studentRow.materno} ${studentRow.nombre}`.trim();

    const handleOpenTasks = (subCritId) => {
        setTaskModalSubCritId(subCritId);
        setTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setTaskModalOpen(false);
        setTaskModalSubCritId(null);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullScreen={isMobile}
                fullWidth
                maxWidth="sm"
                sx={{ zIndex: 1300 }}
            >
                {/* Header — matches StudentTaskModal style: grey bg, centered */}
                <DialogTitle component="div" sx={{ pb: 1, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1.3}>
                        {fullName}
                    </Typography>
                    <Box sx={{ mt: 0.75, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        <Chip
                            label={`CI: ${studentRow.ci}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold', fontSize: '0.82rem' }}
                        />
                        {studentRow._finalGrade && studentRow._finalGrade !== '-' && (
                            <Chip
                                label={`Nota Final: ${studentRow._finalGrade}`}
                                size="small"
                                sx={{
                                    backgroundColor: '#c8e6c9',
                                    color: '#2e7d32',
                                    fontWeight: 'bold',
                                    fontSize: '0.82rem',
                                    border: '1px solid #4caf50'
                                }}
                            />
                        )}
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {structure.map((group, gIdx) => {
                        const criterionData = studentRow._criterionGrades?.[group.id] || { formatted: '-', grade: 0 };
                        const { bg, border, chipBg } = GROUP_COLORS[gIdx % 2];

                        return (
                            <Accordion key={group.id} disableGutters elevation={0} square>
                                <AccordionSummary
                                    expandIcon={<IconChevronDown size="1.2rem" color={border} />}
                                    sx={{
                                        backgroundColor: bg,
                                        borderLeft: `4px solid ${border}`,
                                        borderTop: gIdx > 0 ? '1px solid #e0e0e0' : 'none',
                                        '&:hover': { filter: 'brightness(0.96)' }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                                        <Typography fontWeight="bold" sx={{ color: chipBg }}>
                                            {group.name}
                                            <Typography component="span" variant="caption" sx={{ ml: 0.75, color: '#757575', fontWeight: 'normal' }}>
                                                ({group.weight} Pts)
                                            </Typography>
                                        </Typography>
                                        <Chip
                                            label={`${criterionData.formatted} / ${group.weight}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: chipBg,
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                fontSize: '0.78rem'
                                            }}
                                        />
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ p: 0 }}>
                                    <List dense disablePadding>
                                        {group.sub_criteria.map((sub, sIdx) => {
                                            const rawScore = studentRow.grades?.[sub.id];
                                            const score = rawScore !== undefined && rawScore !== null && rawScore !== ''
                                                ? parseFloat(rawScore).toFixed(2)
                                                : '-';
                                            const project = sub.has_projects
                                                ? projects.find(p => p.sub_criterion === sub.id && p.members.includes(studentRow.enrollment_id))
                                                : null;

                                            return (
                                                <React.Fragment key={sub.id}>
                                                    {sIdx > 0 && <Divider component="li" />}
                                                    <ListItem sx={{ px: 3, py: 0.75, backgroundColor: '#fafafa' }}>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                                                    {sub.name}
                                                                </Typography>
                                                            }
                                                            secondary={`Máx: ${sub.percentage} pts`}
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="bold"
                                                                sx={{ color: score !== '-' ? border : '#bdbdbd', minWidth: 36, textAlign: 'right' }}
                                                            >
                                                                {score}
                                                            </Typography>
                                                            {sub.has_tasks && (
                                                                <Tooltip title="Ver Tareas">
                                                                    <IconButton size="small" color="primary" onClick={() => handleOpenTasks(sub.id)}>
                                                                        <IconEye size="1.1rem" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {sub.has_projects && (
                                                                <Tooltip title={project ? `Proyecto: ${project.name}` : 'Sin proyecto asignado'}>
                                                                    <IconButton
                                                                        size="small"
                                                                        color={project ? 'secondary' : 'default'}
                                                                        onClick={() => project && onManageProject(project, group)}
                                                                        sx={{ color: project ? undefined : '#bdbdbd' }}
                                                                    >
                                                                        <IconNotebook size="1.1rem" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </ListItem>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Special criteria (extra points) — matches #fff3e0 used in Grades table */}
                                        {(group.special_criteria || []).map((spec) => {
                                            const rawScore = studentRow.grades?.[spec.id];
                                            const score = rawScore !== undefined && rawScore !== null && rawScore !== ''
                                                ? `+${parseFloat(rawScore).toFixed(2)}`
                                                : '-';

                                            return (
                                                <React.Fragment key={`spec-${spec.id}`}>
                                                    <Divider component="li" />
                                                    <ListItem sx={{ px: 3, py: 0.75, backgroundColor: '#fff3e0' }}>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body2" fontWeight={600} sx={{ color: '#e65100' }}>
                                                                    ⭐ {spec.name} (Extra)
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="caption" sx={{ color: '#bf360c' }}>
                                                                    Máx: +{spec.percentage} pts
                                                                </Typography>
                                                            }
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#e65100', minWidth: 36, textAlign: 'right' }}>
                                                                {score}
                                                            </Typography>
                                                            {spec.has_tasks && (
                                                                <Tooltip title="Ver Tareas Extra">
                                                                    <IconButton size="small" onClick={() => handleOpenTasks(`special-${spec.id}`)} sx={{ color: '#e65100' }}>
                                                                        <IconEye size="1.1rem" />
                                                                    </IconButton>
                                                                </Tooltip>
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

                <DialogActions sx={{ px: 2, py: 1.5, backgroundColor: '#f5f5f5' }}>
                    <Button onClick={onClose} color="primary" variant="contained" fullWidth sx={{ margin: '0 8px' }}>
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            <StudentTaskModal
                open={taskModalOpen}
                onClose={handleCloseTaskModal}
                courseId={activeCourse?.id}
                subCriterionId={taskModalSubCritId}
                studentRow={studentRow}
            />
        </>
    );
};

export default StudentDetailModal;
