import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TextField, IconButton, Tooltip } from '@mui/material';
import { IconPencil, IconTrash, IconDeviceFloppy, IconLock, IconLockOpen, IconEye, IconEyeOff, IconListCheck, IconX } from '@tabler/icons-react';
import { LETTER_KEYS } from '../../../../hooks/useTaskGrading';
import { BulkConfirmDialog } from './TaskGradingDialogs';

const ManageTasksDialog = React.memo(({ open, onClose, tasks, onUpdateTask, onToggleTaskField, onDeleteTask, onBulkGrade }) => {
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ name: '', weight: 1, activityDate: '' });
    const [bulkId, setBulkId] = useState(null);
    const [bulkConfirm, setBulkConfirm] = useState({ open: false, taskId: null, letter: null });

    const startEdit = (task) => { setEditId(task.id); setEditData({ name: task.name, weight: task.weight, activityDate: task.activity_date || '' }); };
    const cancelEdit = () => setEditId(null);
    const saveEdit = () => { onUpdateTask(editId, editData); cancelEdit(); };
    const confirmBulk = () => { onBulkGrade(bulkConfirm.taskId, bulkConfirm.letter); setBulkId(null); setBulkConfirm({ open: false, taskId: null, letter: null }); };

    const renderActions = (task) => {
        if (bulkId === task.id) return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                {LETTER_KEYS.map(l => (
                    <Button key={l} variant="contained" size="small" color="primary" sx={{ minWidth: 24, p: '2px' }} onClick={() => setBulkConfirm({ open: true, taskId: task.id, letter: l })}>{l}</Button>
                ))}
                <IconButton size="small" onClick={() => setBulkId(null)} color="secondary"><IconX size="1.2rem" /></IconButton>
            </div>
        );
        if (editId === task.id) return (
            <>
                <IconButton onClick={saveEdit} color="primary" size="small"><IconDeviceFloppy /></IconButton>
                <IconButton onClick={cancelEdit} size="small"><IconX size="1.2rem" /></IconButton>
            </>
        );
        return (
            <>
                <Tooltip title="Llenar a todos"><IconButton onClick={() => setBulkId(task.id)} color="info" size="small" disabled={task.is_locked}><IconListCheck /></IconButton></Tooltip>
                <IconButton onClick={() => startEdit(task)} color="primary" size="small"><IconPencil /></IconButton>
                <IconButton onClick={() => onDeleteTask(task.id)} color="secondary" size="small"><IconTrash /></IconButton>
            </>
        );
    };

    return (
        <>
            <Dialog sx={{ zIndex: 9999 }} open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Visibilidad de Tareas</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Controle la visibilidad, bloqueo o peso de las tareas.</DialogContentText>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 120 }}>Fecha</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>Peso</TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>Visible</TableCell>
                                    <TableCell align="center" sx={{ width: 80 }}>Bloq.</TableCell>
                                    <TableCell align="center" sx={{ width: 220 }}>Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell>
                                            {editId === task.id
                                                ? <TextField type="date" value={editData.activityDate} onChange={e => setEditData(d => ({ ...d, activityDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} sx={{ width: 140 }} />
                                                : task.activity_date || <span style={{ color: '#bbb' }}>—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {editId === task.id
                                                ? <TextField fullWidth value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} size="small" />
                                                : task.name}
                                        </TableCell>
                                        <TableCell align="center">
                                            {editId === task.id
                                                ? <TextField type="number" value={editData.weight} onChange={e => setEditData(d => ({ ...d, weight: parseInt(e.target.value) || 1 }))} size="small" inputProps={{ min: 1 }} style={{ width: 60 }} />
                                                : `${task.weight}x`}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => editId !== task.id && onToggleTaskField(task, 'is_public')} size="small" disabled={editId === task.id}>
                                                {task.is_public ? <IconEye size="1.2rem" color={editId === task.id ? 'grey' : 'green'} /> : <IconEyeOff size="1.2rem" color={editId === task.id ? 'grey' : 'gray'} />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => editId !== task.id && onToggleTaskField(task, 'is_locked')} size="small" disabled={editId === task.id}>
                                                {task.is_locked ? <IconLock size="1.2rem" color={editId === task.id ? 'grey' : 'red'} /> : <IconLockOpen size="1.2rem" color={editId === task.id ? 'grey' : 'green'} />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="center">{renderActions(task)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
            <BulkConfirmDialog open={bulkConfirm.open} letter={bulkConfirm.letter} onClose={() => setBulkConfirm({ open: false, taskId: null, letter: null })} onConfirm={confirmBulk} />
        </>
    );
});

export default ManageTasksDialog;
