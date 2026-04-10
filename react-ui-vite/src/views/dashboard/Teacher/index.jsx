import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Grid, Typography, CardMedia, Button, Box, IconButton, Tooltip, Chip } from '@mui/material';
import axios from 'axios';
import configData from '../../../config';
import MainCard from '../../../ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';
import { IconPencil, IconSettings, IconUserPlus, IconListCheck, IconBulb, IconScale, IconChartBar } from '@tabler/icons-react';
import CourseDialog from '../../pages/school/CourseDialog';
import CourseStatsPanel from '../components/CourseStatsPanel';
import * as ScheduleUtils from '../../../utils/scheduleUtils';
import { useNavigate } from 'react-router-dom';
import { SET_ACTIVE_COURSE } from '../../../store/actions';


const TeacherDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const fetchTeacherCourses = async () => {
        try {
            setLoading(true);
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            // Fetch all courses but filter by teacher ID on client side since we don't have a specific endpoint yet
            // Or better, if backend supports filtering by teacher param
            const response = await axios.get(`${configData.API_SERVER}courses/`);

            // Filter courses where the current user is the teacher
            // Backend already filters by role (see CourseViewSet.get_queryset), so we use response directy
            const coursesData = response.data.results || response.data;
            setCourses(coursesData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching courses:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (account.token && account.user) {
            fetchTeacherCourses();
        }
    }, [account]);

    const handleEditCourse = (course) => {
        setSelectedCourse(course);
        setOpenDialog(true);
    };

    const handleNavigate = (path, course) => {
        // Set active course in Redux before navigating
        // We need to fetch full course details or just set what we have? 
        // Typically we set the full object. The course object here should be sufficient or close to it.
        // But the reducer expects specific structure. Let's look at how Subjects.js sets it? 
        // Actually, sidebar usually handles this or the page itself selects it. 
        // But for quick links, we want to pre-select it.

        // Dispatch action to set active course (if needed by your app logic)
        // Check if SET_ACTIVE_COURSE expects just ID or object. usually object.
        dispatch({ type: SET_ACTIVE_COURSE, payload: course });
        navigate(path);
    };

    if (loading) return <Typography>Cargando cursos asignados...</Typography>;

    return (
        <Grid container spacing={gridSpacing}>
            {activeCourse?.id && (
                <Grid size={12}>
                    <CourseStatsPanel
                        courseId={activeCourse.id}
                        courseName={`${activeCourse.subject_details?.name ?? ''} — Paralelo ${activeCourse.parallel ?? ''}`}
                        token={account.token}
                    />
                </Grid>
            )}
            <Grid size={12}>
                <Typography variant="h2" gutterBottom>Mis Cursos Asignados</Typography>
            </Grid>
            {courses.length > 0 ? (
                courses.map((course) => (
                    <Grid
                        key={course.id}
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 6,
                            lg: 4
                        }}>
                        <MainCard content={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardMedia
                                sx={{ height: 140 }}
                                image={course.image || 'https://via.placeholder.com/300x140?text=Sin+Imagen'}
                                title={course.name}
                            />
                            <Box sx={{ flexGrow: 1 }} p={2}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography
                                        sx={{ fontSize: '1.2rem', fontWeight: 600, mb: 1 }}
                                        variant="h4"
                                        component="h2"
                                    >
                                        {course.subject_details?.name}
                                    </Typography>
                                    <IconButton size="small" onClick={() => handleEditCourse(course)}>
                                        <IconSettings />
                                    </IconButton>
                                </div>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }}>
                                    <strong>Paralelo:</strong> {course.parallel}
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }}>
                                    <strong>Código:</strong> {course.subject_details?.code}
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }} component="div">
                                    <strong>Horario:</strong>
                                    {ScheduleUtils.getScheduleItems(course.schedule).length > 0 ? (
                                        ScheduleUtils.getScheduleItems(course.schedule).map((item, idx) => (
                                            <div key={idx} style={{ marginLeft: 8 }}>• {item}</div>
                                        ))
                                    ) : <span style={{ marginLeft: 4 }}>Por definir</span>}
                                </Typography>
                                <Box mt={1}>
                                    <Chip
                                        label={course.is_registration_open ? "Inscripción Abierta" : "Inscripción Cerrada"}
                                        color={course.is_registration_open ? "success" : "default"}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                            <Box p={2} bgcolor="background.default">
                                <Typography variant="subtitle2" gutterBottom>Accesos Rápidos:</Typography>
                                <Grid container spacing={1}>
                                    <Grid size={4}>
                                        <Tooltip title="Inscripciones">
                                            <Button
                                                variant="outlined" color="primary" fullWidth size="small"
                                                onClick={() => handleNavigate('/school/enrollments', course)}
                                            >
                                                <IconUserPlus size="1.2rem" />
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={4}>
                                        <Tooltip title="Llenado de Notas">
                                            <Button
                                                variant="outlined" color="secondary" fullWidth size="small"
                                                onClick={() => handleNavigate('/school/grades', course)}
                                            >
                                                <IconPencil size="1.2rem" />
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={4}>
                                        <Tooltip title="Control Actividades">
                                            <Button
                                                variant="outlined" style={{ color: '#673ab7', borderColor: '#673ab7' }} fullWidth size="small"
                                                onClick={() => handleNavigate('/extras/task-grading', course)}
                                            >
                                                <IconListCheck size="1.2rem" />
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={6}>
                                        <Tooltip title="Proyectos">
                                            <Button
                                                variant="outlined" style={{ color: '#ff9800', borderColor: '#ff9800' }} fullWidth size="small"
                                                onClick={() => handleNavigate('/extras/projects', course)}
                                                startIcon={<IconBulb size="1rem" />}
                                            >
                                                Proyectos
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={6}>
                                        <Tooltip title="Ponderaciones">
                                            <Button
                                                variant="outlined" style={{ color: '#009688', borderColor: '#009688' }} fullWidth size="small"
                                                onClick={() => handleNavigate('/school/weightings', course)}
                                                startIcon={<IconScale size="1rem" />}
                                            >
                                                Ponderaciones
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                            </Box>
                        </MainCard>
                    </Grid>
                ))
            ) : (
                <Grid size={12}>
                    <MainCard>
                        <Typography align="center" variant="h4">No tienes paralelos asignados.</Typography>
                    </MainCard>
                </Grid>
            )}
            <CourseDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                course={selectedCourse}
                onSave={fetchTeacherCourses}
            />
        </Grid>
    );
};

export default TeacherDashboard;
