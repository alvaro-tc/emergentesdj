import React, { useState, useEffect } from 'react';
import {
    Button,
    CardContent,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    OutlinedInput,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Link,
    Tooltip,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Chip
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconBrandWhatsapp, IconUsers, IconLink } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import CourseDialog from './CourseDialog';
import CourseRequestsDialog from './CourseRequestsDialog';
import { formatSchedule, getScheduleItems } from '../../../utils/scheduleUtils';

const Courses = () => {
    const account = useSelector((state) => state.account);
    const [courses, setCourses] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);

    // Requests Dialog State
    const [openRequestsDialog, setOpenRequestsDialog] = useState(false);
    const [courseForRequests, setCourseForRequests] = useState(null);

    const [subjects, setSubjects] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('');


    const fetchCourses = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'courses', {
                params: {
                    subject: filterSubject,
                    period: filterPeriod,
                    show_archived: showArchived
                }
            })
                .then(response => {
                    console.log('✅ Courses fetched:', response.data.length, 'courses');
                    console.log('First course:', response.data[0]);
                    setCourses(response.data);
                })
                .catch(error => console.error("Error fetching courses", error));
        }
    };

    const fetchFilters = async () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            try {
                const [subjectsRes, periodsRes] = await Promise.all([
                    axios.get(configData.API_SERVER + 'subjects'),
                    axios.get(configData.API_SERVER + 'periods')
                ]);
                setSubjects(subjectsRes.data);
                setPeriods(periodsRes.data);
            } catch (error) {
                console.error("Error fetching filters", error);
            }
        }
    };

    useEffect(() => {
        fetchFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account.token]);

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account.token, filterSubject, filterPeriod, showArchived]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event) => {
        setSearch(event.target.value);
    };

    const handleAdd = () => {
        setSelectedCourse(null);
        setOpenDialog(true);
    };

    const handleEdit = (course) => {
        setSelectedCourse(course);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setCourseToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleOpenRequests = (course) => {
        setCourseForRequests(course);
        setOpenRequestsDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!courseToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}courses/${courseToDelete}/`);
            fetchCourses();
            setOpenDeleteDialog(false);
            setCourseToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = (course.subject_details && course.subject_details.name.toLowerCase().includes(search.toLowerCase())) ||
            (course.subject_details && course.subject_details.code.toLowerCase().includes(search.toLowerCase())) ||
            (course.parallel && course.parallel.toLowerCase().includes(search.toLowerCase())) ||
            (course.teacher_name && course.teacher_name.toLowerCase().includes(search.toLowerCase())) ||
            (course.course_identifier && course.course_identifier.toLowerCase().includes(search.toLowerCase()));

        const isArchived = course.subject_details?.archived;

        if (!showArchived && isArchived) {
            return false;
        }

        return matchesSearch;
    });

    console.log('🔍 Filtered courses:', filteredCourses.length, 'out of', courses.length);
    if (filteredCourses.length !== courses.length) {
        console.log('⚠️ Some courses filtered out. showArchived:', showArchived);
    }

    return (
        <MainCard title="Paralelos" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid
                        size={{
                            xs: 12,
                            md: 8
                        }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid>
                                <OutlinedInput
                                    id="input-search-courses"
                                    placeholder="Buscar Paralelo"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <IconSearch stroke={1.5} size="1rem" />
                                        </InputAdornment>
                                    }
                                    size="small"
                                    value={search}
                                    onChange={handleSearch}
                                />
                            </Grid>
                            <Grid>
                                <TextField
                                    select
                                    label="Filtrar por Materia"
                                    value={filterSubject}
                                    onChange={(e) => setFilterSubject(e.target.value)}
                                    size="small"
                                    variant="outlined"
                                    style={{ minWidth: 200 }}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {subjects
                                        .filter(s => showArchived || !s.archived)
                                        .map((s) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                                        ))}
                                </TextField>
                            </Grid>
                            <Grid>
                                <TextField
                                    select
                                    label="Filtrar por Periodo"
                                    value={filterPeriod}
                                    onChange={(e) => setFilterPeriod(e.target.value)}
                                    size="small"
                                    variant="outlined"
                                    style={{ minWidth: 150 }}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {periods.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showArchived}
                                            onChange={(e) => setShowArchived(e.target.checked)}
                                            name="showArchived"
                                            color="primary"
                                        />
                                    }
                                    label="Mostrar Archivados"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid>
                        <Button variant="contained" color="secondary" startIcon={<IconPlus />} onClick={handleAdd}>
                            Añadir Paralelo
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
            <Divider />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Identificador</TableCell>
                            <TableCell>Materia</TableCell>
                            <TableCell>Paralelo</TableCell>
                            <TableCell>Docente</TableCell>
                            <TableCell>Horario</TableCell>
                            <TableCell>WhatsApp</TableCell>
                            <TableCell>Plataforma</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCourses
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((course) => (
                                <TableRow key={course.id} hover>
                                    <TableCell>
                                        {course.course_identifier ? (
                                            <Chip label={course.course_identifier} size="small" variant="outlined" color="primary" />
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {course.subject_details?.name} ({course.subject_details?.code})
                                    </TableCell>
                                    <TableCell>{course.parallel}</TableCell>
                                    <TableCell>{course.teacher_name || 'Sin asignar'}</TableCell>
                                    <TableCell>
                                        {getScheduleItems(course.schedule).length > 0 ? (
                                            getScheduleItems(course.schedule).map((item, idx) => (
                                                <div key={idx} style={{ whiteSpace: 'nowrap' }}>{item}</div>
                                            ))
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {course.whatsapp_link ? (
                                            <Tooltip title="Abrir Link WhatsApp">
                                                <IconButton
                                                    component={Link}
                                                    href={course.whatsapp_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="small"
                                                    color="primary"
                                                >
                                                    <IconBrandWhatsapp />
                                                </IconButton>
                                            </Tooltip>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {course.platform_link ? (
                                            <Tooltip title="Abrir Plataforma Virtual">
                                                <IconButton
                                                    component={Link}
                                                    href={course.platform_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="small"
                                                    color="secondary"
                                                >
                                                    <IconLink />
                                                </IconButton>
                                            </Tooltip>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={course.subject_details?.archived ? "Archivado" : "Activo"}
                                            color={course.subject_details?.archived ? "default" : "secondary"}
                                            size="small"
                                        />
                                        {course.is_registration_open && (
                                            <Chip
                                                label="Insc. Abierta"
                                                color="primary"
                                                size="small"
                                                style={{ marginLeft: 5 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Solicitudes de Inscripción">
                                            <IconButton onClick={() => handleOpenRequests(course)} size="small" color="primary">
                                                <IconUsers size="1.3rem" />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton onClick={() => handleEdit(course)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(course.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredCourses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No se encontraron registros
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredCourses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Eliminar Paralelo</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar este paralelo? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="secondary" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            <CourseDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                course={selectedCourse}
                onSave={fetchCourses}
            />
            <CourseRequestsDialog
                open={openRequestsDialog}
                handleClose={() => setOpenRequestsDialog(false)}
                course={courseForRequests}
            />
        </MainCard>
    );
};

export default Courses;
