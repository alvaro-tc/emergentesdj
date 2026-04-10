import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Grid, Typography, Card, CardContent, CardMedia, Button, Box } from '@mui/material';
import axios from 'axios';
import configData from '../../../config';
import MainCard from '../../../ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';
import { Link } from 'react-router-dom';

import InfoModal from './InfoModal';
import GradesModal from './GradesModal';
import CourseStatsPanel from '../components/CourseStatsPanel';
import * as ScheduleUtils from '../../../utils/scheduleUtils';


const StudentDashboard = () => {
    const [isLoading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);

    const [infoOpen, setInfoOpen] = useState(false);
    const [gradesOpen, setGradesOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = account.token;
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${configData.API_SERVER}reports/dashboard_stats/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setStats(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching student dashboard stats:", error);
                setLoading(false);
            }
        };

        if (account.isInitialized) {
            fetchStats();
        }
    }, [account]);

    const handleInfoClick = (course) => {
        setSelectedCourse(course);
        setInfoOpen(true);
    };

    const handleGradesClick = (course) => {
        setSelectedCourse(course);
        setGradesOpen(true);
    };

    const handleClose = () => {
        setInfoOpen(false);
        setGradesOpen(false);
        setSelectedCourse(null);
    };

    // Find the enrolled course that matches the active paralelo to get its criteria_grades
    const activeCourseData = useMemo(() => {
        if (!activeCourse?.id || !stats.enrolled_courses) return null;
        return stats.enrolled_courses.find((c) => c.id === activeCourse.id) ?? null;
    }, [activeCourse, stats.enrolled_courses]);

    if (isLoading) {
        return <Typography>Cargando cursos...</Typography>;
    }

    return (
        <Grid container spacing={gridSpacing}>
            {activeCourseData?.criteria_grades && (
                <Grid size={12}>
                    <CourseStatsPanel
                        criteriaGrades={activeCourseData.criteria_grades}
                        courseName={`${activeCourseData.name ?? ''} — Paralelo ${activeCourseData.parallel ?? ''}`}
                        studentMode
                    />
                </Grid>
            )}
            <Grid size={12}>
                <Typography variant="h2" gutterBottom>Mis Cursos Inscritos</Typography>
            </Grid>
            {stats.enrolled_courses && stats.enrolled_courses.length > 0 ? (
                stats.enrolled_courses.map((course) => (
                    <Grid
                        key={course.id}
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 4,
                            lg: 3
                        }}>
                        <MainCard content={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardMedia
                                sx={{ height: 140 }}
                                image={course.image || 'https://via.placeholder.com/300x140?text=No+Image'}
                                title={course.name}
                            />
                            <Box sx={{ flexGrow: 1 }} p={2}>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, mb: 1 }} variant="h4" component="h2">
                                    {course.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }}>
                                    {course.code} - {course.parallel || 'Sin Paralelo'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }}>
                                    Docente: {course.teacher}
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }}>
                                    Periodo: {course.period}
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }} component="div">
                                    <strong>Horario:</strong>
                                    {ScheduleUtils.getScheduleItems(course.schedule).length > 0 ? (
                                        ScheduleUtils.getScheduleItems(course.schedule).map((item, idx) => (
                                            <div key={idx}>{item}</div>
                                        ))
                                    ) : <span style={{ marginLeft: 4 }}>Por definir</span>}
                                </Typography>
                            </Box>
                            <Box p={2}>
                                <Grid container spacing={1}>
                                    <Grid size={6}>
                                        <Button
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => handleInfoClick(course)}
                                        >
                                            Info
                                        </Button>
                                    </Grid>
                                    <Grid size={6}>
                                        <Button
                                            size="small"
                                            color="secondary"
                                            variant="contained"
                                            fullWidth
                                            onClick={() => handleGradesClick(course)}
                                        >
                                            Ver Notas
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </MainCard>
                    </Grid>
                ))
            ) : (
                <Grid size={12}>
                    <MainCard>
                        <Typography align="center" variant="h4">No estás inscrito en ningún curso actualmente.</Typography>
                    </MainCard>
                </Grid>
            )}
            {/* Modals */}
            <InfoModal open={infoOpen} onClose={handleClose} course={selectedCourse} />
            <GradesModal open={gradesOpen} onClose={handleClose} course={selectedCourse} />
        </Grid>
    );
};

export default StudentDashboard;
