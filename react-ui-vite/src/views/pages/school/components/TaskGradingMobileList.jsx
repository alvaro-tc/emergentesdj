import React, { useState } from 'react';
import { List, ListItemButton, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconLock, IconPencil, IconX } from '@tabler/icons-react';
import { LETTER_KEYS, LETTER_SCORES, getLetterFromScore } from '../../../../hooks/useTaskGrading';

const TaskGradingMobileList = React.memo(({ filteredRows, visibleTasks, tasks, rows, loading, onGradeClick, onClearScore }) => {
    const theme = useTheme();
    const [modal, setModal] = useState({ open: false, row: null });

    const openModal = (row) => setModal({ open: true, row });
    const closeModal = () => setModal({ open: false, row: null });

    const calcAverage = (row) => {
        let totalWeight = 0, weightedSum = 0;
        tasks.forEach(task => { const s = parseFloat(row.scores[task.id]) || 0; weightedSum += s * task.weight; totalWeight += task.weight; });
        return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
    };

    return (
        <>
            <List style={{ marginTop: 10, padding: 0 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}><CircularProgress /></div>
                ) : filteredRows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>No hay estudiantes o tareas.</div>
                ) : filteredRows.map((row, index) => (
                    <ListItemButton
                        key={row.enrollment_id}
                        onClick={() => openModal(row)}
                        sx={{
                            borderBottom: '1px solid', borderColor: 'divider', padding: '12px 16px', display: 'block',
                            backgroundColor: index % 2 === 0 ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div>
                                <Typography variant="body1" style={{ fontWeight: 600 }}>{row.paterno} {row.materno} {row.nombre}</Typography>
                                {tasks.length > 0 && <Typography variant="caption" color="text.secondary">Promedio: {calcAverage(row)}</Typography>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {visibleTasks.slice(0, 3).map(task => {
                                    const letter = getLetterFromScore(row.scores[task.id]);
                                    return letter ? (
                                        <span key={task.id} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', backgroundColor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{letter}</span>
                                    ) : (
                                        <span key={task.id} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: `2px dashed ${theme.palette.divider}`, color: theme.palette.text.disabled, fontSize: '0.7rem' }}>—</span>
                                    );
                                })}
                                {visibleTasks.length > 3 && <Typography variant="caption" color="text.secondary">+{visibleTasks.length - 3}</Typography>}
                                <IconPencil size="1rem" color={theme.palette.text.secondary} />
                            </div>
                        </div>
                    </ListItemButton>
                ))}
            </List>

            <Dialog
                open={modal.open}
                onClose={closeModal}
                fullWidth maxWidth="xs"
                sx={{ zIndex: 9999, '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } } }}
                PaperProps={{ sx: { m: { xs: 0, sm: 2 }, width: '100%', borderRadius: { xs: '24px 24px 0 0', sm: '16px' }, pb: { xs: 2, sm: 0 }, maxHeight: '85vh' } }}
            >
                {modal.row && (
                    <>
                        <DialogTitle sx={{ pb: 1, pt: 3, textAlign: 'center', position: 'relative' }}>
                            <div style={{ width: 40, height: 4, backgroundColor: theme.palette.divider, borderRadius: 8, position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)' }} />
                            <Typography variant="h6" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{modal.row.paterno} {modal.row.materno} {modal.row.nombre}</Typography>
                        </DialogTitle>
                        <DialogContent style={{ paddingTop: 16 }}>
                            {visibleTasks.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" align="center">No hay tareas visibles.</Typography>
                            ) : visibleTasks.map(task => {
                                const liveRow = rows.find(r => r.enrollment_id === modal.row.enrollment_id) || modal.row;
                                const letter = getLetterFromScore(liveRow.scores[task.id]);
                                return (
                                    <div key={task.id} style={{ marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant="body1" style={{ fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
                                            {task.name}{task.is_locked && <IconLock size="1rem" color="red" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
                                        </Typography>
                                        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                                            {LETTER_KEYS.map(l => (
                                                <Button key={l} variant={letter === l ? 'contained' : 'outlined'} color="primary" disabled={task.is_locked}
                                                    sx={{ minWidth: 0, flex: 1, height: { xs: '44px', sm: '48px' }, fontSize: { xs: '1.05rem', sm: '1.1rem' }, fontWeight: 'bold', p: 0, borderRadius: '10px', boxShadow: letter === l ? '0 4px 10px rgba(0,0,0,0.15)' : 'none' }}
                                                    onClick={() => {
                                                        onGradeClick(liveRow.enrollment_id, task.id, l);
                                                        setModal(prev => ({ ...prev, row: { ...prev.row, scores: { ...prev.row.scores, [task.id]: LETTER_SCORES[l] } } }));
                                                    }}
                                                >{l}</Button>
                                            ))}
                                            <Tooltip title="Borrar nota">
                                                <IconButton disabled={task.is_locked || !letter}
                                                    onClick={() => { if (!letter) return; onClearScore(liveRow.enrollment_id, task.id); setModal(prev => ({ ...prev, row: { ...prev.row, scores: { ...prev.row.scores, [task.id]: null } } })); }}
                                                    sx={{ color: letter ? 'error.main' : 'text.disabled', border: '1px solid', borderColor: letter ? 'error.main' : 'divider', borderRadius: '10px', flex: 1, minWidth: 0, height: { xs: '44px', sm: '48px' } }}
                                                ><IconX size="1.2rem" /></IconButton>
                                            </Tooltip>
                                        </div>
                                    </div>
                                );
                            })}
                        </DialogContent>
                        <DialogActions style={{ padding: 16, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button onClick={closeModal} color="primary" variant="contained" fullWidth size="large" style={{ borderRadius: 12, fontWeight: 'bold' }}>Listo</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
});

export default TaskGradingMobileList;
