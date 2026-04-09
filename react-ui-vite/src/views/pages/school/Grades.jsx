// Re-compile trigger 3
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Grid,
    CardContent,
    Typography,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    TextField,
    Button,
    InputAdornment,
    CircularProgress,
    Snackbar,
    IconButton,
    Tooltip,
    Dialog,
    DialogContent,
    useMediaQuery,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ListItem,
    ListItemText,
    List
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { IconSearch, IconDeviceFloppy, IconSettings, IconEye, IconNotebook, IconDownload, IconChevronDown } from '@tabler/icons-react';
import MainCard from './../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import GradeSettingsDialog from './GradeSettingsDialog';
import ManageProjectDialog from './components/ManageProjectDialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ExportGradesDialog from './ExportGradesDialog';
import StudentTaskModal from './components/StudentTaskModal';
import StudentDetailModal from './components/StudentDetailModal';

const augmentRowsWithGrades = (rows, structure) => {
    return rows.map(row => {
        const criterionGrades = {};
        let finalGradeNumeric = 0;

        structure.forEach(group => {
            let totalScore = 0;
            // Sum regular sub-criteria scores
            group.sub_criteria.forEach(sub => {
                const score = row.grades[sub.id];
                if (score !== undefined && score !== null && score !== '') {
                    totalScore += parseFloat(score);
                }
            });

            // Add special criteria (extra points) directly
            let extraPoints = 0;
            (group.special_criteria || []).forEach(spec => {
                const score = row.grades[spec.id];
                if (score !== undefined && score !== null && score !== '') {
                    extraPoints += parseFloat(score);
                }
            });

            // Total Score
            let criterionGradeNumeric = 0;
            let criterionGrade = '-';

            if (totalScore > 0 || extraPoints > 0) {
                const rawTotal = totalScore + extraPoints;
                const maxWeight = parseFloat(group.weight);
                // Cap the score at the criterion weight
                criterionGradeNumeric = Math.min(rawTotal, maxWeight);
                criterionGrade = criterionGradeNumeric.toFixed(2);
            }

            criterionGrades[group.id] = {
                grade: criterionGradeNumeric,
                weight: parseFloat(group.weight),
                formatted: criterionGrade
            };

            if (criterionGradeNumeric > 0) {
                finalGradeNumeric += criterionGradeNumeric;
            }
        });

        const finalGrade = finalGradeNumeric > 0 ? finalGradeNumeric.toFixed(2) : '-';

        return {
            ...row,
            _criterionGrades: criterionGrades,
            _finalGrade: finalGrade
        };
    });
};

