import React, { useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, CircularProgress, IconButton, Tooltip, Grid, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { IconSettings, IconLock, IconPencil, IconX } from '@tabler/icons-react';
import { LETTER_KEYS, getLetterFromScore } from '../../../../hooks/useTaskGrading';

const TaskGradingTable = React.memo(({ visibleTasks, tasks, filteredRows, loading, onGradeClick, onClearScore, onBulkGrade }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [editMode, setEditMode] = useState({});
    const [bulkAnchor, setBulkAnchor] = useState(null);
    const [bulkTaskId, setBulkTaskId] = useState(null);

    const toggleEdit = (eId, tId) => setEditMode(p => ({ ...p, [`${eId}-${tId}`]: true }));
    const clearEdit = (eId, tId) => setEditMode(p => { const n = { ...p }; delete n[`${eId}-${tId}`]; return n; });

    const handleGrade = (eId, tId, letter) => { onGradeClick(eId, tId, letter); clearEdit(eId, tId); };
    const handleBulkOpen = (e, taskId) => { setBulkAnchor(e.currentTarget); setBulkTaskId(taskId); };
    const handleBulkClose = () => { setBulkAnchor(null); setBulkTaskId(null); };
    const handleBulkSelect = (letter) => { onBulkGrade(bulkTaskId, letter); handleBulkClose(); };

    const calcAverage = (row) => {
        let totalWeight = 0, weightedSum = 0;
        tasks.forEach(task => { const s = parseFloat(row.scores[task.id]) || 0; weightedSum += s * task.weight; totalWeight += task.weight; });
        return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
    };

    return (
        <>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Estudiante</TableCell>
                            {visibleTasks.map(task => (
                                <TableCell key={task.id} align="center">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Tooltip title={`Peso: ${task.weight}x`}>
                                            <span>{task.name}{task.is_locked && <IconLock size="0.8rem" color="red" style={{ marginLeft: 4 }} />}</span>
                                        </Tooltip>
                                        <IconButton size="small" onClick={e => handleBulkOpen(e, task.id)} disabled={task.is_locked}>
                                            <IconSettings size="1rem" />
                                        </IconButton>
                                    </div>
                                </TableCell>
                            ))}
                            <TableCell align="center" style={{ fontWeight: 'bold' }}>Promedio Final</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={visibleTasks.length + 2} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={visibleTasks.length + 2} align="center">No hay estudiantes o tareas.</TableCell></TableRow>
                        ) : filteredRows.map(row => (
                            <TableRow key={row.enrollment_id} hover>
                                <TableCell>{row.paterno} {row.materno} {row.nombre}</TableCell>
                                {visibleTasks.map(task => {
                                    const letter = getLetterFromScore(row.scores[task.id]);
                                    const inEdit = editMode[`${row.enrollment_id}-${task.id}`];
                                    return (
                                        <TableCell key={task.id} align="center" style={{ minWidth: 180, padding: 16 }}>
                                            {letter && !inEdit ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', marginRight: 8 }}>{letter}</span>
                                                    {task.is_locked
                                                        ? <IconLock size="1rem" color="gray" />
                                                        : <IconButton size="small" onClick={() => toggleEdit(row.enrollment_id, task.id)}><IconPencil size="1rem" /></IconButton>}
                                                </div>
                                            ) : (
                                                <Grid container spacing={1} justifyContent="center" style={{ width: '100%', margin: 0 }}>
                                                    {LETTER_KEYS.map(l => (
                                                        <Grid key={l} style={{ padding: 2 }}>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                style={{
                                                                    minWidth: isMobile ? 25 : 30,
                                                                    padding: isMobile ? '2px' : '4px',
                                                                    fontSize: isMobile ? '0.7rem' : '0.875rem',
                                                                    borderColor: theme.palette.primary.main,
                                                                    color: letter === l ? '#fff' : theme.palette.primary.main,
                                                                    backgroundColor: letter === l ? theme.palette.primary.main : 'transparent'
                                                                }}
                                                                onClick={() => handleGrade(row.enrollment_id, task.id, l)}
                                                                disabled={task.is_locked}
                                                            >{l}</Button>
                                                        </Grid>
                                                    ))}
                                                    {letter && (
                                                        <Grid style={{ padding: 2 }}>
                                                            <Tooltip title="Borrar nota">
                                                                <IconButton size="small" onClick={() => { onClearScore(row.enrollment_id, task.id); clearEdit(row.enrollment_id, task.id); }} disabled={task.is_locked} style={{ color: theme.palette.error.main }}>
                                                                    <IconX size="1rem" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            )}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" style={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>{calcAverage(row)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Menu anchorEl={bulkAnchor} open={Boolean(bulkAnchor)} onClose={handleBulkClose} keepMounted>
                <MenuItem disabled>Calificar Todos:</MenuItem>
                {LETTER_KEYS.map(l => <MenuItem key={l} onClick={() => handleBulkSelect(l)}>Asignar {l}</MenuItem>)}
            </Menu>
        </>
    );
});

export default TaskGradingTable;
