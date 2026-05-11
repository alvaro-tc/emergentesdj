import { useState, useCallback } from 'react';
import axios from 'axios';
import configData from '../config';
import { exportGradesToPDF, exportGradesToExcel } from '../utils/gradeCalculations';

export const useGradeActions = ({ activeCourse, token, structure, filteredRows, page, pageSize, searchQuery, setRows, fetchGradesheet, loadProjects, isCriterionVisible, showFinalGrade }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalStudent, setTaskModalStudent] = useState(null);
    const [taskModalSubCrit, setTaskModalSubCrit] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalRow, setDetailModalRow] = useState(null);

    const showSnack = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);
    const closeSnackbar = useCallback(() => setSnackbar(s => ({ ...s, open: false })), []);

    const saveSingleScore = useCallback((enrollmentId, critId, value) => {
        axios.post(`${configData.API_SERVER}criterion-scores/bulk_save/`, {
            updates: [{ enrollment_id: enrollmentId, criterion_id: critId, score: parseFloat(value) || 0 }]
        }).catch(() => showSnack('Error al guardar nota', 'error'));
    }, [showSnack]);

    const handleScoreChange = useCallback((enrollmentId, critId, value) => {
        setRows(prev => prev.map(row => row.enrollment_id === enrollmentId
            ? { ...row, grades: { ...row.grades, [critId]: value } }
            : row
        ));
        saveSingleScore(enrollmentId, critId, value);
    }, [setRows, saveSingleScore]);

    const handleManageProject = useCallback((project, group) => {
        let maxScore = 100;
        const src = group || null;
        if (src) {
            const sub = src.sub_criteria.find(s => s.id === project.sub_criterion);
            if (sub) maxScore = sub.percentage;
        } else {
            for (const g of structure) {
                const sub = g.sub_criteria.find(s => s.id === project.sub_criterion);
                if (sub) { maxScore = sub.percentage; break; }
            }
        }
        setCurrentProject({ ...project, maxScore });
        setManageDialogOpen(true);
    }, [structure]);

    const handleSaveProject = useCallback((formData) => {
        if (!currentProject) return;
        axios.put(`${configData.API_SERVER}projects/${currentProject.id}/`, {
            ...formData, course: activeCourse.id, score: formData.score === '' ? null : formData.score
        })
            .then(() => {
                setManageDialogOpen(false);
                showSnack('Proyecto actualizado correctamente');
                fetchGradesheet(page, pageSize, searchQuery);
                loadProjects();
            })
            .catch(err => showSnack(err.response?.data?.[0] || 'Error al actualizar proyecto', 'error'));
    }, [currentProject, activeCourse, page, pageSize, searchQuery, fetchGradesheet, loadProjects, showSnack]);

    const handleExport = useCallback((type) => {
        if (!activeCourse) return;
        if (type === 'pdf') exportGradesToPDF(filteredRows, structure, isCriterionVisible, showFinalGrade, activeCourse);
        else exportGradesToExcel(filteredRows, structure, isCriterionVisible, showFinalGrade, activeCourse);
    }, [activeCourse, filteredRows, structure, isCriterionVisible, showFinalGrade]);

    const handleOpenTaskModal = useCallback((studentRow, subCritId) => { setTaskModalStudent(studentRow); setTaskModalSubCrit(subCritId); setTaskModalOpen(true); }, []);
    const handleCloseTaskModal = useCallback(() => { setTaskModalOpen(false); setTaskModalStudent(null); setTaskModalSubCrit(null); fetchGradesheet(page, pageSize, searchQuery); }, [fetchGradesheet, page, pageSize, searchQuery]);
    const handleOpenDetailModal = useCallback((row) => { setDetailModalRow(row); setDetailModalOpen(true); }, []);
    const handleCloseDetailModal = useCallback(() => { setDetailModalOpen(false); setDetailModalRow(null); }, []);

    return {
        snackbar, closeSnackbar, showSnack,
        settingsOpen, setSettingsOpen,
        manageDialogOpen, setManageDialogOpen, currentProject,
        exportDialogOpen, setExportDialogOpen,
        importDialogOpen, setImportDialogOpen,
        taskModalOpen, taskModalStudent, taskModalSubCrit,
        detailModalOpen, detailModalRow,
        handleScoreChange, handleManageProject, handleSaveProject, handleExport,
        handleOpenTaskModal, handleCloseTaskModal,
        handleOpenDetailModal, handleCloseDetailModal,
    };
};