const Grades = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);

    const [loading, setLoading] = useState(false);
    const [structure, setStructure] = useState([]); // Hierarchical criteria
    const [rows, setRows] = useState([]);
    const [allEnrollments, setAllEnrollments] = useState([]); // lightweight list for project dialog
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // debounced value sent to server
    const [page, setPage] = useState(0); // MUI TablePagination is 0-based
    const [pageSize, setPageSize] = useState(30);
    const [totalCount, setTotalCount] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [changes, setChanges] = useState({}); // { "enrollmentId-critId": newVal }
    const debounceRef = useRef(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Project Management Logic
    const [projects, setProjects] = useState([]);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [showCriterionGrades, setShowCriterionGrades] = useState(true);
    const [showFinalGrade, setShowFinalGrade] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState({
        ci: true,
        paterno: true,
        materno: true,
        nombre: true
    });
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    // Modal state for Task Editing
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalStudent, setTaskModalStudent] = useState(null);
    const [taskModalSubCrit, setTaskModalSubCrit] = useState(null);

    // Student detail modal state
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalRow, setDetailModalRow] = useState(null);

    const handleOpenDetailModal = (row) => {
        setDetailModalRow(row);
        setDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setDetailModalOpen(false);
        setDetailModalRow(null);
    };

    const handleOpenTaskModal = (studentRow, subCritId) => {
        setTaskModalStudent(studentRow);
        setTaskModalSubCrit(subCritId);
        setTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setTaskModalOpen(false);
        setTaskModalStudent(null);
        setTaskModalSubCrit(null);
        fetchGradesheet(page, pageSize, searchQuery);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
            setSearchQuery(val);
        }, 400);
    };

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value, 10));
        setPage(0);
    };

    // ... (existing useEffect, loadProjects, etc.)

    /* const handleExport = (type) => {
        if (!activeCourse) return;

        // 1. Prepare Data
        const headers = ["No.", "CI", "Paterno", "Materno", "Nombres"];
        const dataKeys = ["ci", "paterno", "materno", "nombre"];

        // Dynamic Headers based on visibility
        structure.forEach(group => {
            const visibleSubs = group.sub_criteria.filter(s => s.visible);
            const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);

            if ((visibleSubs.length + visibleSpecials.length) === 0 && !showCriterionGrades) return;

            visibleSubs.forEach(sub => {
                headers.push(`${sub.name} (${sub.percentage}%)`);
                dataKeys.push(sub.id);
            });
            visibleSpecials.forEach(spec => {
                headers.push(`(Extra) ${spec.name}`);
                dataKeys.push(spec.id);
            });
            if (showCriterionGrades) {
                headers.push(`Nota ${group.name} (${group.weight}%)`);
                dataKeys.push(`criterion-${group.id}`); // logical key
            }
        });

        if (showFinalGrade) {
            headers.push("Nota Final");
            dataKeys.push("final_grade");
        }

        // Build Rows
        const exportRows = filteredRows.map((row, index) => {
            const rowData = [
                index + 1,
                row.ci,
                row.paterno,
                row.materno,
                row.nombre
            ];

            structure.forEach(group => {
                const visibleSubs = group.sub_criteria.filter(s => s.visible);
                const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);

                if ((visibleSubs.length + visibleSpecials.length) === 0 && !showCriterionGrades) return;

                visibleSubs.forEach(sub => {
                    rowData.push(row.grades[sub.id] ? parseFloat(row.grades[sub.id]).toFixed(2) : '-');
                });
                visibleSpecials.forEach(spec => {
                    rowData.push(row.grades[spec.id] ? `+${parseFloat(row.grades[spec.id]).toFixed(2)}` : '-');
                });
                if (showCriterionGrades) {
                    const criterionGrade = row._criterionGrades && row._criterionGrades[group.id]
                        ? row._criterionGrades[group.id].grade
                        : null;
                    rowData.push(criterionGrade !== null ? criterionGrade.toFixed(2) : '-');
                }
            });

            if (showFinalGrade) {
                let finalGradeNumeric = 0;
                if (row._criterionGrades) {
                    Object.values(row._criterionGrades).forEach(({ grade }) => {
                        if (grade !== null) finalGradeNumeric += grade;
                    });
                }
                const finalGrade = finalGradeNumeric > 0 ? finalGradeNumeric.toFixed(2) : '-';
                rowData.push(finalGrade);
            }

            return rowData;
        });

        const fileName = `Calificaciones_${activeCourse.subject_details?.name || 'Curso'}_${activeCourse.parallel || ''}_${new Date().toLocaleDateString('es-BO').replace(/\//g, '-')}`;

        if (type === 'pdf') {
            const doc = new jsPDF('landscape'); // Landscape for better column fit

            // Header
            doc.setFontSize(14);
            doc.text(`Calificaciones: ${activeCourse.subject_details?.name || ''} - Paralelo ${activeCourse.parallel || ''}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-BO')}`, 14, 22);

            doc.autoTable({
                head: [headers],
                body: exportRows,
                startY: 25,
                theme: 'plain', // Black and white simple theme
                styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }, // Light gray header
            });

            doc.save(`${fileName}.pdf`);
        } else if (type === 'excel') {
            const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Calificaciones");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        }
    }; */

    const fetchGradesheet = (currentPage, currentPageSize, currentSearch) => {
        if (!activeCourse) return;
        const p = currentPage !== undefined ? currentPage : page;
        const ps = currentPageSize !== undefined ? currentPageSize : pageSize;
        const s = currentSearch !== undefined ? currentSearch : searchQuery;
        setLoading(true);
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        const params = new URLSearchParams({
            course_id: activeCourse.id,
            page: p + 1, // backend is 1-based
            page_size: ps,
        });
        if (s) params.set('search', s);
        axios.get(`${configData.API_SERVER}criterion-scores/gradesheet/?${params}`)
            .then(response => {
                setStructure(response.data.structure || []);
                setRows(response.data.rows || []);
                setTotalCount(response.data.pagination?.total_count ?? 0);
                setChanges({});
            })
            .catch(error => {
                console.error(error);
                setSnackbar({ open: true, message: 'Error cargando calificaciones', severity: 'error' });
            })
            .finally(() => setLoading(false));
    };

    const loadAllEnrollments = () => {
        if (!activeCourse) return;
        axios.get(`${configData.API_SERVER}enrollments/?course=${activeCourse.id}`)
            .then(res => setAllEnrollments(res.data.results || res.data || []))
            .catch(err => console.error(err));
    };

    const loadProjects = () => {
        axios.get(`${configData.API_SERVER}projects/?course=${activeCourse.id}`)
            .then(res => setProjects(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (activeCourse) {
            setPage(0);
            setSearch('');
            setSearchQuery('');
            loadProjects();
            loadAllEnrollments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCourse?.id]);

    useEffect(() => {
        if (activeCourse) {
            fetchGradesheet(page, pageSize, searchQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCourse?.id, page, pageSize, searchQuery]);

    const getUnavailableStudentIds = (subCriterionId, excludeProjectId = null) => {
        if (!subCriterionId) return [];
        const ids = [];
        projects.forEach(p => {
            if (p.sub_criterion === subCriterionId && p.id !== excludeProjectId) {
                ids.push(...p.members);
            }
        });
        return ids;
    };

    const handleManageProject = (project) => {
        let maxScore = 100;
        for (const group of structure) {
            const sub = group.sub_criteria.find(s => s.id === project.sub_criterion);
            if (sub) {
                maxScore = sub.percentage;
                break;
            }
        }
        setCurrentProject({ ...project, maxScore });
        setManageDialogOpen(true);
    };

    const handleSaveProject = (formData) => {
        if (!currentProject) return;
        const payload = {
            ...formData,
            course: activeCourse.id,
            score: formData.score === '' ? null : formData.score
        };

        axios.put(`${configData.API_SERVER}projects/${currentProject.id}/`, payload)
            .then(() => {
                setManageDialogOpen(false);
                setSnackbar({ open: true, message: 'Proyecto actualizado correctamente', severity: 'success' });
                fetchGradesheet(page, pageSize, searchQuery);
                loadProjects();
            })
            .catch(err => {
                console.error(err);
                if (err.response && err.response.data && err.response.data[0]) {
                    setSnackbar({ open: true, message: err.response.data[0], severity: 'error' });
                } else {
                    setSnackbar({ open: true, message: 'Error al actualizar proyecto', severity: 'error' });
                }
            });
    };

    const saveSingleScore = (enrollmentId, critId, value) => {
        const payload = {
            updates: [{
                enrollment_id: enrollmentId,
                criterion_id: critId,
                score: parseFloat(value) || 0
            }]
        };

        axios.post(`${configData.API_SERVER}criterion-scores/bulk_save/`, payload)
            .then(() => {
                // Optional: success feedback
            })
            .catch(error => {
                console.error(error);
                setSnackbar({ open: true, message: 'Error al guardar nota', severity: 'error' });
            });
    };

    const handleScoreChange = (enrollmentId, critId, value) => {
        setRows(prevRows => prevRows.map(row => {
            if (row.enrollment_id === enrollmentId) {
                return {
                    ...row,
                    grades: {
                        ...row.grades,
                        [critId]: value
                    }
                };
            }
            return row;
        }));

        setChanges(prev => ({
            ...prev,
            [`${enrollmentId}-${critId}`]: value
        }));

        // Auto-save
        saveSingleScore(enrollmentId, critId, value);
    };

    // handleSave removed (auto-save implemented)

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const handleExport = (type) => {
        if (!activeCourse) return;

        // 1. Prepare Data
        const headers = ["No.", "CI", "Paterno", "Materno", "Nombres"];
        const dataKeys = ["ci", "paterno", "materno", "nombre"];

        // Dynamic Headers based on visibility
        structure.forEach(group => {
            const visibleSubs = group.sub_criteria.filter(s => s.visible);
            const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);

            if ((visibleSubs.length + visibleSpecials.length) === 0 && !showCriterionGrades) return;

            visibleSubs.forEach(sub => {
                headers.push(`${sub.name} (${sub.percentage}%)`);
                dataKeys.push(sub.id);
            });
            visibleSpecials.forEach(spec => {
                headers.push(`(Extra) ${spec.name}`);
                dataKeys.push(spec.id);
            });
            if (showCriterionGrades) {
                headers.push(`Nota ${group.name} (${group.weight}%)`);
                dataKeys.push(`criterion-${group.id}`); // logical key
            }
        });

        if (showFinalGrade) {
            headers.push("Nota Final");
            dataKeys.push("final_grade");
        }

        // Build Rows
        const exportRows = filteredRows.map((row, index) => {
            const rowData = [
                index + 1,
                row.ci,
                row.paterno,
                row.materno,
                row.nombre
            ];

            structure.forEach(group => {
                const visibleSubs = group.sub_criteria.filter(s => s.visible);
                const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);

                if ((visibleSubs.length + visibleSpecials.length) === 0 && !showCriterionGrades) return;

                visibleSubs.forEach(sub => {
                    rowData.push(row.grades[sub.id] ? parseFloat(row.grades[sub.id]).toFixed(2) : '-');
                });
                visibleSpecials.forEach(spec => {
                    rowData.push(row.grades[spec.id] ? `+${parseFloat(row.grades[spec.id]).toFixed(2)}` : '-');
                });
                if (showCriterionGrades) {
                    const criterionGrade = row._criterionGrades && row._criterionGrades[group.id]
                        ? row._criterionGrades[group.id].grade
                        : null;
                    rowData.push(criterionGrade !== null ? criterionGrade.toFixed(2) : '-');
                }
            });

            if (showFinalGrade) {
                let finalGradeNumeric = 0;
                if (row._criterionGrades) {
                    Object.values(row._criterionGrades).forEach(({ grade }) => {
                        if (grade !== null) finalGradeNumeric += grade;
                    });
                }
                const finalGrade = finalGradeNumeric > 0 ? finalGradeNumeric.toFixed(2) : '-';
                rowData.push(finalGrade);
            }

            return rowData;
        });

        const fileName = `Calificaciones_${activeCourse.subject_details?.name || 'Curso'}_${activeCourse.parallel || ''}_${new Date().toLocaleDateString('es-BO').replace(/\//g, '-')}`;

        if (type === 'pdf') {
            const doc = new jsPDF('landscape'); // Landscape for better column fit

            // Header
            doc.setFontSize(14);
            doc.text(`Calificaciones: ${activeCourse.subject_details?.name || ''} - Paralelo ${activeCourse.parallel || ''}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-BO')}`, 14, 22);

            doc.autoTable({
                head: [headers],
                body: exportRows,
                startY: 25,
                theme: 'plain', // Black and white simple theme
                styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }, // Light gray header
            });

            doc.save(`${fileName}.pdf`);
        } else if (type === 'excel') {
            const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Calificaciones");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        }
    };

    // Server-side filtering: rows are already filtered and paginated
    const rowsWithGrades = React.useMemo(() => augmentRowsWithGrades(rows, structure), [rows, structure]);
    const filteredRows = rowsWithGrades;

    if (!activeCourse) {
        return (
            <MainCard title="Calificaciones">
                <MuiAlert severity="warning">Seleccione un Paralelo en el buscador superior para gestionar calificaciones.</MuiAlert>
            </MainCard>
        );
    }

    // Helper to get visible flat list for body rendering
    // const visibleSubCriteria = structure.flatMap(group =>
    //    group.sub_criteria.filter(sub => sub.visible)
    // );

    // Sticky configuration
    const paternoLeft = 0;
    const maternoLeft = 140; // width of paterno

    return (
        <MainCard title={`Calificaciones - ${activeCourse.subject_details?.name || ''} (${activeCourse.parallel || ''})`}>
            <Dialog open={loading} onClose={() => { }}>
                <DialogContent>
                    <CircularProgress />
                    <Typography>Cargando...</Typography>
                </DialogContent>
            </Dialog>
            <ExportGradesDialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                onExport={handleExport}
            />
            <CardContent>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Buscar estudiante..."
                            value={search}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconSearch stroke={1.5} size="1rem" />
                                    </InputAdornment>
                                )
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid>
                        <Tooltip title="Exportar Calificaciones">
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => setExportDialogOpen(true)}
                                startIcon={<IconDownload />}
                                style={{ marginRight: 8 }}
                            >
                                Exportar
                            </Button>
                        </Tooltip>
                        <Tooltip title="Ajustes de Calificaciones">
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => setSettingsOpen(true)}
                                startIcon={<IconSettings />}
                                style={{ marginRight: 8 }}
                            >
                                Ajustes
                            </Button>
                        </Tooltip>
                        {/* Auto-save enabled, manual button removed */}
                    </Grid>
                </Grid>

                <Divider style={{ margin: '20px 0' }} />

                {/* Desktop View */}
                {!isMobile && (
                    <>
                    <TableContainer>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                {/* Group Header Row */}
                                <TableRow>
                                    {visibleColumns.ci && <TableCell rowSpan={2} style={{ backgroundColor: '#fff', zIndex: 10, minWidth: 80 }}>CI</TableCell>}
                                    {visibleColumns.paterno && <TableCell rowSpan={2} style={{ backgroundColor: '#fff', zIndex: 11, position: 'sticky', left: paternoLeft, minWidth: 140 }}>Paterno</TableCell>}
                                    {visibleColumns.materno && <TableCell rowSpan={2} style={{ backgroundColor: '#fff', zIndex: 11, position: 'sticky', left: visibleColumns.paterno ? maternoLeft : 0, minWidth: 140 }}>Materno</TableCell>}
                                    {visibleColumns.nombre && <TableCell rowSpan={2} style={{ backgroundColor: '#fff', zIndex: 10, minWidth: 140 }}>Nombres</TableCell>}
                                    {structure.map((group, index) => {
                                        const visibleSubCount = group.sub_criteria.filter(s => s.visible).length;
                                        const visibleSpecialCount = (group.special_criteria || []).filter(s => s.visible).length;
                                        const totalVisible = visibleSubCount + visibleSpecialCount;

                                        // Show nothing if no visible columns AND criterion grades are hidden
                                        if (totalVisible === 0 && !showCriterionGrades) return null;

                                        // Alternating background colors for groups
                                        const bgColor = index % 2 === 0 ? '#e3f2fd' : '#f3e5f5';

                                        return (
                                            <React.Fragment key={group.id}>
                                                {totalVisible > 0 && (
                                                    <TableCell
                                                        colSpan={totalVisible}
                                                        align="center"
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            borderLeft: '2px solid #aaa',
                                                            borderTop: '2px solid #aaa',
                                                            fontWeight: 'bold',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        {group.name} <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>({group.weight} Pts)</span>
                                                    </TableCell>
                                                )}
                                                {showCriterionGrades && <TableCell rowSpan={2} align="center" style={{ backgroundColor: bgColor, fontWeight: 'bold', borderRight: '2px solid #aaa', borderTop: '2px solid #aaa', borderLeft: totalVisible === 0 ? '2px solid #aaa' : '1px solid #666', minWidth: 80 }}>Nota<br />{group.name}</TableCell>}
                                            </React.Fragment>
                                        );
                                    })}
                                    {showFinalGrade && <TableCell rowSpan={2} align="center" style={{ backgroundColor: '#c8e6c9', fontWeight: 'bold', borderLeft: '3px solid #4caf50', color: '#2e7d32' }}>Nota Final</TableCell>}
                                </TableRow>
                                {/* SubCriteria Header Row */}
                                <TableRow>
                                    {structure.map((group, index) => {
                                        const visibleSubs = group.sub_criteria.filter(s => s.visible);
                                        const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);
                                        const totalVisible = visibleSubs.length + visibleSpecials.length;

                                        // Skip if no visible columns AND criterion grades are hidden
                                        if (totalVisible === 0 && !showCriterionGrades) return null;

                                        return (
                                            <React.Fragment key={group.id}>
                                                {visibleSubs.map((sub, sIdx) => {
                                                    const isLast = sIdx === visibleSubs.length - 1 && visibleSpecials.length === 0 && !showCriterionGrades;
                                                    return (
                                                        <TableCell
                                                            key={sub.id}
                                                            align="center"
                                                            style={{
                                                                minWidth: 100,
                                                                borderLeft: 'none',
                                                                borderRight: isLast ? '2px solid #aaa' : '1px solid #ddd',
                                                                backgroundColor: '#fafafa'
                                                            }}
                                                        >
                                                            {sub.name}
                                                            <Typography variant="caption" display="block" color="textSecondary">{sub.percentage} Pts</Typography>
                                                        </TableCell>
                                                    );
                                                })}
                                                {visibleSpecials.map((spec, specIdx) => {
                                                    const isLast = specIdx === visibleSpecials.length - 1 && !showCriterionGrades;
                                                    return (
                                                        <TableCell
                                                            key={spec.id}
                                                            align="center"
                                                            style={{
                                                                minWidth: 100,
                                                                borderLeft: 'none',
                                                                borderRight: isLast ? '2px solid #aaa' : '1px solid #ddd',
                                                                backgroundColor: '#fff3e0'
                                                            }}
                                                        >
                                                            ⭐ {spec.name}
                                                            <Typography variant="caption" display="block" style={{ color: '#e65100' }}>+{spec.percentage} pts</Typography>
                                                        </TableCell>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableRow>
                            </TableHead >
                            <TableBody>
                                {filteredRows.length === 0 ? (
                                    <TableRow><TableCell colSpan={10} align="center">No hay estudiantes.</TableCell></TableRow>
                                ) : (
                                    filteredRows.map(row => (
                                        <TableRow key={row.enrollment_id} hover>
                                            {visibleColumns.ci && (
                                                <TableCell style={{ backgroundColor: '#fff', zIndex: 5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        component="span"
                                                        onClick={() => handleOpenDetailModal(row)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold',
                                                            textDecoration: 'underline',
                                                            '&:hover': { color: 'primary.dark' }
                                                        }}
                                                    >
                                                        {row.ci}
                                                    </Typography>
                                                </TableCell>
                                            )}
                                            {visibleColumns.paterno && <TableCell style={{ backgroundColor: '#fff', position: 'sticky', left: paternoLeft, zIndex: 6, fontWeight: 'bold' }}>{row.paterno}</TableCell>}
                                            {visibleColumns.materno && <TableCell style={{ backgroundColor: '#fff', position: 'sticky', left: visibleColumns.paterno ? maternoLeft : 0, zIndex: 6, fontWeight: 'bold' }}>{row.materno}</TableCell>}
                                            {visibleColumns.nombre && <TableCell style={{ backgroundColor: '#fff', borderRight: '2px solid #ddd' }}>{row.nombre}</TableCell>}
                                            {structure.map((group, groupIndex) => {
                                                const visibleSubs = group.sub_criteria.filter(sub => sub.visible);
                                                const visibleSpecials = (group.special_criteria || []).filter(spec => spec.visible);
                                                const bgColor = groupIndex % 2 === 0 ? '#bbdefb' : '#e1bee7';

                                                const criterionData = row._criterionGrades[group.id] || { formatted: '-', grade: 0 };

                                                return (
                                                    <React.Fragment key={group.id}>
                                                        {visibleSubs.map((sub, sIdx) => {
                                                            const isLast = sIdx === visibleSubs.length - 1 && visibleSpecials.length === 0 && !showCriterionGrades;
                                                            return (
                                                                <TableCell
                                                                    key={sub.id}
                                                                    align="center"
                                                                    style={{
                                                                        borderLeft: 'none',
                                                                        borderRight: isLast ? '2px solid #aaa' : '1px solid #ddd',
                                                                        backgroundColor: sub.editable ? 'inherit' : '#f5f5f5'
                                                                    }}
                                                                >
                                                                    {sub.has_tasks || sub.has_projects ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <Typography variant="body2" style={{ marginRight: 8, fontWeight: 'bold' }}>
                                                                                {row.grades[sub.id] !== undefined && row.grades[sub.id] !== null ? parseFloat(row.grades[sub.id]).toFixed(2) : '-'}
                                                                            </Typography>
                                                                            {sub.has_tasks ? (
                                                                                <Tooltip title="Ver Tareas">
                                                                                    <IconButton
                                                                                        onClick={() => handleOpenTaskModal(row, sub.id)}
                                                                                        size="small"
                                                                                        color="primary"
                                                                                    >
                                                                                        <IconEye size="1.2rem" />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            ) : sub.has_projects ? (
                                                                                (() => {
                                                                                    const project = projects.find(p => p.sub_criterion === sub.id && p.members.includes(row.enrollment_id));
                                                                                    return (
                                                                                        <Tooltip title={project ? `Gestionar Proyecto: ${project.name}` : "Estudiante sin proyecto asignado"}>
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                onClick={() => project ? handleManageProject(project) : null}
                                                                                                style={{ color: project ? undefined : '#ccc' }}
                                                                                                color={project ? "secondary" : "default"}
                                                                                            >
                                                                                                <IconNotebook size="1.2rem" />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    );
                                                                                })()
                                                                            ) : null}
                                                                        </div>
                                                                    ) : sub.editable ? (
                                                                        <TextField
                                                                            type="number"
                                                                            value={row.grades[sub.id] || ''}
                                                                            onChange={(e) => {
                                                                                let val = e.target.value;
                                                                                if (val !== '') {
                                                                                    const numVal = parseFloat(val);
                                                                                    if (numVal > sub.percentage) {
                                                                                        // Strict enforcement: Don't allow typing more
                                                                                        return;
                                                                                        // OR cap it? User said "No debes dejar poner". 
                                                                                        // Blocking the input is safer.
                                                                                    }
                                                                                    if (numVal < 0) return;
                                                                                }
                                                                                handleScoreChange(row.enrollment_id, sub.id, val);
                                                                            }}
                                                                            variant="outlined"
                                                                            size="small"
                                                                            style={{ width: 80 }}
                                                                            inputProps={{ min: 0, max: sub.percentage, step: "0.01", style: { textAlign: 'center' } }}
                                                                        />
                                                                    ) : (
                                                                        <Typography variant="body2" color="textSecondary" style={{ fontWeight: 500 }}>
                                                                            {row.grades[sub.id] !== undefined && row.grades[sub.id] !== null ? parseFloat(row.grades[sub.id]).toFixed(2) : '-'}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                            );
                                                        })}
                                                        {visibleSpecials.map((spec, specIdx) => {
                                                            const isLast = specIdx === visibleSpecials.length - 1 && !showCriterionGrades;
                                                            return (
                                                                <TableCell
                                                                    key={spec.id}
                                                                    align="center"
                                                                    style={{
                                                                        borderLeft: 'none',
                                                                        borderRight: isLast ? '2px solid #aaa' : '1px solid #ddd',
                                                                        backgroundColor: '#fff3e0'
                                                                    }}
                                                                >
                                                                    {spec.has_tasks ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <Typography variant="body2" style={{ marginRight: 8, color: '#e65100', fontWeight: 'bold' }}>
                                                                                {row.grades[spec.id] !== undefined && row.grades[spec.id] !== null ? `+${parseFloat(row.grades[spec.id]).toFixed(2)}` : '-'}
                                                                            </Typography>
                                                                            <Tooltip title="Ver Tareas Extra">
                                                                                <IconButton
                                                                                    onClick={() => handleOpenTaskModal(row, `special-${spec.id}`)}
                                                                                    size="small"
                                                                                    style={{ color: '#e65100' }}
                                                                                >
                                                                                    <IconEye size="1.2rem" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </div>
                                                                    ) : (
                                                                        <TextField
                                                                            type="number"
                                                                            value={row.grades[spec.id] || ''}
                                                                            onChange={(e) => {
                                                                                let val = e.target.value;
                                                                                if (val !== '') {
                                                                                    const numVal = parseFloat(val);
                                                                                    if (numVal > spec.percentage) return; // Strict enforcement
                                                                                    if (numVal < 0) return;
                                                                                }
                                                                                handleScoreChange(row.enrollment_id, spec.id, val);
                                                                            }}
                                                                            variant="outlined"
                                                                            size="small"
                                                                            style={{ width: 80 }}
                                                                            inputProps={{ min: 0, max: spec.percentage, step: "0.01", style: { textAlign: 'center', color: '#e65100' } }}
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                            );
                                                        })}
                                                        {/* Criterion Grade Column */}
                                                        {showCriterionGrades && (
                                                            <TableCell align="center" style={{ backgroundColor: bgColor, fontWeight: 'bold', borderRight: '2px solid #aaa', borderLeft: 'none' }}>
                                                                <Typography variant="body2" style={{ fontWeight: 'bold', color: '#1565c0' }}>
                                                                    {criterionData.formatted}
                                                                </Typography>
                                                            </TableCell>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                            {showFinalGrade && (
                                                <TableCell align="center" style={{ backgroundColor: '#c8e6c9', fontWeight: 'bold', borderLeft: '3px solid #4caf50', color: '#2e7d32' }}>
                                                    {row._finalGrade}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table >
                    </TableContainer >
                    <TablePagination
                        component="div"
                        count={totalCount}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={handlePageSizeChange}
                        rowsPerPageOptions={[15, 30, 50, 100]}
                        labelRowsPerPage="Estudiantes por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    />
                    </>
                )}

                {/* Mobile View */}
                {isMobile && (
                    <>
                    <List>
                        {filteredRows.map((row) => {
                            return (
                                <Accordion key={row.enrollment_id}>
                                    <AccordionSummary expandIcon={<IconChevronDown />}>
                                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                                                {row.paterno} {row.materno} {row.nombre}
                                            </Typography>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                <Typography variant="body2" color="textSecondary">CI: {row.ci}</Typography>
                                                {showFinalGrade && (
                                                    <Typography variant="body2" style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                        Nota Final: {row._finalGrade}
                                                    </Typography>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionSummary>
                                    <AccordionDetails style={{ flexDirection: 'column', padding: '0 16px 16px' }}>
                                        {structure.map((group) => {
                                            const visibleSubs = group.sub_criteria.filter(s => s.visible);
                                            const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);
                                            const totalVisible = visibleSubs.length + visibleSpecials.length;

                                            if (totalVisible === 0 && !showCriterionGrades) return null;

                                            return (
                                                <div key={group.id} style={{ marginBottom: 16 }}>
                                                    <Typography variant="subtitle2" style={{ backgroundColor: '#e3f2fd', padding: '4px 8px', borderRadius: 4, marginBottom: 8 }}>
                                                        {group.name} ({group.weight}%)
                                                    </Typography>
                                                    {visibleSubs.map(sub => (
                                                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 8 }}>
                                                            <Typography variant="body2" style={{ flex: 1 }}>{sub.name} ({sub.percentage}%)</Typography>
                                                            <div style={{ width: 100 }}>
                                                                {sub.has_tasks || sub.has_projects ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                        <Typography variant="body2" style={{ marginRight: 8, fontWeight: 'bold' }}>
                                                                            {row.grades[sub.id] !== undefined && row.grades[sub.id] !== null ? parseFloat(row.grades[sub.id]).toFixed(2) : '-'}
                                                                        </Typography>
                                                                        {sub.has_tasks ? (
                                                                            <IconButton onClick={() => handleOpenTaskModal(row, sub.id)} size="small" color="primary">
                                                                                <IconEye size="1.2rem" />
                                                                            </IconButton>
                                                                        ) : sub.has_projects ? (
                                                                            (() => {
                                                                                const project = projects.find(p => p.sub_criterion === sub.id && p.members.includes(row.enrollment_id));
                                                                                return (
                                                                                    <IconButton size="small" onClick={() => project ? handleManageProject(project) : null} color={project ? "secondary" : "default"}>
                                                                                        <IconNotebook size="1.2rem" />
                                                                                    </IconButton>
                                                                                );
                                                                            })()
                                                                        ) : null}
                                                                    </div>
                                                                ) : sub.editable ? (
                                                                    <TextField
                                                                        type="number"
                                                                        value={row.grades[sub.id] || ''}
                                                                        onChange={(e) => {
                                                                            let val = e.target.value;
                                                                            if (val !== '') {
                                                                                const numVal = parseFloat(val);
                                                                                if (numVal > sub.percentage) return;
                                                                                if (numVal < 0) return;
                                                                            }
                                                                            handleScoreChange(row.enrollment_id, sub.id, val);
                                                                        }}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        fullWidth
                                                                        inputProps={{ min: 0, max: sub.percentage, step: "0.01", style: { textAlign: 'center' } }}
                                                                    />
                                                                ) : (
                                                                    <Typography variant="body2" align="right">
                                                                        {row.grades[sub.id] !== undefined && row.grades[sub.id] !== null ? parseFloat(row.grades[sub.id]).toFixed(2) : '-'}
                                                                    </Typography>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {visibleSpecials.map(spec => (
                                                        <div key={spec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 8, backgroundColor: '#fff3e0', padding: 4, borderRadius: 4 }}>
                                                            <Typography variant="body2" style={{ flex: 1, color: '#e65100' }}>⭐ {spec.name} (+{spec.percentage})</Typography>
                                                            <div style={{ width: 100 }}>
                                                                {spec.has_tasks ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                        <Typography variant="body2" style={{ marginRight: 8, color: '#e65100', fontWeight: 'bold' }}>
                                                                            {row.grades[spec.id] !== undefined && row.grades[spec.id] !== null ? `+${parseFloat(row.grades[spec.id]).toFixed(2)}` : '-'}
                                                                        </Typography>
                                                                        <IconButton onClick={() => handleOpenTaskModal(row, `special-${spec.id}`)} size="small" style={{ color: '#e65100' }}>
                                                                            <IconEye size="1.2rem" />
                                                                        </IconButton>
                                                                    </div>
                                                                ) : (
                                                                    <TextField
                                                                        type="number"
                                                                        value={row.grades[spec.id] || ''}
                                                                        onChange={(e) => {
                                                                            let val = e.target.value;
                                                                            if (val !== '') {
                                                                                const numVal = parseFloat(val);
                                                                                if (numVal > spec.percentage) return;
                                                                                if (numVal < 0) return;
                                                                            }
                                                                            handleScoreChange(row.enrollment_id, spec.id, val);
                                                                        }}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        fullWidth
                                                                        inputProps={{ min: 0, max: spec.percentage, step: "0.01", style: { textAlign: 'center', color: '#e65100' } }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </List>
                    <TablePagination
                        component="div"
                        count={totalCount}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={handlePageSizeChange}
                        rowsPerPageOptions={[15, 30, 50]}
                        labelRowsPerPage="Por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    />
                    </>
                )}            </CardContent >
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
            <ManageProjectDialog
                open={manageDialogOpen}
                onClose={() => setManageDialogOpen(false)}
                project={currentProject}
                enrollments={allEnrollments.map(r => ({
                    id: r.id,
                    student_details: {
                        first_name: r.student_details?.first_name || r.student?.first_name || '',
                        paternal_surname: r.student_details?.paternal_surname || r.student?.paternal_surname || '',
                        maternal_surname: r.student_details?.maternal_surname || r.student?.maternal_surname || ''
                    }
                }))}
                unavailableStudentIds={currentProject ? getUnavailableStudentIds(currentProject.sub_criterion, currentProject.id) : []}
                onSave={handleSaveProject}
            />
            <StudentTaskModal
                open={taskModalOpen}
                onClose={handleCloseTaskModal}
                courseId={activeCourse?.id}
                subCriterionId={taskModalSubCrit}
                studentRow={taskModalStudent}
            />
            <StudentDetailModal
                open={detailModalOpen}
                onClose={handleCloseDetailModal}
                studentRow={detailModalRow}
                structure={structure}
                projects={projects}
                activeCourse={activeCourse}
                onManageProject={(project, group) => {
                    let maxScore = 100;
                    if (group) {
                        const sub = group.sub_criteria.find(s => s.id === project.sub_criterion);
                        if (sub) maxScore = sub.percentage;
                    }
                    setCurrentProject({ ...project, maxScore });
                    setManageDialogOpen(true);
                }}
            />
            <GradeSettingsDialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                structure={structure}
                onRefresh={fetchGradesheet}
                showCriterionGrades={showCriterionGrades}
                setShowCriterionGrades={setShowCriterionGrades}
                showFinalGrade={showFinalGrade}
                setShowFinalGrade={setShowFinalGrade}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
            />
        </MainCard >
    );
};

export default Grades;
