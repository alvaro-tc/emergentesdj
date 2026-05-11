import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import configData from '../config';
import * as XLSX from 'xlsx';

export const LETTER_SCORES = { 'A': 1.0, 'B': 0.75, 'C': 0.5, 'D': 0.25, 'E': 0.0 };
export const LETTER_KEYS = Object.keys(LETTER_SCORES);

export const getLetterFromScore = (score) => {
    if (score === null || score === undefined || score === '') return null;
    const s = parseFloat(score);
    if (s >= 1.0) return 'A';
    if (s >= 0.75) return 'B';
    if (s >= 0.5) return 'C';
    if (s >= 0.25) return 'D';
    return 'E';
};

export const useTaskGrading = (activeCourse, account, location) => {
    const [subCriteria, setSubCriteria] = useState([]);
    const [specialCriteria, setSpecialCriteria] = useState([]);
    const [selectedSubCrit, setSelectedSubCrit] = useState('');
    const [tasks, setTasks] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [changes, setChanges] = useState({});
    const [search, setSearch] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnack = useCallback((msg, sev = 'success') => setSnackbar({ open: true, message: msg, severity: sev }), []);
    const closeSnackbar = useCallback(() => setSnackbar(s => ({ ...s, open: false })), []);

    const visibleTasks = useMemo(() => tasks.filter(t => t.is_public), [tasks]);

    const filteredRows = useMemo(() => {
        const term = search.toLowerCase();
        if (!term) return rows;
        return rows.filter(row =>
            (row.paterno || '').toLowerCase().includes(term) ||
            (row.materno || '').toLowerCase().includes(term) ||
            (row.nombre || '').toLowerCase().includes(term) ||
            (row.ci || '').toLowerCase().includes(term)
        );
    }, [rows, search]);

    const selectDisplayValue = useMemo(() => {
        if (!selectedSubCrit) return '';
        const isSpecial = String(selectedSubCrit).startsWith('special-');
        if (isSpecial) return specialCriteria.some(sc => `special-${sc.id}` === String(selectedSubCrit)) ? selectedSubCrit : '';
        return subCriteria.some(sc => sc.id === selectedSubCrit || String(sc.id) === String(selectedSubCrit)) ? selectedSubCrit : '';
    }, [selectedSubCrit, subCriteria, specialCriteria]);

    const fetchSubCriteria = useCallback(() => {
        if (!activeCourse) return;
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        Promise.all([
            axios.get(`${configData.API_SERVER}course-sub-criteria/?course=${activeCourse.id}`),
            axios.get(`${configData.API_SERVER}course-special-criteria/?course=${activeCourse.id}`)
        ]).then(([subRes, specialRes]) => {
            setSubCriteria(subRes.data);
            setSpecialCriteria(specialRes.data);
        }).catch(console.error);
    }, [activeCourse, account.token]);

    const fetchTaskSheet = useCallback(() => {
        if (!activeCourse || !selectedSubCrit) return;
        setLoading(true);
        axios.get(`${configData.API_SERVER}task-scores/task_sheet/?course_id=${activeCourse.id}&sub_criterion_id=${selectedSubCrit}`)
            .then(res => { setTasks(res.data.tasks); setRows(res.data.rows); setChanges({}); })
            .catch(() => showSnack('Error cargando tareas', 'error'))
            .finally(() => setLoading(false));
    }, [activeCourse, selectedSubCrit, showSnack]);

    useEffect(() => {
        if (activeCourse) { fetchSubCriteria(); setRows([]); setTasks([]); if (!location.search) setSelectedSubCrit(''); }
    }, [activeCourse?.id]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('sub_criterion_id');
        if (id) setSelectedSubCrit(String(id).startsWith('special-') ? id : parseInt(id));
    }, [location.search]);

    useEffect(() => {
        if (activeCourse && selectedSubCrit) {
            fetchTaskSheet();
            axios.post(`${configData.API_SERVER}courses/${activeCourse.id}/set_preference/`, { last_viewed_tab: selectedSubCrit }).catch(console.error);
        }
    }, [selectedSubCrit]);

    useEffect(() => {
        if (activeCourse && !selectedSubCrit && !location.search) {
            axios.get(`${configData.API_SERVER}courses/${activeCourse.id}/preference/`)
                .then(res => { const t = res.data.last_viewed_tab; if (t) setSelectedSubCrit(String(t).startsWith('special-') ? t : parseInt(t)); })
                .catch(console.error);
        }
    }, [activeCourse?.id]);

    const saveSingleScore = useCallback((enrollmentId, taskId, score) => {
        axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, { updates: [{ enrollment_id: enrollmentId, task_id: taskId, score }] })
            .catch(() => showSnack('Error guardando nota', 'error'));
    }, [showSnack]);

    const handleScoreChange = useCallback((enrollmentId, taskId, value) => {
        setRows(prev => prev.map(row => row.enrollment_id === enrollmentId ? { ...row, scores: { ...row.scores, [taskId]: value } } : row));
        setChanges(prev => ({ ...prev, [`${enrollmentId}-${taskId}`]: value }));
    }, []);

    const handleGradeClick = useCallback((enrollmentId, taskId, letter) => {
        const value = LETTER_SCORES[letter];
        handleScoreChange(enrollmentId, taskId, value);
        saveSingleScore(enrollmentId, taskId, value);
    }, [handleScoreChange, saveSingleScore]);

    const handleClearScore = useCallback((enrollmentId, taskId) => {
        setRows(prev => prev.map(row => row.enrollment_id === enrollmentId ? { ...row, scores: { ...row.scores, [taskId]: null } } : row));
        setChanges(prev => ({ ...prev, [`${enrollmentId}-${taskId}`]: null }));
        saveSingleScore(enrollmentId, taskId, null);
    }, [saveSingleScore]);

    const handleSave = useCallback(() => {
        const updates = Object.entries(changes).map(([key, rawScore]) => {
            const [eId, tId] = key.split('-');
            return { enrollment_id: parseInt(eId), task_id: parseInt(tId), score: rawScore === null ? null : (parseFloat(rawScore) || 0) };
        });
        if (!updates.length) return;
        setLoading(true);
        axios.post(`${configData.API_SERVER}task-scores/bulk_save/`, { updates })
            .then(() => { showSnack('Notas guardadas correctamente'); setChanges({}); })
            .catch(() => showSnack('Error al guardar', 'error'))
            .finally(() => setLoading(false));
    }, [changes, showSnack]);

    const handleBulkGrade = useCallback((taskId, letter) => {
        const value = LETTER_SCORES[letter];
        setRows(prev => prev.map(row => ({ ...row, scores: { ...row.scores, [taskId]: value } })));
        setChanges(prev => { const n = { ...prev }; rows.forEach(row => { n[`${row.enrollment_id}-${taskId}`] = value; }); return n; });
    }, [rows]);

    const handleAddTask = useCallback((taskData) => {
        setLoading(true);
        const targetSubCrit = taskData.subCriterionId || selectedSubCrit;
        const isSpecial = String(targetSubCrit).startsWith('special-');
        const payload = { name: taskData.name, weight: taskData.weight };
        if (isSpecial) payload.special_criterion = parseInt(String(targetSubCrit).replace('special-', ''));
        else payload.sub_criterion = parseInt(targetSubCrit);
        axios.post(`${configData.API_SERVER}course-tasks/`, payload)
            .then(() => {
                showSnack('Tarea creada');
                if (String(selectedSubCrit) !== String(targetSubCrit)) setSelectedSubCrit(targetSubCrit);
                else fetchTaskSheet();
                fetchSubCriteria();
            })
            .catch(() => { showSnack('Error creando tarea', 'error'); setLoading(false); });
    }, [selectedSubCrit, fetchTaskSheet, fetchSubCriteria, showSnack]);

    const handleUpdateTask = useCallback((editingTaskId, editTaskData) => {
        if (!editTaskData.name) return;
        setLoading(true);
        const isSpecial = String(selectedSubCrit).startsWith('special-');
        const payload = { ...editTaskData };
        if (isSpecial) payload.special_criterion = parseInt(selectedSubCrit.replace('special-', ''));
        else payload.sub_criterion = parseInt(selectedSubCrit);
        axios.put(`${configData.API_SERVER}course-tasks/${editingTaskId}/`, payload)
            .then(() => { showSnack('Tarea actualizada'); fetchTaskSheet(); })
            .catch(() => { showSnack('Error actualizando tarea', 'error'); setLoading(false); });
    }, [selectedSubCrit, fetchTaskSheet, showSnack]);

    const handleToggleTaskField = useCallback((task, field) => {
        setLoading(true);
        axios.patch(`${configData.API_SERVER}course-tasks/${task.id}/`, { [field]: !task[field] })
            .then(() => { showSnack('Estado actualizado'); fetchTaskSheet(); })
            .catch(() => { showSnack('Error actualizando estado', 'error'); setLoading(false); });
    }, [fetchTaskSheet, showSnack]);

    const handleDeleteTask = useCallback((taskId) => {
        if (!window.confirm('¿Eliminar esta tarea? Se recalcularán los promedios.')) return;
        setLoading(true);
        axios.delete(`${configData.API_SERVER}course-tasks/${taskId}/`)
            .then(() => { showSnack('Tarea eliminada'); fetchTaskSheet(); })
            .catch(() => { showSnack('Error eliminando tarea', 'error'); setLoading(false); });
    }, [fetchTaskSheet, showSnack]);

    const handleExportTasks = useCallback((selectedTaskIds) => {
        const selectedTaskObjs = tasks.filter(t => selectedTaskIds.includes(t.id));
        const header = ['CI', 'Apellido Paterno', 'Apellido Materno', 'Nombre', ...selectedTaskObjs.map(t => t.name)];
        const dataRows = rows.map(row => [
            row.ci || '', row.paterno || '', row.materno || '', row.nombre || '',
            ...selectedTaskObjs.map(t => getLetterFromScore(row.scores[t.id]) || '')
        ]);
        const isSpecial = String(selectedSubCrit).startsWith('special-');
        const sc = isSpecial
            ? specialCriteria.find(s => `special-${s.id}` === String(selectedSubCrit))
            : subCriteria.find(s => s.id === selectedSubCrit || String(s.id) === String(selectedSubCrit));
        const name = sc ? sc.name : 'tareas';
        const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
        ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, ...selectedTaskObjs.map(() => ({ wch: 14 }))];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Notas');
        XLSX.writeFile(wb, `notas_${name.replace(/\s+/g, '_')}.xlsx`);
        showSnack('Archivo exportado correctamente');
    }, [tasks, rows, selectedSubCrit, subCriteria, specialCriteria, showSnack]);

    const handleConfirmUndo = useCallback(() => { setChanges({}); fetchTaskSheet(); }, [fetchTaskSheet]);

    return {
        subCriteria, specialCriteria, selectedSubCrit, setSelectedSubCrit,
        tasks, rows, setRows, loading, changes, search, setSearch,
        snackbar, showSnack, closeSnackbar,
        visibleTasks, filteredRows, selectDisplayValue,
        fetchTaskSheet, fetchSubCriteria,
        handleGradeClick, handleClearScore, handleScoreChange,
        handleSave, handleBulkGrade,
        handleAddTask, handleUpdateTask, handleToggleTaskField, handleDeleteTask,
        handleExportTasks, handleConfirmUndo,
    };
};
