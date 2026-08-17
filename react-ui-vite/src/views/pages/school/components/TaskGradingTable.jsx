/**
 * Planilla de calificación por actividad.
 *
 * Con 20+ actividades en el semestre la tabla no cabe en pantalla, así que la
 * celda se reduce a la nota: un cuadro del tamaño de un dedo que muestra la
 * letra. Los botones A–E viven en un popover anclado a la celda, no dentro de
 * ella. Sigue siendo un clic para abrir y otro para calificar, igual que antes,
 * pero entran ~15 columnas en vez de 4.
 *
 * La columna del estudiante y la cabecera quedan fijas: con scroll horizontal,
 * sin ellas no se sabe a quién ni qué se está calificando.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Box, Button,
    CircularProgress, IconButton, Tooltip, Menu, MenuItem, Popover, Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconSettings, IconLock, IconX } from '@tabler/icons-react';
import { LETTER_KEYS, getLetterFromScore } from '../../../../hooks/useTaskGrading';

/** Ancho de una columna de actividad. Cabe la letra y el área táctil mínima. */
const CELL_WIDTH = 52;

const TaskGradingTable = React.memo(({ visibleTasks, tasks, filteredRows, loading, onGradeClick, onClearScore, onBulkGrade }) => {
    const theme = useTheme();
    const [bulkAnchor, setBulkAnchor] = useState(null);
    const [bulkTaskId, setBulkTaskId] = useState(null);
    // Celda abierta en el popover: null cuando está cerrado.
    const [editing, setEditing] = useState(null);

    const handleBulkOpen = (e, taskId) => { setBulkAnchor(e.currentTarget); setBulkTaskId(taskId); };
    const handleBulkClose = () => { setBulkAnchor(null); setBulkTaskId(null); };
    const handleBulkSelect = (letter) => { onBulkGrade(bulkTaskId, letter); handleBulkClose(); };

    const openCell = (event, row, task) => {
        if (task.is_locked) return;
        setEditing({ anchor: event.currentTarget, enrollmentId: row.enrollment_id, taskId: task.id, task });
    };
    const closeCell = useCallback(() => setEditing(null), []);

    const handleGrade = (letter) => {
        onGradeClick(editing.enrollmentId, editing.taskId, letter);
        closeCell();
    };
    const handleClear = () => {
        onClearScore(editing.enrollmentId, editing.taskId);
        closeCell();
    };

    // El promedio pondera todas las tareas, también las ocultas.
    const calcAverage = useCallback((row) => {
        let totalWeight = 0, weightedSum = 0;
        tasks.forEach(task => {
            const s = parseFloat(row.scores[task.id]) || 0;
            weightedSum += s * task.weight;
            totalWeight += task.weight;
        });
        return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
    }, [tasks]);

    // Nota que está mostrando el popover, leída de la fila viva para que el
    // resaltado siga al último clic.
    const editingLetter = useMemo(() => {
        if (!editing) return null;
        const row = filteredRows.find(r => r.enrollment_id === editing.enrollmentId);
        return row ? getLetterFromScore(row.scores[editing.taskId]) : null;
    }, [editing, filteredRows]);

    // La columna fija tiene que tapar lo que pasa por debajo: fondo opaco.
    const stickyBg = theme.palette.background.paper;
    const stickyCol = {
        position: 'sticky',
        left: 0,
        zIndex: 2,
        bgcolor: stickyBg,
        borderRight: '1px solid',
        borderColor: 'divider',
        minWidth: 180,
        maxWidth: 240
    };

    return (
        <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                <Table size="small" stickyHeader sx={{ width: 'auto' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ ...stickyCol, zIndex: 4 }}>Estudiante</TableCell>
                            {visibleTasks.map(task => (
                                <TableCell
                                    key={task.id}
                                    align="center"
                                    sx={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH, px: 0.25 }}
                                >
                                    <Tooltip title={`${task.name} · peso ${task.weight}x${task.is_locked ? ' · bloqueada' : ''}`}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block', fontWeight: 600, lineHeight: 1.2,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {task.name}
                                        </Typography>
                                    </Tooltip>
                                    {task.is_locked
                                        ? <IconLock size="0.9rem" color={theme.palette.error.main} />
                                        : (
                                            <IconButton size="small" sx={{ p: 0.25 }} onClick={e => handleBulkOpen(e, task.id)}>
                                                <IconSettings size="0.9rem" />
                                            </IconButton>
                                        )}
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 72 }}>Promedio</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={visibleTasks.length + 2} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={visibleTasks.length + 2} align="center">No hay estudiantes o tareas.</TableCell></TableRow>
                        ) : filteredRows.map(row => (
                            <TableRow key={row.enrollment_id} hover>
                                <TableCell sx={{ ...stickyCol, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {row.paterno} {row.materno} {row.nombre}
                                </TableCell>
                                {visibleTasks.map(task => {
                                    const letter = getLetterFromScore(row.scores[task.id]);
                                    const isOpen = editing?.enrollmentId === row.enrollment_id && editing?.taskId === task.id;
                                    return (
                                        <TableCell
                                            key={task.id}
                                            align="center"
                                            sx={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH, p: 0.25 }}
                                        >
                                            <Box
                                                component="button"
                                                type="button"
                                                onClick={e => openCell(e, row, task)}
                                                disabled={task.is_locked}
                                                aria-label={`${task.name}: ${letter || 'sin nota'}`}
                                                sx={{
                                                    width: '100%', height: 34,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    font: 'inherit', fontWeight: 'bold', fontSize: '1rem',
                                                    borderRadius: 1,
                                                    cursor: task.is_locked ? 'default' : 'pointer',
                                                    border: '1px solid',
                                                    borderColor: isOpen ? 'primary.main' : (letter ? 'transparent' : 'divider'),
                                                    borderStyle: letter ? 'solid' : 'dashed',
                                                    bgcolor: letter ? 'primary.main' : 'transparent',
                                                    color: letter ? 'primary.contrastText' : 'text.disabled',
                                                    opacity: task.is_locked ? 0.55 : 1,
                                                    transition: 'background-color .1s, border-color .1s',
                                                    '&:hover': { borderColor: task.is_locked ? undefined : theme.palette.primary.main }
                                                }}
                                            >
                                                {letter || '·'}
                                            </Box>
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                                    {calcAverage(row)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Selector de nota de una celda */}
            <Popover
                open={Boolean(editing)}
                anchorEl={editing?.anchor || null}
                onClose={closeCell}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                slotProps={{ paper: { sx: { p: 0.75, borderRadius: 2 } } }}
            >
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {LETTER_KEYS.map(l => (
                        <Button
                            key={l}
                            variant={editingLetter === l ? 'contained' : 'outlined'}
                            onClick={() => handleGrade(l)}
                            sx={{ minWidth: 40, height: 40, p: 0, fontSize: '1rem', fontWeight: 'bold', borderRadius: 1.5 }}
                        >
                            {l}
                        </Button>
                    ))}
                    <Tooltip title="Borrar nota">
                        <span>
                            <IconButton
                                onClick={handleClear}
                                disabled={!editingLetter}
                                sx={{
                                    width: 40, height: 40, borderRadius: 1.5,
                                    border: '1px solid', borderColor: editingLetter ? 'error.main' : 'divider',
                                    color: editingLetter ? 'error.main' : 'text.disabled'
                                }}
                            >
                                <IconX size="1.1rem" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Popover>

            <Menu anchorEl={bulkAnchor} open={Boolean(bulkAnchor)} onClose={handleBulkClose} keepMounted>
                <MenuItem disabled>Calificar Todos:</MenuItem>
                {LETTER_KEYS.map(l => <MenuItem key={l} onClick={() => handleBulkSelect(l)}>Asignar {l}</MenuItem>)}
            </Menu>
        </>
    );
});

export default TaskGradingTable;
