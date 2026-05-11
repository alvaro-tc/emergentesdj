import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery, useTheme, Snackbar, Dialog, DialogContent, CircularProgress, Typography, Divider, CardContent } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import MainCard from '../../../ui-component/cards/MainCard';
import { selectAccount, selectActiveCourse } from '../../../store/selectors';
import { useGradesheet } from '../../../hooks/useGradesheet';
import { useGradeActions } from '../../../hooks/useGradeActions';
import { augmentRowsWithGrades } from '../../../utils/gradeCalculations';
import GradesToolbar from './components/GradesToolbar';
import GradesTable from './components/GradesTable';
import GradesMobileList from './components/GradesMobileList';
import GradeSettingsDialog from './GradeSettingsDialog';
import ManageProjectDialog from './components/ManageProjectDialog';
import ExportGradesDialog from './ExportGradesDialog';
import ImportGradesDialog from './ImportGradesDialog';
import StudentTaskModal from './components/StudentTaskModal';
import StudentDetailModal from './components/StudentDetailModal';

const Grades = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const account = useSelector(selectAccount);
    const activeCourse = useSelector(selectActiveCourse);

    const [showFinalGrade, setShowFinalGrade] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState({ ci: true, paterno: true, materno: true, nombre: true });

    const sheet = useGradesheet(activeCourse, account.token);
    const { structure, rows, allEnrollments, projects, loading, totalCount, page, pageSize, search, criterionGradeVisibility, setCriterionGradeVisibility, fetchGradesheet, loadProjects, handleSearchChange, handlePageChange, handlePageSizeChange, setRows } = sheet;

    const isCriterionGradeVisible = useCallback((groupId) => criterionGradeVisibility[groupId] !== false, [criterionGradeVisibility]);

    const rowsWithGrades = useMemo(() => augmentRowsWithGrades(rows, structure), [rows, structure]);

    const actions = useGradeActions({ activeCourse, token: account.token, structure, filteredRows: rowsWithGrades, page, pageSize, searchQuery: search, setRows, fetchGradesheet, loadProjects, isCriterionVisible: isCriterionGradeVisible, showFinalGrade });

    if (!activeCourse) {
        return (
            <MainCard title="Calificaciones">
                <MuiAlert severity="warning">Seleccione un Paralelo en el buscador superior para gestionar calificaciones.</MuiAlert>
            </MainCard>
        );
    }

    const enrollmentsList = allEnrollments.map(r => ({
        id: r.id,
        student_details: { first_name: r.student_details?.first_name || '', paternal_surname: r.student_details?.paternal_surname || '', maternal_surname: r.student_details?.maternal_surname || '' }
    }));

    return (
        <MainCard title={`Calificaciones - ${activeCourse.subject_details?.name || ''} (${activeCourse.parallel || ''})`} contentSX={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
            {/* Loading overlay */}
            <Dialog open={loading} onClose={() => {}}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress />
                    <Typography>Cargando...</Typography>
                </DialogContent>
            </Dialog>

            {/* Dialogs */}
            <ExportGradesDialog open={actions.exportDialogOpen} onClose={() => actions.setExportDialogOpen(false)} onExport={actions.handleExport} />
            <ImportGradesDialog open={actions.importDialogOpen} onClose={() => actions.setImportDialogOpen(false)} structure={structure} activeCourse={activeCourse} onSuccess={() => fetchGradesheet(page, pageSize, search)} />
            <GradeSettingsDialog open={actions.settingsOpen} onClose={() => actions.setSettingsOpen(false)} structure={structure} onRefresh={fetchGradesheet} criterionGradeVisibility={criterionGradeVisibility} setCriterionGradeVisibility={setCriterionGradeVisibility} showFinalGrade={showFinalGrade} setShowFinalGrade={setShowFinalGrade} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
            <ManageProjectDialog open={actions.manageDialogOpen} onClose={() => actions.setManageDialogOpen(false)} project={actions.currentProject} enrollments={enrollmentsList} unavailableStudentIds={actions.currentProject ? sheet.projects.filter(p => p.sub_criterion === actions.currentProject.sub_criterion && p.id !== actions.currentProject.id).flatMap(p => p.members) : []} onSave={actions.handleSaveProject} />
            <StudentTaskModal open={actions.taskModalOpen} onClose={actions.handleCloseTaskModal} courseId={activeCourse?.id} subCriterionId={actions.taskModalSubCrit} studentRow={actions.taskModalStudent} />
            <StudentDetailModal open={actions.detailModalOpen} onClose={actions.handleCloseDetailModal} studentRow={actions.detailModalRow} structure={structure} projects={projects} activeCourse={activeCourse} onScoreChange={actions.handleScoreChange} onManageProject={actions.handleManageProject} />

            <CardContent>
                <GradesToolbar search={search} onSearchChange={handleSearchChange} onExport={() => actions.setExportDialogOpen(true)} onImport={() => actions.setImportDialogOpen(true)} onSettings={() => actions.setSettingsOpen(true)} isMobile={isMobile} />
                <Divider sx={{ my: 2 }} />

                {isMobile ? (
                    <GradesMobileList rows={rowsWithGrades} totalCount={totalCount} page={page} pageSize={pageSize} showFinalGrade={showFinalGrade} onRowClick={actions.handleOpenDetailModal} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} onExport={() => actions.setExportDialogOpen(true)} onSettings={() => actions.setSettingsOpen(true)} />
                ) : (
                    <GradesTable rows={rowsWithGrades} structure={structure} totalCount={totalCount} page={page} pageSize={pageSize} visibleColumns={visibleColumns} showFinalGrade={showFinalGrade} isCriterionGradeVisible={isCriterionGradeVisible} projects={projects} onScoreChange={actions.handleScoreChange} onOpenTaskModal={actions.handleOpenTaskModal} onOpenDetailModal={actions.handleOpenDetailModal} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
                )}
            </CardContent>

            <Snackbar open={actions.snackbar.open} autoHideDuration={6000} onClose={actions.closeSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <MuiAlert elevation={6} variant="filled" onClose={actions.closeSnackbar} severity={actions.snackbar.severity}>{actions.snackbar.message}</MuiAlert>
            </Snackbar>
        </MainCard>
    );
};

export default Grades;
