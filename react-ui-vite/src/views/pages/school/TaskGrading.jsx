import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Grid,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TextField,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    CircularProgress,
    Snackbar,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Typography,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemButton,
    Fab,
    Menu,
    Chip,
    Alert
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { IconPlus, IconDeviceFloppy, IconPencil, IconTrash, IconSettings, IconLock, IconLockOpen, IconEye, IconEyeOff, IconChevronDown, IconBolt, IconListCheck, IconX, IconDownload, IconUpload, IconFileSpreadsheet, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Checkbox } from '@mui/material';
import MainCard from './../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import TaskDialog from './TaskDialog';
import * as XLSX from 'xlsx';

const TaskGrading = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);
    const location = useLocation();

    const [subCriteria, setSubCriteria] = useState([]);
    const [specialCriteria, setSpecialCriteria] = useState([]);
    const [selectedSubCrit, setSelectedSubCrit] = useState('');

    // Task Data
    const [tasks, setTasks] = useState([]);
    const visibleTasks = tasks.filter(t => t.is_public);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [changes, setChanges] = useState({});

    // UI State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [openUndoDialog, setOpenUndoDialog] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState({}); // { enrollmentId-taskId: true }

    const [actionsMenuAnchor, setActionsMenuAnchor] = useState(null);

    // Mobile grading modal state
    const [mobileModalOpen, setMobileModalOpen] = useState(false);
    const [mobileSelectedRow, setMobileSelectedRow] = useState(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [search, setSearch] = useState('');

    // Bulk Grading State
    const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);
    const [selectedTaskForBulk, setSelectedTaskForBulk] = useState(null);

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTaskData, setEditTaskData] = useState({ name: '', weight: 1 });
    const [bulkAssignTaskId, setBulkAssignTaskId] = useState(null);
    const [bulkConfirm, setBulkConfirm] = useState({ open: false, taskId: null, letter: null });

    // Export/Import State
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportSelectedTasks, setExportSelectedTasks] = useState([]);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importData, setImportData] = useState(null); // parsed rows from Excel
    const [importSelectedTasks, setImportSelectedTasks] = useState([]); // task ids to import
    const [importLoading, setImportLoading] = useState(false);
    const [importErrors, setImportErrors] = useState([]);
    const importFileRef = useRef(null);

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

    useEffect(() => {
        if (activeCourse) {
            fetchSubCriteria();
            setRows([]);
            setTasks([]);
            // Don't reset selectedSubCrit here if it was set by URL param logic
            if (!location.search) {
                setSelectedSubCrit('');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCourse]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subCritId = params.get('sub_criterion_id');
        if (subCritId) {
            // Keep as string if it's a special criterion, otherwise parse to int
            const isSpecial = String(subCritId).startsWith('special-');
            setSelectedSubCrit(isSpecial ? subCritId : parseInt(subCritId));
        }
    }, [location.search]);

    useEffect(() => {
        if (activeCourse && selectedSubCrit) {
            fetchTaskSheet();
            // Save preference
            axios.post(`${configData.API_SERVER}courses/${activeCourse.id}/set_preference/`, {
                last_viewed_tab: selectedSubCrit
            }).catch(console.error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubCrit]);

    // Load Preference on Mount/Course Change
    useEffect(() => {
        if (activeCourse && !selectedSubCrit && !location.search) {
            axios.get(`${configData.API_SERVER}courses/${activeCourse.id}/preference/`)
                .then(res => {
                    const lastTab = res.data.last_viewed_tab;
                    if (lastTab) {
                        // Check if it's special
                        const isSpecial = String(lastTab).startsWith('special-');
                        setSelectedSubCrit(isSpecial ? lastTab : parseInt(lastTab));
                    }
                })
                .catch(console.error);
        }
    }, [activeCourse]);

    const saveSingleScore = (enrollmentId, taskId, score) => {
        // Optimistic update is already done in handleGradeClick via setRows
        // Now send to backend
        axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, {
            updates: [{
                enrollment_id: enrollmentId,
                task_id: taskId,
                score: score
            }]
        })
            .then(() => {
                // Success feedback (maybe too noisy if strictly every click, but good for confirmation)
                // setSnackbar({ open: true, message: 'Nota guardada', severity: 'success' });
                // Recalculate averages in UI? 
                // The backend recalculates, but frontend 'rows' averages are computed in render
                // row.scores is updated, so average should update automatically on next render!
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error guardando nota', severity: 'error' });
                // Revert? Complex.
            });
    };

    const fetchSubCriteria = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

        // Fetch regular sub-criteria
        const subCriteriaReq = axios.get(`${configData.API_SERVER}course-sub-criteria/?course=${activeCourse.id}`);

        // Fetch special criteria (puntos extra)
        const specialCriteriaReq = axios.get(`${configData.API_SERVER}course-special-criteria/?course=${activeCourse.id}`);

        Promise.all([subCriteriaReq, specialCriteriaReq])
            .then(([subRes, specialRes]) => {
                setSubCriteria(subRes.data);
                setSpecialCriteria(specialRes.data);
            })
            .catch(err => console.error(err));
    };

    const fetchTaskSheet = () => {
        setLoading(true);
        axios.get(`${configData.API_SERVER}task-scores/task_sheet/?course_id=${activeCourse.id}&sub_criterion_id=${selectedSubCrit}`)
            .then(res => {
                setTasks(res.data.tasks);
                setRows(res.data.rows);
                setChanges({});
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error cargando tareas', severity: 'error' });
            })
            .finally(() => setLoading(false));
    };

    const handleAddTask = (taskData) => {
        setLoading(true);
        const targetSubCrit = taskData.subCriterionId || selectedSubCrit;

        // Determine if it's a special criterion
        const isSpecial = String(targetSubCrit).startsWith('special-');
        const payload = {
            name: taskData.name,
            weight: taskData.weight
        };

        if (isSpecial) {
            const actualId = String(targetSubCrit).replace('special-', '');
            payload.special_criterion = parseInt(actualId);
        } else {
            payload.sub_criterion = parseInt(targetSubCrit);
        }

        axios.post(`${configData.API_SERVER}course-tasks/`, payload)
            .then(() => {
                setDialogOpen(false);
                setSnackbar({ open: true, message: 'Tarea creada', severity: 'success' });
                // Automatically switch view to the newly added task's sub-criterion
                if (String(selectedSubCrit) !== String(targetSubCrit)) {
                    setSelectedSubCrit(targetSubCrit);
                } else {
                    fetchTaskSheet();
                }
                fetchSubCriteria(); // refresh so it appears in the dropdown list if it was empty
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error creando tarea', severity: 'error' });
                setLoading(false);
            });
    };

    const handleUpdateTask = () => {
        if (!editTaskData.name) return;
        setLoading(true);

        // Determine if it's a special criterion
        const isSpecial = String(selectedSubCrit).startsWith('special-');
        const payload = {
            ...editTaskData
        };

        if (isSpecial) {
            const actualId = selectedSubCrit.replace('special-', '');
            payload.special_criterion = parseInt(actualId);
        } else {
            payload.sub_criterion = parseInt(selectedSubCrit);
        }

        axios.put(`${configData.API_SERVER}course-tasks/${editingTaskId}/`, payload)
            .then(() => {
                setSnackbar({ open: true, message: 'Tarea actualizada', severity: 'success' });
                setEditingTaskId(null);
                fetchTaskSheet();
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error actualizando tarea', severity: 'error' });
                setLoading(false);
            });
    };

    const startEditingTask = (task) => {
        setEditingTaskId(task.id);
        setEditTaskData({
            name: task.name,
            weight: task.weight
        });
    };

    const cancelEditingTask = () => {
        setEditingTaskId(null);
        setEditTaskData({ name: '', weight: 1 });
    };

    const handleToggleTaskField = (task, field) => {
        const newValue = !task[field];
        setLoading(true);
        axios.patch(`${configData.API_SERVER}course-tasks/${task.id}/`, {
            [field]: newValue
        })
            .then(() => {
                setSnackbar({ open: true, message: 'Estado actualizado', severity: 'success' });
                // Optimistic UI Update or Refetch
                // Since this runs on the Dialog, refetch is safer to ensure sync
                fetchTaskSheet();
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error actualizando estado', severity: 'error' });
                setLoading(false);
            });
    };

    const handleDeleteTask = (taskId) => {
        if (!window.confirm('¿Está seguro de eliminar esta tarea? Se recalcularán los promedios automáticamente.')) return;

        setLoading(true);
        axios.delete(`${configData.API_SERVER}course-tasks/${taskId}/`)
            .then(() => {
                setSnackbar({ open: true, message: 'Tarea eliminada', severity: 'success' });
                fetchTaskSheet(); // This will reflect updated averages
                // If no tasks remain, close dialog
                if (tasks.length <= 1) setDeleteDialogOpen(false);
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error eliminando tarea', severity: 'error' });
                setLoading(false);
            });
    };

    const handleBulkMenuOpen = (event, taskId) => {
        setBulkMenuAnchor(event.currentTarget);
        setSelectedTaskForBulk(taskId);
    };

    const handleBulkMenuClose = () => {
        setBulkMenuAnchor(null);
        setSelectedTaskForBulk(null);
    };

    const handleBulkGrade = (letter) => {
        if (!selectedTaskForBulk) return;
        const value = LETTER_SCORES[letter];
        const taskId = selectedTaskForBulk;

        // Update all rows for this task
        setRows(prevRows => prevRows.map(row => ({
            ...row,
            scores: {
                ...row.scores,
                [taskId]: value
            }
        })));

        // Update changes for all rows logic
        const newChanges = { ...changes };
        rows.forEach(row => {
            newChanges[`${row.enrollment_id}-${taskId}`] = value;
        });
        setChanges(newChanges);

        handleBulkMenuClose();
        setSnackbar({ open: true, message: `Todas las notas establecidas a ${letter}. Recuerde Guardar Notas.`, severity: 'info' });
    };

    const confirmBulkGrade = () => {
        if (!bulkConfirm.taskId || !bulkConfirm.letter) return;
        const { taskId, letter } = bulkConfirm;
        const value = LETTER_SCORES[letter];
        
        setRows(prevRows => prevRows.map(row => ({
            ...row,
            scores: { ...row.scores, [taskId]: value }
        })));

        const newChanges = { ...changes };
        rows.forEach(row => {
            newChanges[`${row.enrollment_id}-${taskId}`] = value;
        });
        setChanges(newChanges);

        setBulkAssignTaskId(null);
        setBulkConfirm({ open: false, taskId: null, letter: null });
        setSnackbar({ open: true, message: `Todas las notas establecidas a ${letter}. Recuerde Guardar Notas.`, severity: 'info' });
    };

    const handleScoreChange = (enrollmentId, taskId, value) => {
        setRows(prevRows => prevRows.map(row => {
            if (row.enrollment_id === enrollmentId) {
                return {
                    ...row,
                    scores: {
                        ...row.scores,
                        [taskId]: value
                    }
                };
            }
            return row;
        }));

        setChanges(prev => ({
            ...prev,
            [`${enrollmentId}-${taskId}`]: value
        }));
    };

    const handleGradeClick = (enrollmentId, taskId, letter) => {
        const value = LETTER_SCORES[letter];
        handleScoreChange(enrollmentId, taskId, value);
        saveSingleScore(enrollmentId, taskId, value);
        // Turn off edit mode if it was on
        setEditMode(prev => {
            const newState = { ...prev };
            delete newState[`${enrollmentId}-${taskId}`];
            return newState;
        });
    };

    const handleClearScore = (enrollmentId, taskId) => {
        // Set score to null (blank)
        setRows(prevRows => prevRows.map(row => {
            if (row.enrollment_id === enrollmentId) {
                return { ...row, scores: { ...row.scores, [taskId]: null } };
            }
            return row;
        }));
        setChanges(prev => ({
            ...prev,
            [`${enrollmentId}-${taskId}`]: null
        }));
        saveSingleScore(enrollmentId, taskId, null);
        // Turn off edit mode
        setEditMode(prev => {
            const newState = { ...prev };
            delete newState[`${enrollmentId}-${taskId}`];
            return newState;
        });
    };

    const toggleEditMode = (enrollmentId, taskId) => {
        setEditMode(prev => ({
            ...prev,
            [`${enrollmentId}-${taskId}`]: true
        }));
    };

    const handleSave = () => {
        const updates = Object.keys(changes).map(key => {
            const [enrollmentId, taskId] = key.split('-');
            const rawScore = changes[key];
            return {
                enrollment_id: parseInt(enrollmentId),
                task_id: parseInt(taskId),
                score: rawScore === null ? null : (parseFloat(rawScore) || 0)
            };
        });

        if (updates.length === 0) return;

        setLoading(true);
        axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, { updates })
            .then(() => {
                setSnackbar({ open: true, message: 'Notas guardadas correctamente', severity: 'success' });
                setChanges({});
                // Optional: Refetch to see updated averages if we display them
            })
            .catch(error => {
                console.error(error);
                setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
            })
            .finally(() => setLoading(false));
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const handleUndo = () => {
        if (Object.keys(changes).length === 0) return;
        setOpenUndoDialog(true);
    };

    const handleConfirmUndo = () => {
        setChanges({});
        setOpenUndoDialog(false);
        fetchTaskSheet();
    };

    // ── Export Helpers ──────────────────────────────────────────────────────────
    const handleOpenExport = () => {
        // By default select all visible tasks
        setExportSelectedTasks(visibleTasks.map(t => t.id));
        setExportDialogOpen(true);
    };

    const handleExport = () => {
        const selectedTaskObjs = tasks.filter(t => exportSelectedTasks.includes(t.id));
        const header = ['CI', 'Apellido Paterno', 'Apellido Materno', 'Nombre', ...selectedTaskObjs.map(t => t.name)];
        const dataRows = rows.map(row => [
            row.ci || '',
            row.paterno || '',
            row.materno || '',
            row.nombre || '',
            ...selectedTaskObjs.map(t => {
                const letter = getLetterFromScore(row.scores[t.id]);
                return letter || '';
            })
        ]);

        const wsData = [header, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Style: set column widths
        ws['!cols'] = [
            { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
            ...selectedTaskObjs.map(() => ({ wch: 14 }))
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Notas');

        const subCritName = (() => {
            const isSpecial = String(selectedSubCrit).startsWith('special-');
            if (isSpecial) {
                const sc = specialCriteria.find(s => `special-${s.id}` === String(selectedSubCrit));
                return sc ? sc.name : 'tareas';
            }
            const sc = subCriteria.find(s => s.id === selectedSubCrit || String(s.id) === String(selectedSubCrit));
            return sc ? sc.name : 'tareas';
        })();

        XLSX.writeFile(wb, `notas_${subCritName.replace(/\s+/g, '_')}.xlsx`);
        setExportDialogOpen(false);
        setSnackbar({ open: true, message: 'Archivo exportado correctamente', severity: 'success' });
    };

    // ── Import Helpers ──────────────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFile(file);
        setImportErrors([]);
        setImportData(null);
        setImportSelectedTasks([]);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                if (raw.length < 2) {
                    setImportErrors(['El archivo está vacío o no tiene datos.']);
                    return;
                }

                // Detect columns
                const headerRow = raw[0].map(h => String(h).trim());
                const ciIdx = headerRow.findIndex(h => h.toLowerCase() === 'ci');
                if (ciIdx === -1) {
                    setImportErrors(['No se encontró la columna "CI" en el archivo.']);
                    return;
                }

                // Match Excel columns to existing tasks by name
                const matchedTasks = [];
                headerRow.forEach((h, idx) => {
                    if (idx <= 3) return; // skip CI, apellidos, nombre
                    const task = tasks.find(t => t.name.trim().toLowerCase() === h.toLowerCase());
                    if (task) matchedTasks.push({ colIdx: idx, task, colName: h });
                });

                if (matchedTasks.length === 0) {
                    setImportErrors(['Ninguna columna del archivo coincide con las tareas actuales. Verifique los nombres de columna.']);
                    return;
                }

                // Parse rows
                const parsedRows = [];
                const errors = [];
                raw.slice(1).forEach((row, rowIdx) => {
                    const ci = String(row[ciIdx] || '').trim();
                    if (!ci) return;

                    const dbRow = rows.find(r => String(r.ci || '').trim() === ci);
                    const studentName = dbRow
                        ? `${dbRow.paterno} ${dbRow.materno} ${dbRow.nombre}`
                        : null;

                    const scores = {};
                    matchedTasks.forEach(({ colIdx, task }) => {
                        const cell = String(row[colIdx] || '').trim().toUpperCase();
                        if (cell === '') {
                            scores[task.id] = null; // blank = clear
                        } else if (['A', 'B', 'C', 'D', 'E'].includes(cell)) {
                            scores[task.id] = LETTER_SCORES[cell];
                        } else {
                            errors.push(`Fila ${rowIdx + 2}: CI ${ci} — valor inválido "${cell}" en columna "${task.name}" (use A, B, C, D, E o deje vacío)`);
                        }
                    });

                    parsedRows.push({ ci, studentName, found: !!dbRow, enrollmentId: dbRow?.enrollment_id, scores });
                });

                setImportData({ rows: parsedRows, matchedTasks });
                setImportSelectedTasks(matchedTasks.map(mt => mt.task.id));
                setImportErrors(errors);
            } catch (err) {
                setImportErrors([`Error leyendo el archivo: ${err.message}`]);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (!importData) return;
        setImportLoading(true);

        const updates = [];
        importData.rows.forEach(row => {
            if (!row.found || !row.enrollmentId) return;
            Object.entries(row.scores).forEach(([taskId, score]) => {
                if (!importSelectedTasks.includes(parseInt(taskId))) return;
                updates.push({
                    enrollment_id: row.enrollmentId,
                    task_id: parseInt(taskId),
                    score: score // null = delete
                });
            });
        });

        if (updates.length === 0) {
            setSnackbar({ open: true, message: 'No hay datos válidos para importar', severity: 'warning' });
            setImportLoading(false);
            return;
        }

        try {
            await axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, { updates });
            setSnackbar({ open: true, message: `${updates.length} nota(s) importadas correctamente`, severity: 'success' });
            setImportDialogOpen(false);
            setImportFile(null);
            setImportData(null);
            fetchTaskSheet();
        } catch (err) {
            setSnackbar({ open: true, message: 'Error al importar notas', severity: 'error' });
        } finally {
            setImportLoading(false);
        }
    };

    if (!activeCourse) {
        return (
            <MainCard title="Calificación de Tareas">
                <MuiAlert severity="warning">Seleccione un Paralelo para comenzar.</MuiAlert>
            </MainCard>
        );
    }

    const filteredRows = rows.filter(row => {
        const term = search.toLowerCase();
        return (
            (row.paterno || '').toLowerCase().includes(term) ||
            (row.materno || '').toLowerCase().includes(term) ||
            (row.nombre || '').toLowerCase().includes(term) ||
            (row.ci || '').toLowerCase().includes(term)
        );
    });

    // Compute a safe display value for the Select to avoid MUI out-of-range warning.
    // selectedSubCrit may be set (from URL params or saved preference) before the
    // options finish loading, so we validate it against the loaded lists first.
    const selectDisplayValue = (() => {
        if (!selectedSubCrit) return '';
        const isSpecial = String(selectedSubCrit).startsWith('special-');
        if (isSpecial) {
            return specialCriteria.some(sc => `special-${sc.id}` === String(selectedSubCrit))
                ? selectedSubCrit
                : '';
        }
        return subCriteria.some(sc => sc.id === selectedSubCrit || String(sc.id) === String(selectedSubCrit))
            ? selectedSubCrit
            : '';
    })();

    return (
        <MainCard title={`Calificación de Tareas - ${activeCourse.subject_details?.name} (${activeCourse.parallel})`}>
            {/* Header Controls */}
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 20 }}>
                <Grid
                    size={{
                        xs: 12,
                        sm: selectedSubCrit && tasks.length > 0 ? 6 : 12
                    }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Sub-Criterio de Evaluación</InputLabel>
                        <Select
                            value={selectDisplayValue}
                            onChange={(e) => {
                                if (e.target.value === "CREATE_NEW") {
                                    setDialogOpen(true);
                                    return;
                                }
                                setSelectedSubCrit(e.target.value);
                            }}
                            label="Sub-Criterio de Evaluación"
                        >
                            <MenuItem value="CREATE_NEW" style={{ color: '#1976d2', fontWeight: 'bold' }}>
                                <em>+ Crear nueva tarea</em>
                            </MenuItem>
                            {subCriteria.filter(sc => sc.has_tasks).map(sc => (
                                <MenuItem key={sc.id} value={sc.id}>
                                    {sc.parent_criterion_details?.name} - {sc.name} ({sc.percentage}%)
                                </MenuItem>
                            ))}
                            {specialCriteria.filter(sc => sc.has_tasks).map(sc => (
                                <MenuItem key={`special-${sc.id}`} value={`special-${sc.id}`}>
                                    ⭐ {sc.parent_criterion_details?.name} - {sc.name} (+{sc.percentage} pts) [Extra]
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Import / Export Buttons */}
                {selectedSubCrit && tasks.length > 0 && (
                    <Grid 
                        size={{
                            xs: 12,
                            sm: 6
                        }} 
                        style={{ display: 'flex', gap: 8, justifyContent: isMobile ? 'flex-start' : 'flex-end', marginTop: isMobile ? 8 : 0 }}
                    >
                        <Tooltip title="Exportar notas a Excel">
                            <Button
                                id="btn-export-tasks"
                                variant="outlined"
                                size="small"
                                color="success"
                                startIcon={<IconDownload size="1rem" />}
                                onClick={handleOpenExport}
                            >
                                Exportar
                            </Button>
                        </Tooltip>
                        <Tooltip title="Importar notas desde Excel">
                            <Button
                                id="btn-import-tasks"
                                variant="outlined"
                                size="small"
                                color="info"
                                startIcon={<IconUpload size="1rem" />}
                                onClick={() => {
                                    setImportFile(null);
                                    setImportData(null);
                                    setImportErrors([]);
                                    setImportSelectedTasks([]);
                                    setImportDialogOpen(true);
                                }}
                            >
                                Importar
                            </Button>
                        </Tooltip>
                    </Grid>
                )}

                {selectedSubCrit && (
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Buscar estudiante..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                        />
                    </Grid>
                )}
            </Grid>
            {/* Tasks Table or Mobile View */}
            {selectedSubCrit && (
                isMobile ? (
                    <List style={{ marginTop: 10, padding: 0 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 20 }}><CircularProgress /></div>
                        ) : filteredRows.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20 }}>No hay estudiantes o tareas.</div>
                        ) : (
                            filteredRows.map((row, index) => {
                                let totalWeight = 0;
                                let weightedSum = 0;
                                tasks.forEach(task => {
                                    const score = parseFloat(row.scores[task.id]) || 0;
                                    weightedSum += score * task.weight;
                                    totalWeight += task.weight;
                                });
                                const average = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
                                const hasGrades = visibleTasks.some(t => row.scores[t.id] !== null && row.scores[t.id] !== undefined && row.scores[t.id] !== '');

                                return (
                                    <ListItemButton
                                        key={row.enrollment_id}
                                        onClick={() => {
                                            setMobileSelectedRow(row);
                                            setMobileModalOpen(true);
                                        }}
                                        sx={{
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            padding: '12px 16px',
                                            backgroundColor: index % 2 === 0 ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                            display: 'block',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <div>
                                                <Typography variant="body1" style={{ fontWeight: 600 }}>
                                                    {row.paterno} {row.materno} {row.nombre}
                                                </Typography>
                                                {tasks.length > 0 && (
                                                    <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
                                                        Promedio: {average}
                                                    </Typography>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {visibleTasks.slice(0, 3).map(task => {
                                                    const letter = getLetterFromScore(row.scores[task.id]);
                                                    return letter ? (
                                                        <span
                                                            key={task.id}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: '50%',
                                                                backgroundColor: theme.palette.primary.main,
                                                                color: '#fff',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.8rem',
                                                            }}
                                                        >
                                                            {letter}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            key={task.id}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: '50%',
                                                                border: `2px dashed ${theme.palette.divider}`,
                                                                color: theme.palette.text.disabled,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        >
                                                            —
                                                        </span>
                                                    );
                                                })}
                                                {visibleTasks.length > 3 && (
                                                    <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>+{visibleTasks.length - 3}</Typography>
                                                )}
                                                <IconPencil size="1rem" color={theme.palette.text.secondary} />
                                            </div>
                                        </div>
                                    </ListItemButton>
                                );
                            })
                        )}
                    </List>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Estudiante</TableCell>
                                    {visibleTasks.map(task => (
                                        <TableCell key={task.id} align="center">
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Tooltip title={`Peso: ${task.weight}x`}>
                                                    <span>
                                                        {task.name}
                                                        {task.is_locked && <IconLock size="0.8rem" color="red" style={{ marginLeft: 4 }} />}
                                                    </span>
                                                </Tooltip>
                                                <IconButton size="small" onClick={(e) => handleBulkMenuOpen(e, task.id)} disabled={task.is_locked}>
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
                                    <TableRow>
                                        <TableCell colSpan={visibleTasks.length + 2} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow><TableCell colSpan={visibleTasks.length + 2} align="center">No hay estudiantes o tareas.</TableCell></TableRow>
                                ) : (
                                    filteredRows.map(row => {
                                        // Calculate row average
                                        let totalWeight = 0;
                                        let weightedSum = 0;
                                        tasks.forEach(task => { // Average includes ALL tasks or only visible? Usually all, but effectively visible ones for grading. 
                                            // If a task is hidden, should it count? 
                                            // Standard logic: It counts towards the grade if it exists. Hiding is usually just visual.
                                            // Keeping 'tasks' here ensures calculation remains correct even if hidden.
                                            const score = parseFloat(row.scores[task.id]) || 0;
                                            weightedSum += score * task.weight;
                                            totalWeight += task.weight;
                                        });
                                        const average = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';

                                        return (
                                            <TableRow key={row.enrollment_id} hover>
                                                <TableCell>{row.paterno} {row.materno} {row.nombre}</TableCell>
                                                {visibleTasks.map(task => {
                                                    const score = row.scores[task.id];
                                                    const letter = getLetterFromScore(score);

                                                    return (
                                                        <TableCell key={task.id} align="center" style={{ minWidth: isMobile ? 120 : 180, padding: isMobile ? 4 : 16 }}>
                                                            {letter && !editMode[`${row.enrollment_id}-${task.id}`] ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', marginRight: 8 }}>{letter}</span>
                                                                    {task.is_locked ? (
                                                                        <IconLock size="1rem" color="gray" />
                                                                    ) : (
                                                                        <IconButton size="small" onClick={() => toggleEditMode(row.enrollment_id, task.id)}>
                                                                            <IconPencil size="1rem" />
                                                                        </IconButton>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Grid container spacing={1} justifyContent="center" style={{ width: '100%', margin: 0 }}>
                                                                    {Object.keys(LETTER_SCORES).map(l => (
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
                                                                                color="primary"
                                                                                onClick={() => handleGradeClick(row.enrollment_id, task.id, l)}
                                                                                disabled={task.is_locked}
                                                                            >
                                                                                {l}
                                                                            </Button>
                                                                        </Grid>
                                                                    ))}
                                                                    {letter && (
                                                                        <Grid style={{ padding: 2 }}>
                                                                            <Tooltip title="Borrar nota">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleClearScore(row.enrollment_id, task.id)}
                                                                                    disabled={task.is_locked}
                                                                                    style={{ color: theme.palette.error.main }}
                                                                                >
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
                                                <TableCell align="center" style={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
                                                    {average}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            )}
            {/* Bulk Actions Menu */}
            <Menu
                id="bulk-menu"
                anchorEl={bulkMenuAnchor}
                keepMounted
                open={Boolean(bulkMenuAnchor)}
                onClose={handleBulkMenuClose}
            >
                <MenuItem disabled>Calificar Todos:</MenuItem>
                {Object.keys(LETTER_SCORES).map(l => (
                    <MenuItem key={l} onClick={() => handleBulkGrade(l)}>
                        Asignar {l}
                    </MenuItem>
                ))}
            </Menu>
            {/* Mobile Grading Modal */}
            <Dialog fullScreen open={mobileModalOpen} sx={{ zIndex: 9999 }} onClose={() => {
                setMobileModalOpen(false);
                    setMobileSelectedRow(null);
                }}
                fullWidth
                maxWidth="xs"
            >
                {mobileSelectedRow && (
                    <>
                        <DialogTitle style={{ paddingBottom: 8, textAlign: 'center' }}>
                            <Typography variant="h6" style={{ fontWeight: 'bold', lineHeight: 1.3, fontSize: '1.25rem' }}>
                                {mobileSelectedRow.paterno} {mobileSelectedRow.materno} {mobileSelectedRow.nombre}
                            </Typography>
                        </DialogTitle>
                        <DialogContent style={{ paddingTop: 0 }}>
                            {visibleTasks.length === 0 ? (
                                <Typography variant="body2" color="textSecondary">No hay tareas visibles.</Typography>
                            ) : (
                                visibleTasks.map(task => {
                                    // Use live data from rows (mobileSelectedRow may be stale after grading)
                                    const liveRow = rows.find(r => r.enrollment_id === mobileSelectedRow.enrollment_id) || mobileSelectedRow;
                                    const score = liveRow.scores[task.id];
                                    const letter = getLetterFromScore(score);
                                    return (
                                        <div key={task.id} style={{ marginBottom: 20 }}>
                                            <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 8 }}>
                                                {task.name}
                                                {task.is_locked && <IconLock size="0.9rem" color="red" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
                                            </Typography>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
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
                                                        onClick={() => {
                                                            handleGradeClick(liveRow.enrollment_id, task.id, l);
                                                            // Update modal's reference row to reflect new score
                                                            setMobileSelectedRow(prev => ({
                                                                ...prev,
                                                                scores: { ...prev.scores, [task.id]: LETTER_SCORES[l] }
                                                            }));
                                                        }}
                                                    >
                                                        {l}
                                                    </Button>
                                                ))}
                                                {letter && (
                                                    <Tooltip title="Borrar nota">
                                                        <IconButton
                                                            disabled={task.is_locked}
                                                            onClick={() => {
                                                                handleClearScore(liveRow.enrollment_id, task.id);
                                                                setMobileSelectedRow(prev => ({
                                                                    ...prev,
                                                                    scores: { ...prev.scores, [task.id]: null }
                                                                }));
                                                            }}
                                                            sx={{
                                                                color: 'error.main',
                                                                border: '1px solid',
                                                                borderColor: 'error.main',
                                                                borderRadius: 1,
                                                                flex: 1,
                                                                maxWidth: '56px',
                                                                aspectRatio: '1 / 1',
                                                            }}
                                                        >
                                                            <IconX size="1.2rem" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => {
                                    setMobileModalOpen(false);
                                    setMobileSelectedRow(null);
                                }}
                                color="primary"
                                variant="contained"
                                fullWidth
                                style={{ margin: '0 16px 8px' }}
                            >
                                Cerrar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
            {/* Floating Action Button and Menu */}
            <Fab
                color="secondary"
                aria-label="actions"
                onClick={() => setDeleteDialogOpen(true)}
                style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
                disabled={!selectedSubCrit || tasks.length === 0}
            >
                <IconEye />
            </Fab>
            <TaskDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleAddTask}
                subCriteria={subCriteria}
                specialCriteria={specialCriteria}
                initialSubCriterion={selectedSubCrit}
            />
            <Dialog
                sx={{ zIndex: 9999 }}
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
            >
                <DialogTitle>¿Crear Nueva Tarea?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Al crear una tarea para este sub-criterio, la calificación manual directa se bloqueará y se calculará automáticamente en base a las tareas.
                        <br />
                        ¿Está seguro de continuar?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={() => {
                        setConfirmOpen(false);
                        setDialogOpen(true);
                    }} color="primary" autoFocus>
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Manage Tasks Dialog */}
            <Dialog sx={{ zIndex: 9999 }} open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Visibilidad de Tareas</DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ marginBottom: 20 }}>
                        Controle la visibilidad, bloqueo o peso de las tareas.
                    </DialogContentText>
                    {isMobile ? (
                        <Grid container spacing={2}>
                            {tasks.map(task => (
                                <Grid size={12} key={task.id}>
                                    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fafafa' }}>
                                         <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: '1rem' }}>
                                            {editingTaskId === task.id ? (
                                                <TextField
                                                    fullWidth
                                                    value={editTaskData.name}
                                                    onChange={(e) => setEditTaskData({ ...editTaskData, name: e.target.value })}
                                                    size="small"
                                                />
                                            ) : task.name}
                                         </div>
                                         <Grid container spacing={1} alignItems="center">
                                             <Grid size={4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                 <span style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>Peso</span>
                                                 {editingTaskId === task.id ? (
                                                     <TextField
                                                         type="number"
                                                         value={editTaskData.weight}
                                                         onChange={(e) => setEditTaskData({ ...editTaskData, weight: parseInt(e.target.value) || 1 })}
                                                         size="small"
                                                         inputProps={{ min: 1 }}
                                                         style={{ width: 60, marginTop: 4 }}
                                                     />
                                                 ) : (
                                                     <div style={{ marginTop: 4, fontWeight: 'bold' }}>{task.weight}x</div>
                                                 )}
                                             </Grid>
                                             <Grid size={4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                 <span style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>Visible</span>
                                                 {editingTaskId === task.id ? (
                                                    <IconButton size="small" disabled>
                                                        {task.is_public ? <IconEye size="1.2rem" color="grey" /> : <IconEyeOff size="1.2rem" color="grey" />}
                                                    </IconButton>
                                                 ) : (
                                                    <IconButton onClick={() => handleToggleTaskField(task, 'is_public')} size="small">
                                                        {task.is_public ? <IconEye size="1.2rem" color="green" /> : <IconEyeOff size="1.2rem" color="gray" />}
                                                    </IconButton>
                                                 )}
                                             </Grid>
                                             <Grid size={4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                 <span style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>Bloqueo</span>
                                                 {editingTaskId === task.id ? (
                                                    <IconButton size="small" disabled>
                                                        {task.is_locked ? <IconLock size="1.2rem" color="grey" /> : <IconLockOpen size="1.2rem" color="grey" />}
                                                    </IconButton>
                                                 ) : (
                                                    <IconButton onClick={() => handleToggleTaskField(task, 'is_locked')} size="small">
                                                        {task.is_locked ? <IconLock size="1.2rem" color="red" /> : <IconLockOpen size="1.2rem" color="green" />}
                                                    </IconButton>
                                                 )}
                                             </Grid>
                                         </Grid>
                                         <div style={{ marginTop: 12, borderTop: `1px solid ${theme.palette.divider}`, paddingTop: 8, display: 'flex', justifyContent: 'center', gap: 16 }}>
                                            {bulkAssignTaskId === task.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {Object.keys(LETTER_SCORES).map(l => (
                                                        <Button key={l} variant="contained" size="small" color="primary" sx={{ minWidth: '30px', padding: '2px 6px' }} onClick={() => setBulkConfirm({ open: true, taskId: task.id, letter: l })}>
                                                            {l}
                                                        </Button>
                                                    ))}
                                                    <IconButton size="small" onClick={() => setBulkAssignTaskId(null)} color="secondary">
                                                        <IconX size="1.2rem"/>
                                                    </IconButton>
                                                </div>
                                            ) : editingTaskId === task.id ? (
                                                <>
                                                    <Button onClick={handleUpdateTask} color="primary" size="small" startIcon={<IconDeviceFloppy size="1rem"/>}>Guardar</Button>
                                                    <Button onClick={cancelEditingTask} size="small" color="inherit">Cancelar</Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Tooltip title="Llenar a todos">
                                                        <IconButton onClick={() => setBulkAssignTaskId(task.id)} color="info" size="small" disabled={task.is_locked}>
                                                            <IconListCheck size="1.2rem" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <IconButton onClick={() => startEditingTask(task)} color="primary" size="small">
                                                        <IconPencil size="1.2rem" />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleDeleteTask(task.id)} color="secondary" size="small">
                                                        <IconTrash size="1.2rem" />
                                                    </IconButton>
                                                </>
                                            )}
                                         </div>
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nombre de la Tarea</TableCell>
                                        <TableCell align="center" style={{ width: 80 }}>Peso</TableCell>
                                        <TableCell align="center" style={{ width: 80 }}>Visible</TableCell>
                                        <TableCell align="center" style={{ width: 80 }}>Bloq.</TableCell>
                                        <TableCell align="center" style={{ width: 220 }}>Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell>
                                                {editingTaskId === task.id ? (
                                                    <TextField
                                                        fullWidth
                                                        value={editTaskData.name}
                                                        onChange={(e) => setEditTaskData({ ...editTaskData, name: e.target.value })}
                                                        size="small"
                                                    />
                                                ) : task.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                {editingTaskId === task.id ? (
                                                    <TextField
                                                        type="number"
                                                        value={editTaskData.weight}
                                                        onChange={(e) => setEditTaskData({ ...editTaskData, weight: parseInt(e.target.value) || 1 })}
                                                        size="small"
                                                        inputProps={{ min: 1 }}
                                                    />
                                                ) : `${task.weight}x`}
                                            </TableCell>
                                            <TableCell align="center">
                                                {editingTaskId === task.id ? (
                                                    (task.is_public ? <IconEye size="1.2rem" color="grey" /> : <IconEyeOff size="1.2rem" color="grey" />)
                                                ) : (
                                                    <IconButton onClick={() => handleToggleTaskField(task, 'is_public')} size="small">
                                                        {task.is_public ? <IconEye size="1.2rem" color="green" /> : <IconEyeOff size="1.2rem" color="gray" />}
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {editingTaskId === task.id ? (
                                                    (task.is_locked ? <IconLock size="1.2rem" color="grey" /> : <IconLockOpen size="1.2rem" color="grey" />)
                                                ) : (
                                                    <IconButton onClick={() => handleToggleTaskField(task, 'is_locked')} size="small">
                                                        {task.is_locked ? <IconLock size="1.2rem" color="red" /> : <IconLockOpen size="1.2rem" color="green" />}
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {bulkAssignTaskId === task.id ? (
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                                                        {Object.keys(LETTER_SCORES).map(l => (
                                                            <Button key={l} variant="contained" size="small" color="primary" sx={{ minWidth: '24px', padding: '2px' }} onClick={() => setBulkConfirm({ open: true, taskId: task.id, letter: l })}>
                                                                {l}
                                                            </Button>
                                                        ))}
                                                        <IconButton size="small" onClick={() => setBulkAssignTaskId(null)} color="secondary">
                                                            <IconX size="1.2rem"/>
                                                        </IconButton>
                                                    </div>
                                                ) : editingTaskId === task.id ? (
                                                    <>
                                                        <IconButton onClick={handleUpdateTask} color="primary" size="small">
                                                            <IconDeviceFloppy />
                                                        </IconButton>
                                                        <IconButton onClick={cancelEditingTask} size="small">
                                                            <IconTrash style={{ transform: 'rotate(45deg)' }} />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Tooltip title="Llenar a todos">
                                                            <IconButton onClick={() => setBulkAssignTaskId(task.id)} color="info" size="small" disabled={task.is_locked}>
                                                                <IconListCheck />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <IconButton onClick={() => startEditingTask(task)} color="primary" size="small">
                                                            <IconPencil />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDeleteTask(task.id)} color="secondary" size="small">
                                                            <IconTrash />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Export Dialog ─────────────────────────────────────── */}
            <Dialog
                sx={{ zIndex: 9999 }}
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconFileSpreadsheet size="1.3rem" />
                    Exportar Notas a Excel
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Selecciona las tareas que deseas incluir en el archivo Excel. Se usará el CI como identificador.
                    </DialogContentText>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Tareas disponibles:</Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, border: `1px solid`, borderColor: exportSelectedTasks.includes(task.id) ? '#1976d2' : '#e0e0e0', backgroundColor: exportSelectedTasks.includes(task.id) ? 'rgba(25,118,210,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                onClick={() => setExportSelectedTasks(prev =>
                                    prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]
                                )}
                            >
                                <Checkbox
                                    checked={exportSelectedTasks.includes(task.id)}
                                    size="small"
                                    sx={{ p: 0 }}
                                    onChange={() => {}}
                                />
                                <Typography variant="body2" sx={{ flex: 1 }}>{task.name}</Typography>
                                <Chip label={`${task.weight}x`} size="small" variant="outlined" />
                                {!task.is_public && <Chip label="Oculta" size="small" color="warning" />}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <Button size="small" onClick={() => setExportSelectedTasks(tasks.map(t => t.id))}>Todas</Button>
                        <Button size="small" onClick={() => setExportSelectedTasks(visibleTasks.map(t => t.id))}>Solo visibles</Button>
                        <Button size="small" color="error" onClick={() => setExportSelectedTasks([])}>Ninguna</Button>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleExport}
                        variant="contained"
                        color="success"
                        disabled={exportSelectedTasks.length === 0}
                        startIcon={<IconDownload size="1rem" />}
                    >
                        Exportar ({exportSelectedTasks.length} tareas)
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Import Dialog ─────────────────────────────────────── */}
            <Dialog
                sx={{ zIndex: 9999 }}
                open={importDialogOpen}
                onClose={() => !importLoading && setImportDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconUpload size="1.3rem" />
                    Importar Notas desde Excel
                </DialogTitle>
                <DialogContent>
                    {/* Step 1: Upload file */}
                    <div style={{ marginBottom: 16 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>1. Seleccionar archivo Excel</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            El archivo debe contener una columna <strong>CI</strong> y columnas con los nombres exactos de las tareas.
                            Use las letras <strong>A, B, C, D, E</strong> como valores. Deje la celda vacía para borrar la nota.
                        </Typography>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input
                                ref={importFileRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<IconFileSpreadsheet size="1rem" />}
                                onClick={() => importFileRef.current?.click()}
                            >
                                Elegir archivo
                            </Button>
                            {importFile && (
                                <Typography variant="body2" color="textSecondary">
                                    {importFile.name}
                                </Typography>
                            )}
                            <Tooltip title="Descargar plantilla de ejemplo">
                                <Button
                                    size="small"
                                    variant="text"
                                    color="success"
                                    startIcon={<IconDownload size="1rem" />}
                                    onClick={() => {
                                        const header = ['CI', 'Apellido Paterno', 'Apellido Materno', 'Nombre', ...tasks.map(t => t.name)];
                                        const exampleRows = rows.slice(0, 3).map(row => [
                                            row.ci || '',
                                            row.paterno || '',
                                            row.materno || '',
                                            row.nombre || '',
                                            ...tasks.map(() => '')
                                        ]);
                                        const ws = XLSX.utils.aoa_to_sheet([header, ...exampleRows]);
                                        ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, ...tasks.map(() => ({ wch: 14 }))];
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
                                        XLSX.writeFile(wb, 'plantilla_notas.xlsx');
                                    }}
                                >
                                    Descargar Plantilla
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Errors */}
                    {importErrors.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Advertencias ({importErrors.length}):</Typography>
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                                {importErrors.slice(0, 5).map((e, i) => <li key={i}><Typography variant="caption">{e}</Typography></li>)}
                                {importErrors.length > 5 && <li><Typography variant="caption">...y {importErrors.length - 5} más.</Typography></li>}
                            </ul>
                        </Alert>
                    )}

                    {/* Step 2: Task selection */}
                    {importData && (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>2. Seleccionar tareas a importar</Typography>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                {importData.matchedTasks.map(({ task }) => (
                                    <div key={task.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, border: '1px solid', borderColor: importSelectedTasks.includes(task.id) ? '#0288d1' : '#e0e0e0', backgroundColor: importSelectedTasks.includes(task.id) ? 'rgba(2,136,209,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onClick={() => setImportSelectedTasks(prev =>
                                            prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]
                                        )}
                                    >
                                        <Checkbox checked={importSelectedTasks.includes(task.id)} size="small" sx={{ p: 0 }} onChange={() => {}} />
                                        <Typography variant="body2" sx={{ flex: 1 }}>{task.name}</Typography>
                                        <Chip label={`${task.weight}x`} size="small" variant="outlined" />
                                    </div>
                                ))}
                            </div>

                            {/* Step 3: Preview */}
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>3. Vista previa</Typography>
                            <TableContainer sx={{ maxHeight: 280, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>CI</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                                            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Estado</TableCell>
                                            {importData.matchedTasks
                                                .filter(mt => importSelectedTasks.includes(mt.task.id))
                                                .map(mt => (
                                                    <TableCell key={mt.task.id} align="center" sx={{ fontWeight: 700 }}>{mt.task.name}</TableCell>
                                                ))
                                            }
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {importData.rows.map((row, i) => (
                                            <TableRow key={i} sx={{ backgroundColor: !row.found ? 'rgba(255,100,100,0.08)' : 'transparent' }}>
                                                <TableCell>{row.ci}</TableCell>
                                                <TableCell>{row.studentName || <em style={{ color: 'gray' }}>No encontrado</em>}</TableCell>
                                                <TableCell align="center">
                                                    {row.found
                                                        ? <IconCheck size="1rem" color="green" />
                                                        : <IconAlertTriangle size="1rem" color="orange" />}
                                                </TableCell>
                                                {importData.matchedTasks
                                                    .filter(mt => importSelectedTasks.includes(mt.task.id))
                                                    .map(mt => {
                                                        const v = row.scores[mt.task.id];
                                                        const letter = v === null ? '—' : getLetterFromScore(v);
                                                        return (
                                                            <TableCell key={mt.task.id} align="center">
                                                                <span style={{ fontWeight: 'bold', color: v === null ? '#bbb' : undefined }}>
                                                                    {letter || '?'}
                                                                </span>
                                                            </TableCell>
                                                        );
                                                    })
                                                }
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                {importData.rows.filter(r => r.found).length} de {importData.rows.length} estudiantes encontrados en el curso.
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)} disabled={importLoading}>Cancelar</Button>
                    <Button
                        onClick={handleImport}
                        variant="contained"
                        color="info"
                        disabled={!importData || importSelectedTasks.length === 0 || importLoading}
                        startIcon={importLoading ? <CircularProgress size={14} color="inherit" /> : <IconUpload size="1rem" />}
                    >
                        {importLoading ? 'Importando...' : `Importar (${importSelectedTasks.length} tareas)`}
                    </Button>
                </DialogActions>
            </Dialog>

            <TaskDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleAddTask}
                subCriteria={subCriteria}
                specialCriteria={specialCriteria}
                initialSubCriterion={selectedSubCrit}
            />
            <Dialog
                sx={{ zIndex: 9999 }}
                open={openUndoDialog}
                onClose={() => setOpenUndoDialog(false)}
            >
                <DialogTitle>Deshacer Cambios</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro de deshacer los cambios no guardados? Se revertirán a los valores originales.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUndoDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmUndo} color="error" autoFocus>
                        Deshacer
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog 
                sx={{ zIndex: 9999 }}
                open={bulkConfirm.open} 
                onClose={() => setBulkConfirm({ open: false, taskId: null, letter: null })}
            >
                <DialogTitle>Confirmar Asignación Masiva</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea asignar la calificación <strong>'{bulkConfirm.letter}'</strong> a todos los estudiantes inscritos de forma simultánea?<br /><br />
                        Al guardarse, esta acción sobrescribirá masivamente todas las notas existentes en esta tarea y no podrá revertirse de manera automática. Deberá corregir manualmente caso por caso si comete un error.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkConfirm({ open: false, taskId: null, letter: null })} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={confirmBulkGrade} color="secondary" variant="contained" autoFocus>
                        Continuar
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} elevation={6} variant="filled">
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </MainCard >
    );
};

export default TaskGrading;
