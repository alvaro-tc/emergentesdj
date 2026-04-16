import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Grid, Typography, Box, Chip, Avatar, Button, Card, CardContent,
    Divider, Stack, Skeleton
} from '@mui/material';
import axios from 'axios';
import configData from '../../../config';
import { gridSpacing } from '../../../store/constant';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchoolIcon from '@mui/icons-material/School';

import InfoModal from './InfoModal';
import GradesModal from './GradesModal';
import * as ScheduleUtils from '../../../utils/scheduleUtils';

const CARD_GRADIENTS = [
    ['#1565C0', '#1976D2'],
    ['#2E7D32', '#388E3C'],
    ['#6A1B9A', '#7B1FA2'],
    ['#E65100', '#F57C00'],
    ['#00695C', '#00897B'],
    ['#AD1457', '#C2185B'],
    ['#1A237E', '#283593'],
    ['#BF360C', '#D84315'],
];

const getGradeColor = (grade) => {
    if (grade === null || grade === undefined) return null;
    if (grade >= 71) return 'success';
    if (grade >= 51) return 'warning';
    return 'error';
};

const CourseCard = ({ course, index, onInfo, onGrades }) => {
    const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
    const scheduleItems = ScheduleUtils.getScheduleItems(course.schedule);
    const initial = course.name ? course.name.charAt(0).toUpperCase() : 'C';
    const gradeColor = getGradeColor(course.grade);

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
            }
        }}>
            {/* Header con gradiente */}
            <Box sx={{
                background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
                p: 2.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
            }}>
                <Avatar sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    width: 50,
                    height: 50,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    border: '2px solid rgba(255,255,255,0.3)'
                }}>
                    {initial}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" sx={{
                        color: 'white',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        mb: 0.75,
                    }}>
                        {course.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip
                            label={course.code}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '0.68rem', height: 20 }}
                        />
                        {course.parallel && (
                            <Chip
                                label={`Paralelo ${course.parallel}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '0.68rem', height: 20 }}
                            />
                        )}
                    </Stack>
                </Box>
                {gradeColor && course.grade !== null && course.grade !== undefined && (
                    <Chip
                        label={String(course.grade)}
                        color={gradeColor}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}
                    />
                )}
            </Box>

            {/* Cuerpo */}
            <CardContent sx={{ flex: 1, p: 2, pb: 1 }}>
                <Stack spacing={1.25}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <PersonOutlineIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" noWrap title={course.teacher}>
                            {course.teacher}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {course.period}
                        </Typography>
                    </Box>
                    {scheduleItems.length > 0 && (
                        <Box display="flex" alignItems="flex-start" gap={1}>
                            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0, mt: 0.2 }} />
                            <Box>
                                {scheduleItems.map((item, idx) => (
                                    <Typography key={idx} variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        {item}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </CardContent>

            {/* Acciones */}
            <Box sx={{ p: 2, pt: 0.5 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Grid container spacing={1}>
                    <Grid size={6}>
                        <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            startIcon={<InfoOutlinedIcon />}
                            onClick={() => onInfo(course)}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Info
                        </Button>
                    </Grid>
                    <Grid size={6}>
                        <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            startIcon={<BarChartIcon />}
                            onClick={() => onGrades(course)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${gradient[1]} 0%, ${gradient[0]} 100%)`,
                                }
                            }}
                        >
                            Ver Notas
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Card>
    );
};

const LoadingSkeleton = () => (
    <Grid container spacing={gridSpacing}>
        <Grid size={12}>
            <Skeleton variant="text" width={220} height={40} />
            <Skeleton variant="text" width={320} height={24} sx={{ mt: 0.5 }} />
        </Grid>
        {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Grid>
        ))}
    </Grid>
);

const StudentDashboard = () => {
    const [isLoading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const account = useSelector((state) => state.account);

    const [infoOpen, setInfoOpen] = useState(false);
    const [gradesOpen, setGradesOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = account.token;
                if (!token) { setLoading(false); return; }
                const response = await axios.get(`${configData.API_SERVER}reports/dashboard_stats/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching student dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (account.isInitialized) fetchStats();
    }, [account.isInitialized, account.token]);

    const handleInfoClick = (course) => { setSelectedCourse(course); setInfoOpen(true); };
    const handleGradesClick = (course) => { setSelectedCourse(course); setGradesOpen(true); };
    const handleClose = () => { setInfoOpen(false); setGradesOpen(false); setSelectedCourse(null); };

    if (isLoading) return <LoadingSkeleton />;

    const courses = stats.enrolled_courses || [];

    return (
        <Grid container spacing={gridSpacing}>
            {/* Encabezado */}
            <Grid size={12}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <SchoolIcon color="primary" sx={{ fontSize: 30 }} />
                    <Typography variant="h2">Mis Cursos</Typography>
                    {courses.length > 0 && (
                        <Chip
                            label={`${courses.length} curso${courses.length !== 1 ? 's' : ''}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: '46px' }}>
                    Cursos en los que estás inscrito este periodo.
                </Typography>
            </Grid>

            {/* Tarjetas de cursos */}
            {courses.length > 0 ? (
                courses.map((course, index) => (
                    <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <CourseCard
                            course={course}
                            index={index}
                            onInfo={handleInfoClick}
                            onGrades={handleGradesClick}
                        />
                    </Grid>
                ))
            ) : (
                <Grid size={12}>
                    <Box sx={{
                        textAlign: 'center',
                        py: 10,
                        px: 4,
                        bgcolor: 'background.paper',
                        borderRadius: 3,
                        border: '2px dashed',
                        borderColor: 'divider'
                    }}>
                        <SchoolIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h4" color="text.secondary" gutterBottom>
                            Sin cursos inscritos
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            Actualmente no estás inscrito en ningún curso activo.
                        </Typography>
                    </Box>
                </Grid>
            )}

            {/* Modales */}
            <InfoModal open={infoOpen} onClose={handleClose} course={selectedCourse} />
            <GradesModal open={gradesOpen} onClose={handleClose} course={selectedCourse} />
        </Grid>
    );
};

export default StudentDashboard;
