import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button, Snackbar, Tooltip, Fab, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MuiAlert from '@mui/material/Alert';
import { IconEye, IconDownload, IconUpload } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import { useSelector } from 'react-redux';
import axios from 'axios';
import configData from '../../../config';
import { selectAccount, selectActiveCourse } from '../../../store/selectors';
import { useTaskGrading } from '../../../hooks/useTaskGrading';
import TaskDialog from './TaskDialog';
import TaskGradingTable from './components/TaskGradingTable';
import TaskGradingMobileList from './components/TaskGradingMobileList';
import ManageTasksDialog from './components/ManageTasksDialog';
import { ExportTasksDialog, ImportTasksDialog } from './components/TaskGradingDialogs';

const TaskGrading = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const account = useSelector(selectAccount);
    const activeCourse = useSelector(selectActiveCourse);
    const location = useLocation();

    const {
        subCriteria, specialCriteria, selectedSubCrit, setSelectedSubCrit,
        tasks, rows, loading, search, setSearch,
        snackbar, closeSnackbar, showSnack,
        visibleTasks, filteredRows, selectDisplayValue,
        fetchTaskSheet,
        handleGradeClick, handleClearScore, handleBulkGrade,
        handleAddTask, handleUpdateTask, handleToggleTaskField, handleDeleteTask,
        handleExportTasks,
    } = useTaskGrading(activeCourse, account, location);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const handleImport = useCallback(async (updates) => {
        await axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, { updates });
        fetchTaskSheet();
        showSnack(`${updates.length} notas importadas correctamente`);
    }, [fetchTaskSheet, showSnack]);

    if (!activeCourse) {
        return (
            <MainCard title="Calificación de Tareas">
                <MuiAlert severity="warning">Seleccione un Paralelo para comenzar.</MuiAlert>
            </MainCard>
        );
    }

    return (
        <MainCard title={`Calificación de Tareas - ${activeCourse.subject_details?.name} (${activeCourse.parallel})`}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: selectedSubCrit && tasks.length > 0 ? 6 : 12 }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Sub-Criterio de Evaluación</InputLabel>
                        <Select
                            value={selectDisplayValue}
                            onChange={e => e.target.value === 'CREATE_NEW' ? setDialogOpen(true) : setSelectedSubCrit(e.target.value)}
                            label="Sub-Criterio de Evaluación"
                        >
                            <MenuItem value="CREATE_NEW" sx={{ color: 'primary.main', fontWeight: 'bold' }}><em>+ Crear nueva tarea</em></MenuItem>
                            {subCriteria.filter(sc => sc.has_tasks).map(sc => (
                                <MenuItem key={sc.id} value={sc.id}>{sc.parent_criterion_details?.name} - {sc.name} ({sc.percentage}%)</MenuItem>
                            ))}
                            {specialCriteria.filter(sc => sc.has_tasks).map(sc => (
                                <MenuItem key={`special-${sc.id}`} value={`special-${sc.id}`}>⭐ {sc.parent_criterion_details?.name} - {sc.name} (+{sc.percentage} pts) [Extra]</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {selectedSubCrit && tasks.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 1, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                        <Tooltip title="Exportar notas a Excel">
                            <Button variant="outlined" size="small" color="success" startIcon={<IconDownload size="1rem" />} onClick={() => setExportOpen(true)}>Exportar</Button>
                        </Tooltip>
                        <Tooltip title="Importar notas desde Excel">
                            <Button variant="outlined" size="small" color="info" startIcon={<IconUpload size="1rem" />} onClick={() => setImportOpen(true)}>Importar</Button>
                        </Tooltip>
                    </Grid>
                )}

                {selectedSubCrit && (
                    <Grid size={12}>
                        <TextField fullWidth variant="outlined" placeholder="Buscar estudiante..." value={search} onChange={e => setSearch(e.target.value)} size="small" />
                    </Grid>
                )}
            </Grid>

            {selectedSubCrit && (
                isMobile ? (
                    <TaskGradingMobileList filteredRows={filteredRows} visibleTasks={visibleTasks} tasks={tasks} rows={rows} loading={loading} onGradeClick={handleGradeClick} onClearScore={handleClearScore} />
                ) : (
                    <TaskGradingTable visibleTasks={visibleTasks} tasks={tasks} filteredRows={filteredRows} loading={loading} onGradeClick={handleGradeClick} onClearScore={handleClearScore} onBulkGrade={handleBulkGrade} />
                )
            )}

            <Fab color="secondary" aria-label="gestionar tareas" onClick={() => setManageOpen(true)} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }} disabled={!selectedSubCrit || tasks.length === 0}>
                <IconEye />
            </Fab>

            <TaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleAddTask} subCriteria={subCriteria} specialCriteria={specialCriteria} initialSubCriterion={selectedSubCrit} />
            <ManageTasksDialog open={manageOpen} onClose={() => setManageOpen(false)} tasks={tasks} onUpdateTask={handleUpdateTask} onToggleTaskField={handleToggleTaskField} onDeleteTask={handleDeleteTask} onBulkGrade={handleBulkGrade} />
            <ExportTasksDialog open={exportOpen} onClose={() => setExportOpen(false)} tasks={tasks} visibleTasks={visibleTasks} onExport={handleExportTasks} />
            <ImportTasksDialog open={importOpen} onClose={() => setImportOpen(false)} tasks={tasks} rows={rows} onImport={handleImport} />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={closeSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <MuiAlert elevation={6} variant="filled" onClose={closeSnackbar} severity={snackbar.severity}>{snackbar.message}</MuiAlert>
            </Snackbar>
        </MainCard>
    );
};

export default TaskGrading;
