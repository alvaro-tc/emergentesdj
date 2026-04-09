import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { IconLock } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../../config';

const LETTER_SCORES = {
    'A': 1.0,
    'B': 0.75,
    'C': 0.5,
    'D': 0.25,
    'E': 0.0
};

const getLetterFromScore = (score) => {
    if (score === null || score === undefined || score === '') return null;
    const s = parseFloat(score);
    if (s >= 1.0) return 'A';
    if (s >= 0.75) return 'B';
    if (s >= 0.5) return 'C';
    if (s >= 0.25) return 'D';
    return 'E';
};

const StudentTaskModal = ({ open, onClose, courseId, subCriterionId, studentRow }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [scores, setScores] = useState({});

    useEffect(() => {
        if (open && courseId && subCriterionId && studentRow) {
            setLoading(true);
            axios.get(`${configData.API_SERVER}task-scores/task_sheet/?course_id=${courseId}&sub_criterion_id=${subCriterionId}`)
                .then(res => {
                    const allTasks = res.data.tasks;
                    const allRows = res.data.rows;
                    
                    // Solo mostramos tareas publicas
                    setTasks(allTasks.filter(t => t.is_public));
                    
                    const singleRow = allRows.find(r => r.enrollment_id === studentRow.enrollment_id);
                    if (singleRow) {
                        setScores(singleRow.scores || {});
                    } else {
                        // En caso raro de que no exista el row aun, inicializa vacio
                        setScores({});
                    }
                })
                .catch(err => {
                    console.error("Error cargando tareas del estudiante", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, courseId, subCriterionId, studentRow]);

    const handleGradeClick = (taskId, letter) => {
        const value = LETTER_SCORES[letter];
        
        // Optimistic update
        setScores(prev => ({
            ...prev,
            [taskId]: value
        }));

        // Send to backend
        axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, {
            updates: [{
                enrollment_id: studentRow.enrollment_id,
                task_id: taskId,
                score: value
            }]
        }).catch(err => {
            console.error("Error guardando nota de tarea", err);
        });
    };

    if (!studentRow) return null;

    return (
        <Dialog fullScreen={isMobile} open={open} sx={{ zIndex: 9999 }} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle component="div" style={{ paddingBottom: 8, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" component="div" style={{ fontWeight: 'bold', lineHeight: 1.3, fontSize: '1.25rem' }}>
                    {studentRow.paterno} {studentRow.materno} {studentRow.nombre}
                </Typography>
                <Typography variant="body2" component="div" color="textSecondary">
                    Calificación de Tareas
                </Typography>
            </DialogTitle>
            <DialogContent style={{ paddingTop: 20 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <CircularProgress />
                        <Typography style={{ marginTop: 10 }}>Cargando...</Typography>
                    </div>
                ) : tasks.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: 20 }}>
                        No hay tareas visibles para este subcriterio.
                    </Typography>
                ) : (
                    tasks.map(task => {
                        const score = scores[task.id];
                        const letter = getLetterFromScore(score);
                        return (
                            <div key={task.id} style={{ marginBottom: 24 }}>
                                <Typography variant="body1" style={{ fontWeight: 600, marginBottom: 8, fontSize: '1.05rem' }}>
                                    {task.name}
                                    {task.is_locked && <IconLock size="0.9rem" color="red" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
                                </Typography>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                                    {Object.keys(LETTER_SCORES).map(l => (
                                        <Button
                                            key={l}
                                            variant={letter === l ? 'contained' : 'outlined'}
                                            color="primary"
                                            disabled={task.is_locked}
                                            sx={{
                                                minWidth: 0,
                                                flex: 1,
                                                maxWidth: '56px',
                                                aspectRatio: '1 / 1',
                                                fontSize: { xs: '1rem', sm: '1.1rem' },
                                                fontWeight: 'bold',
                                                p: 0,
                                            }}
                                            onClick={() => handleGradeClick(task.id, l)}
                                        >
                                            {l}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </DialogContent>
            <DialogActions style={{ backgroundColor: '#f5f5f5' }}>
                <Button
                    onClick={onClose}
                    color="primary"
                    variant="contained"
                    fullWidth
                    style={{ margin: '8px 16px' }}
                >
                    Cerrar y Actualizar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentTaskModal;
