import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, TextField, Alert, Snackbar, Divider, InputAdornment, TablePagination,
    Dialog, DialogTitle, DialogContent, DialogActions, Box, List, ListItem, ListItemText, ListItemSecondaryAction,
    Checkbox, Tooltip
} from '@mui/material';
import { Autocomplete } from '@mui/material'; // Standard Material UI Autocomplete
import MainCard from '../../../ui-component/cards/MainCard';
import { IconTrash, IconUserPlus, IconUpload, IconUsers, IconPencil, IconSearch, IconDownload } from '@tabler/icons-react';
import { Chip, CircularProgress as MuiCircularProgress } from '@mui/material';
import * as XLSX from 'xlsx';
import axios from 'axios';
import configData from '../../../config';
import CourseRequestsDialog from './CourseRequestsDialog';

const Enrollments = () => {
    // const theme = useTheme(); // Unused
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);

    const [enrollments, setEnrollments] = useState([]);

    // Autocomplete State
    const [studentOptions, setStudentOptions] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [inputValue, setInputValue] = useState('');

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Preview State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState({ found: [], not_found: [] });

    // Requests Dialog State
    const [openRequestsDialog, setOpenRequestsDialog] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Enrollment modal
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [enrollTab, setEnrollTab] = useState(0); // 0 = search existing, 1 = new
    const [newStudentForm, setNewStudentForm] = useState({ ci_number: '', first_name: '', paternal_surname: '', maternal_surname: '', email: '', phone: '' });
    const [enrollNewLoading, setEnrollNewLoading] = useState(false);

    // Table search + pagination
    const [tableSearch, setTableSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Multi-select for bulk delete
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

    // Edit student dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm, setEditForm] = useState({ ci_number: '', first_name: '', paternal_surname: '', maternal_surname: '', email: '' });

    const fetchPendingRequests = () => {
        if (!activeCourse) return;
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(`${configData.API_SERVER}registration-requests/`, {
            params: {
                course_id: activeCourse.id,
                status: 'PENDING'
            }
        })
            .then(response => {
                // Assuming response.data is an array based on CourseRequestsDialog usage
                const data = response.data.results || response.data;
                setPendingCount(data.length);
            })
            .catch(error => console.error("Error fetching pending requests:", error));
    };

    const fetchEnrollments = () => {
        if (!activeCourse) return;
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(`${configData.API_SERVER}enrollments/?course=${activeCourse.id}`)
            .then(response => {
                setEnrollments(response.data);
            })
            .catch(error => {
                console.error("Error fetching enrollments:", error);
            });
    };

    useEffect(() => {
        if (activeCourse) {
            fetchEnrollments();
            fetchPendingRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCourse]);

    // Handle Student Search
    useEffect(() => {
        let active = true;

        if (inputValue === '') {
            setStudentOptions(selectedStudent ? [selectedStudent] : []);
            return undefined;
        }

        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(`${configData.API_SERVER}manage-users/?role=STUDENT&search=${inputValue}`)
            .then(response => {
                if (active) {
                    setStudentOptions(response.data.results || response.data);
                }
            })
            .catch(err => console.error(err));

        return () => {
            active = false;
        };
    }, [inputValue, account.token, selectedStudent]);

    const handleEnroll = () => {
        if (!selectedStudent) return;

        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.post(`${configData.API_SERVER}enrollments/`, {
            student: selectedStudent.id,
            course: activeCourse.id
        })
            .then(() => {
                setSnackbar({ open: true, message: 'Estudiante inscrito correctamente', severity: 'success' });
                fetchEnrollments();
                setSelectedStudent(null);
            })
            .catch(err => {
                const msg = err.response?.data?.non_field_errors?.[0] || "Error al inscribir. Posiblemente ya está inscrito.";
                setSnackbar({ open: true, message: msg, severity: 'error' });
            });
    };

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [enrollmentToDelete, setEnrollmentToDelete] = useState(null);

    const handleDelete = (id) => {
        setEnrollmentToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (!enrollmentToDelete) return;

        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.delete(`${configData.API_SERVER}enrollments/${enrollmentToDelete}/`)
            .then(() => {
                setSnackbar({ open: true, message: 'Inscripción eliminada', severity: 'success' });
                fetchEnrollments();
                setOpenDeleteDialog(false);
                setEnrollmentToDelete(null);
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error al eliminar inscripción', severity: 'error' });
            });
    };

    const handleOpenEdit = (enrollment) => {
        const s = enrollment.student_details || {};
        setEditStudent(enrollment);
        setEditForm({
            ci_number: s.ci_number || '',
            first_name: s.first_name || '',
            paternal_surname: s.paternal_surname || '',
            maternal_surname: s.maternal_surname || '',
            email: s.email || ''
        });
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editStudent) return;
        setEditLoading(true);
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.patch(`${configData.API_SERVER}manage-users/${editStudent.student_details?.id}/`, editForm)
            .then(() => {
                setSnackbar({ open: true, message: 'Estudiante actualizado correctamente', severity: 'success' });
                fetchEnrollments();
                setEditDialogOpen(false);
            })
            .catch(() => {
                setSnackbar({ open: true, message: 'Error al actualizar estudiante', severity: 'error' });
            })
            .finally(() => setEditLoading(false));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadLoading(true);
        setSnackbar({ open: true, message: 'Analizando archivo Excel y buscando estudiantes, esto puede demorar. Por favor espere...', severity: 'info' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('course_id', activeCourse.id);

        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.post(`${configData.API_SERVER}enrollments/preview_bulk_upload/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(response => {
                setPreviewData(response.data);
                setPreviewOpen(true);
                setSnackbar({ open: true, message: 'Archivo procesado. Por favor revise y confirme la carga.', severity: 'success' });
                event.target.value = null; // Reset input
            })
            .catch(err => {
                setSnackbar({ open: true, message: 'Error al analizar archivo', severity: 'error' });
                event.target.value = null;
            })
            .finally(() => {
                setUploadLoading(false);
            });
    };

    const handleConfirmEnrollment = () => {
        // IDs of existing students found
        const existingStudentIds = previewData.found.filter(s => !s.is_enrolled).map(s => s.id);
        const studentsToCreate = previewData.to_create || [];

        if (existingStudentIds.length === 0 && studentsToCreate.length === 0) {
            setSnackbar({ open: true, message: 'No hay estudiantes nuevos para inscribir', severity: 'info' });
            setPreviewOpen(false);
            return;
        }

        setConfirmLoading(true);
        setSnackbar({ open: true, message: 'Procesando inscripciones, esto puede demorar varios minutos. Por favor espere...', severity: 'info' });

        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.post(`${configData.API_SERVER}enrollments/confirm_bulk_enrollment/`, {
            course_id: activeCourse.id,
            student_ids: existingStudentIds,
            students_to_create: studentsToCreate
        })
            .then(response => {
                const { enrolled_count, created_users_count } = response.data;
                setSnackbar({
                    open: true,
                    message: `Proceso finalizado. Creados: ${created_users_count || 0}. Inscritos: ${enrolled_count}`,
                    severity: 'success'
                });
                setPreviewOpen(false);
                fetchEnrollments();
            })
            .catch(err => {
                setSnackbar({ open: true, message: 'Error al confirmar inscripción', severity: 'error' });
            })
            .finally(() => {
                setConfirmLoading(false);
            });
    };

    const handleCheckSingleCI = (ci, index) => {
        if (!ci) return;
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

        // 1. Search User
        axios.get(`${configData.API_SERVER}manage-users/?role=STUDENT&search=${ci}`)
            .then(response => {
                const results = response.data.results || response.data;
                const student = results.find(s => s.ci_number === ci); // Strict check

                if (student) {
                    // 2. Check Enrollment Status
                    axios.get(`${configData.API_SERVER}enrollments/?student=${student.id}&course=${activeCourse.id}`)
                        .then(enrollResponse => {
                            const isEnrolled = enrollResponse.data.length > 0;

                            const newStudent = {
                                ...student,
                                is_enrolled: isEnrolled
                            };

                            // Move to found
                            setPreviewData(prev => ({
                                ...prev,
                                found: [...prev.found, newStudent],
                                not_found: prev.not_found.filter((_, i) => i !== index)
                            }));
                            setSnackbar({ open: true, message: 'Estudiante encontrado', severity: 'success' });
                        })
                        .finally(() => { });
                } else {
                    setSnackbar({ open: true, message: 'Estudiante no encontrado con ese CI', severity: 'warning' });
                }
            })
            .catch(err => {
                console.error(err);
                setSnackbar({ open: true, message: 'Error al buscar estudiante', severity: 'error' });
            });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        setBulkDeleteLoading(true);
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        const promises = Array.from(selectedIds).map(id =>
            axios.delete(`${configData.API_SERVER}enrollments/${id}/`)
        );
        Promise.allSettled(promises).then(results => {
            const failed = results.filter(r => r.status === 'rejected').length;
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            setSnackbar({
                open: true,
                message: failed > 0
                    ? `${succeeded} eliminados, ${failed} con error`
                    : `${succeeded} inscripciones eliminadas correctamente`,
                severity: failed > 0 ? 'warning' : 'success'
            });
            setSelectedIds(new Set());
            setBulkDeleteOpen(false);
            fetchEnrollments();
        }).finally(() => setBulkDeleteLoading(false));
    };

    const handleDownloadTemplate = () => {
        const data = [
            { CI: '12345678', Paterno: 'Gomez', Materno: 'Lopez', Nombre: 'Juan', Email: 'juan@example.com', Celular: '70000001' },
            { CI: '87654321', Paterno: 'Quispe', Materno: 'Mamani', Nombre: 'Maria', Email: 'maria@example.com', Celular: '70000002' },
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
        XLSX.writeFile(wb, 'plantilla_inscripciones.xlsx');
    };

    if (!activeCourse) {
        return (
            <MainCard title="Inscripciones">
                <Typography variant="h6" align="center">
                    Seleccione un curso para ver las inscripciones.
                </Typography>
            </MainCard>
        );
    }

    return (
        <MainCard title={`Inscripciones - ${activeCourse.subject_details?.name} (${activeCourse.parallel})`}>
            {/* Enrollment Toolbar */}
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 24 }}>
                <Grid style={{ minWidth: 280 }}>
                    <TextField
                        id="table-student-search"
                        label="Buscar en el paralelo"
                        variant="outlined"
                        fullWidth
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                    />
                </Grid>
                <Grid>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<IconUserPlus />}
                        onClick={() => setEnrollModalOpen(true)}
                    >
                        Nueva Inscripción
                    </Button>
                </Grid>
                <Grid>
                    <input
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        style={{ display: 'none' }}
                        id="raised-button-file"
                        type="file"
                        onChange={handleFileUpload}
                    />
                    <label htmlFor="raised-button-file">
                        <Button variant="outlined" component="span" startIcon={<IconUpload />} disabled={uploadLoading}>
                            {uploadLoading ? 'Cargando...' : 'Subir Excel'}
                        </Button>
                    </label>
                </Grid>
                <Grid>
                    <Tooltip title="Descargar plantilla de ejemplo para el Excel">
                        <Button variant="outlined" color="inherit" startIcon={<IconDownload />} onClick={handleDownloadTemplate}>
                            Plantilla Excel
                        </Button>
                    </Tooltip>
                </Grid>
                {selectedIds.size > 0 && (
                    <Grid>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<IconTrash />}
                            onClick={() => setBulkDeleteOpen(true)}
                        >
                            Eliminar seleccionados ({selectedIds.size})
                        </Button>
                    </Grid>
                )}
                {(activeCourse?.is_registration_open === true || pendingCount > 0) && (
                    <Grid>
                        <Button
                            variant="contained"
                            startIcon={<IconUsers />}
                            onClick={() => setOpenRequestsDialog(true)}
                            style={{ backgroundColor: '#e0e0e0', color: '#333' }}
                        >
                            Aceptar Inscripciones {pendingCount > 0 ? `(${pendingCount})` : ''}
                        </Button>
                    </Grid>
                )}
            </Grid>
            <Divider style={{ marginBottom: 16 }} />
            {/* Student Count */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                    icon={<IconUsers size="1rem" />}
                    label={`${enrollments.length} estudiante${enrollments.length !== 1 ? 's' : ''} inscritos`}
                    color={enrollments.length > 0 ? 'secondary' : 'default'}
                    variant="outlined"
                    size="small"
                />
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedIds.size > 0 && selectedIds.size < enrollments.filter(e => {
                                        if (!tableSearch) return true;
                                        const q = tableSearch.toLowerCase();
                                        const s = e.student_details || {};
                                        return (s.ci_number||'').toLowerCase().includes(q)||(s.paternal_surname||'').toLowerCase().includes(q)||(s.maternal_surname||'').toLowerCase().includes(q)||(s.first_name||'').toLowerCase().includes(q)||(s.email||'').toLowerCase().includes(q);
                                    }).length}
                                    checked={enrollments.length > 0 && selectedIds.size === enrollments.filter(e => {
                                        if (!tableSearch) return true;
                                        const q = tableSearch.toLowerCase();
                                        const s = e.student_details || {};
                                        return (s.ci_number||'').toLowerCase().includes(q)||(s.paternal_surname||'').toLowerCase().includes(q)||(s.maternal_surname||'').toLowerCase().includes(q)||(s.first_name||'').toLowerCase().includes(q)||(s.email||'').toLowerCase().includes(q);
                                    }).length}
                                    onChange={(e) => {
                                        const filtered = enrollments.filter(en => {
                                            if (!tableSearch) return true;
                                            const q = tableSearch.toLowerCase();
                                            const s = en.student_details || {};
                                            return (s.ci_number||'').toLowerCase().includes(q)||(s.paternal_surname||'').toLowerCase().includes(q)||(s.maternal_surname||'').toLowerCase().includes(q)||(s.first_name||'').toLowerCase().includes(q)||(s.email||'').toLowerCase().includes(q);
                                        });
                                        if (e.target.checked) {
                                            setSelectedIds(new Set(filtered.map(en => en.id)));
                                        } else {
                                            setSelectedIds(new Set());
                                        }
                                    }}
                                />
                            </TableCell>
                            <TableCell width={40}>#</TableCell>
                            <TableCell>CI</TableCell>
                            <TableCell>Paterno</TableCell>
                            <TableCell>Materno</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell align="right">Fecha Inscripción</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {enrollments.filter(e => {
                            if (!tableSearch) return true;
                            const q = tableSearch.toLowerCase();
                            const s = e.student_details || {};
                            return (
                                (s.ci_number || '').toLowerCase().includes(q) ||
                                (s.paternal_surname || '').toLowerCase().includes(q) ||
                                (s.maternal_surname || '').toLowerCase().includes(q) ||
                                (s.first_name || '').toLowerCase().includes(q) ||
                                (s.email || '').toLowerCase().includes(q)
                            );
                        }).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">No se encontraron estudiantes{tableSearch ? ` para "${tableSearch}"` : ''}.</TableCell>
                            </TableRow>
                        ) : (
                            enrollments.filter(e => {
                                if (!tableSearch) return true;
                                const q = tableSearch.toLowerCase();
                                const s = e.student_details || {};
                                return (
                                    (s.ci_number || '').toLowerCase().includes(q) ||
                                    (s.paternal_surname || '').toLowerCase().includes(q) ||
                                    (s.maternal_surname || '').toLowerCase().includes(q) ||
                                    (s.first_name || '').toLowerCase().includes(q) ||
                                    (s.email || '').toLowerCase().includes(q)
                                );
                            }).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enrollment, index) => (
                                <TableRow
                                    key={enrollment.id}
                                    selected={selectedIds.has(enrollment.id)}
                                    sx={{ '&.Mui-selected': { backgroundColor: 'action.selected' } }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedIds.has(enrollment.id)}
                                            onChange={(e) => {
                                                const next = new Set(selectedIds);
                                                if (e.target.checked) next.add(enrollment.id);
                                                else next.delete(enrollment.id);
                                                setSelectedIds(next);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>{enrollment.student_details?.ci_number || 'N/A'}</TableCell>
                                    <TableCell>{enrollment.student_details?.paternal_surname}</TableCell>
                                    <TableCell>{enrollment.student_details?.maternal_surname}</TableCell>
                                    <TableCell>{enrollment.student_details?.first_name}</TableCell>
                                    <TableCell>{enrollment.student_details?.email}</TableCell>
                                    <TableCell align="right">{enrollment.date_enrolled}</TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(enrollment)} title="Editar estudiante">
                                            <IconPencil size="1.1rem" />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(enrollment.id)} title="Eliminar inscripción">
                                            <IconTrash size="1.1rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={enrollments.filter(e => {
                    if (!tableSearch) return true;
                    const q = tableSearch.toLowerCase();
                    const s = e.student_details || {};
                    return (
                        (s.ci_number || '').toLowerCase().includes(q) ||
                        (s.paternal_surname || '').toLowerCase().includes(q) ||
                        (s.maternal_surname || '').toLowerCase().includes(q) ||
                        (s.first_name || '').toLowerCase().includes(q) ||
                        (s.email || '').toLowerCase().includes(q)
                    );
                }).length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                labelRowsPerPage="Filas por página:"
            />
            {/* ENROLL MODAL */}
            <Dialog open={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Nueva Inscripción</DialogTitle>
                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                size="small"
                                variant={enrollTab === 0 ? 'contained' : 'outlined'}
                                color="primary"
                                onClick={() => setEnrollTab(0)}
                            >
                                Buscar Estudiante Existente
                            </Button>
                            <Button
                                size="small"
                                variant={enrollTab === 1 ? 'contained' : 'outlined'}
                                color="primary"
                                onClick={() => setEnrollTab(1)}
                            >
                                Nuevo Estudiante
                            </Button>
                        </Box>
                    </Box>

                    {enrollTab === 0 ? (
                        <Box sx={{ pt: 1 }}>
                            <Autocomplete
                                id="student-select"
                                options={studentOptions}
                                getOptionLabel={(option) => `${option.paternal_surname || ''} ${option.maternal_surname || ''} ${option.first_name || ''} (${option.ci_number})`}
                                filterOptions={(x) => x}
                                value={selectedStudent}
                                onChange={(event, newValue) => setSelectedStudent(newValue)}
                                onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Buscar por apellidos o CI"
                                        variant="outlined"
                                        fullWidth
                                    />
                                )}
                            />
                            {selectedStudent && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Typography variant="body2"><strong>CI:</strong> {selectedStudent.ci_number}</Typography>
                                    <Typography variant="body2"><strong>Nombre:</strong> {selectedStudent.paternal_surname} {selectedStudent.maternal_surname} {selectedStudent.first_name}</Typography>
                                    <Typography variant="body2"><strong>Email:</strong> {selectedStudent.email}</Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField label="CI" value={newStudentForm.ci_number} onChange={(e) => setNewStudentForm({ ...newStudentForm, ci_number: e.target.value })} variant="outlined" fullWidth />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField label="Nombre" value={newStudentForm.first_name} onChange={(e) => setNewStudentForm({ ...newStudentForm, first_name: e.target.value })} variant="outlined" fullWidth />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField label="Apellido Paterno" value={newStudentForm.paternal_surname} onChange={(e) => setNewStudentForm({ ...newStudentForm, paternal_surname: e.target.value })} variant="outlined" fullWidth />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField label="Apellido Materno" value={newStudentForm.maternal_surname} onChange={(e) => setNewStudentForm({ ...newStudentForm, maternal_surname: e.target.value })} variant="outlined" fullWidth />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField label="Email" type="email" value={newStudentForm.email} onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })} variant="outlined" fullWidth />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField label="Teléfono" value={newStudentForm.phone} onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })} variant="outlined" fullWidth />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setEnrollModalOpen(false); setSelectedStudent(null); }} color="primary">
                        Cancelar
                    </Button>
                    {enrollTab === 0 ? (
                        <Button
                            onClick={() => {
                                handleEnroll();
                                setEnrollModalOpen(false);
                            }}
                            color="secondary"
                            variant="contained"
                            disabled={!selectedStudent}
                        >
                            Inscribir
                        </Button>
                    ) : (
                        <Button
                            color="secondary"
                            variant="contained"
                            disabled={enrollNewLoading || !newStudentForm.ci_number}
                            onClick={() => {
                                setEnrollNewLoading(true);
                                axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
                                axios.post(`${configData.API_SERVER}enrollments/confirm_bulk_enrollment/`, {
                                    course_id: activeCourse.id,
                                    student_ids: [],
                                    students_to_create: [newStudentForm]
                                })
                                    .then(() => {
                                        setSnackbar({ open: true, message: 'Estudiante creado e inscrito correctamente', severity: 'success' });
                                        fetchEnrollments();
                                        setEnrollModalOpen(false);
                                        setNewStudentForm({ ci_number: '', first_name: '', paternal_surname: '', maternal_surname: '', email: '', phone: '' });
                                    })
                                    .catch(() => setSnackbar({ open: true, message: 'Error al crear e inscribir estudiante', severity: 'error' }))
                                    .finally(() => setEnrollNewLoading(false));
                            }}
                        >
                            {enrollNewLoading ? 'Guardando...' : 'Crear e Inscribir'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            {/* PREVIEW DIALOG */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Vista Previa de Carga Masiva</DialogTitle>
                <DialogContent>

                    {/* SECTION 1: EXISTING STUDENTS FOUND */}
                    <Box mb={4}>
                        <Typography variant="h4" gutterBottom>
                            Estudiantes Existentes ({previewData.found ? previewData.found.length : 0})
                        </Typography>
                        {(previewData.found && previewData.found.length > 0) ? (
                            <TableContainer style={{ maxHeight: 200, marginBottom: 20 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Estado</TableCell>
                                            <TableCell>CI</TableCell>
                                            <TableCell>Paterno</TableCell>
                                            <TableCell>Materno</TableCell>
                                            <TableCell>Nombre</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewData.found.map((s) => (
                                            <TableRow key={s.ci_number} style={{ backgroundColor: s.is_enrolled ? '#e0e0e0' : '#e8f5e9' }}>
                                                <TableCell>
                                                    {s.is_enrolled ? (
                                                        <Typography color="textSecondary" variant="caption">Ya Inscrito</Typography>
                                                    ) : (
                                                        <Typography color="primary" variant="caption" style={{ fontWeight: 'bold' }}>Se Inscribirá</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>{s.ci_number}</TableCell>
                                                <TableCell>{s.paternal_surname}</TableCell>
                                                <TableCell>{s.maternal_surname}</TableCell>
                                                <TableCell>{s.first_name}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography color="textSecondary" variant="body2">No se encontraron estudiantes ya registrados en el sistema.</Typography>
                        )}
                    </Box>

                    {/* SECTION 2: NEW STUDENTS TO CREATE */}
                    <Box mb={4}>
                        <Typography variant="h4" color="secondary" gutterBottom>
                            Nuevos Estudiantes a Crear ({previewData.to_create ? previewData.to_create.length : 0})
                        </Typography>
                        <Typography variant="caption" display="block" gutterBottom>
                            Estos estudiantes NO existen en el sistema. Se crearán automáticamente y luego se inscribirán.
                        </Typography>

                        {(previewData.to_create && previewData.to_create.length > 0) ? (
                            <TableContainer style={{ maxHeight: 200 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>CI</TableCell>
                                            <TableCell>Paterno</TableCell>
                                            <TableCell>Materno</TableCell>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Celular</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewData.to_create.map((s, idx) => (
                                            <TableRow key={idx} style={{ backgroundColor: '#fff3e0' }}>
                                                <TableCell>{s.ci_number}</TableCell>
                                                <TableCell>{s.paternal_surname}</TableCell>
                                                <TableCell>{s.maternal_surname}</TableCell>
                                                <TableCell>{s.first_name}</TableCell>
                                                <TableCell>{s.email}</TableCell>
                                                <TableCell>{s.phone}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography color="textSecondary" variant="body2">No hay nuevos estudiantes para crear.</Typography>
                        )}
                    </Box>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)} color="primary" disabled={confirmLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmEnrollment}
                        color="secondary"
                        variant="contained"
                        disabled={
                            confirmLoading ||
                            ((!previewData.found || previewData.found.length === 0) &&
                            (!previewData.to_create || previewData.to_create.length === 0))
                        }
                    >
                        {confirmLoading ? 'Procesando...' : 'Confirmar y Procesar'}
                    </Button>
                </DialogActions>
            </Dialog>
            <CourseRequestsDialog
                open={openRequestsDialog}
                handleClose={() => setOpenRequestsDialog(false)}
                course={activeCourse}
                onUpdate={() => {
                    fetchEnrollments();
                    fetchPendingRequests();
                }}
            />
            {/* EDIT STUDENT DIALOG */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Estudiante</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} style={{ marginTop: 4 }}>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <TextField
                                label="CI"
                                value={editForm.ci_number}
                                onChange={(e) => setEditForm({ ...editForm, ci_number: e.target.value })}
                                variant="outlined"
                                fullWidth
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <TextField
                                label="Nombre"
                                value={editForm.first_name}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                variant="outlined"
                                fullWidth
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <TextField
                                label="Apellido Paterno"
                                value={editForm.paternal_surname}
                                onChange={(e) => setEditForm({ ...editForm, paternal_surname: e.target.value })}
                                variant="outlined"
                                fullWidth
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <TextField
                                label="Apellido Materno"
                                value={editForm.maternal_surname}
                                onChange={(e) => setEditForm({ ...editForm, maternal_surname: e.target.value })}
                                variant="outlined"
                                fullWidth
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                variant="outlined"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} color="primary" disabled={editLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} color="secondary" variant="contained" disabled={editLoading}>
                        {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Está seguro que desea eliminar a este estudiante del curso?
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Esta acción removerá la inscripción y todas las calificaciones asociadas.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} color="secondary" variant="contained" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* BULK DELETE DIALOG */}
            <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
                <DialogTitle>Confirmar Eliminación Masiva</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Está seguro que desea eliminar <strong>{selectedIds.size}</strong> inscripciones seleccionadas?
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Esta acción removerá las inscripciones y todas las calificaciones asociadas.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDeleteOpen(false)} color="primary" disabled={bulkDeleteLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleBulkDelete} color="error" variant="contained" disabled={bulkDeleteLoading}>
                        {bulkDeleteLoading ? 'Eliminando...' : `Eliminar ${selectedIds.size}`}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
};

export default Enrollments;
