import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { Grid } from '@mui/material';

// project imports
import EarningCard from './EarningCard';
import TotalOrderLineChartCard from './TotalOrderLineChartCard';
import TotalIncomeDarkCard from './TotalIncomeDarkCard';
import TotalIncomeLightCard from './TotalIncomeLightCard';
import CriterionPerformanceChart from './CriterionPerformanceChart';
import TopStudentsCard from './TopStudentsCard';
import StudentDashboard from '../Student';
import TeacherDashboard from '../Teacher/index';
import { gridSpacing } from './../../../store/constant';
import configData from '../../../config';
import axios from 'axios';

// assets
import PeopleAltTwoToneIcon from '@mui/icons-material/PeopleAltTwoTone';
import SchoolTwoToneIcon from '@mui/icons-material/SchoolTwoTone';
import ClassTwoToneIcon from '@mui/icons-material/ClassTwoTone';
import LibraryBooksTwoToneIcon from '@mui/icons-material/LibraryBooksTwoTone';
import DescriptionTwoToneIcon from '@mui/icons-material/DescriptionTwoTone';
import AssignmentTurnedInTwoToneIcon from '@mui/icons-material/AssignmentTurnedInTwoTone';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import AssessmentTwoToneIcon from '@mui/icons-material/AssessmentTwoTone';

// ── Grade computation helper ──────────────────────────────────────────────────
const computeStudentGrade = (row, structure) => {
    let total = 0;
    structure.forEach((group) => {
        let score = 0;
        group.sub_criteria.forEach((sub) => {
            const s = row.grades[sub.id];
            if (s !== undefined && s !== null && s !== '') score += parseFloat(s);
        });
        (group.special_criteria || []).forEach((spec) => {
            const s = row.grades[spec.id];
            if (s !== undefined && s !== null && s !== '') score += parseFloat(s);
        });
        if (score > 0) total += Math.min(score, parseFloat(group.weight));
    });
    return total;
};

const truncate = (str, max = 18) =>
    str && str.length > max ? str.substring(0, max - 1) + '…' : str;

//-----------------------|| DEFAULT DASHBOARD ||-----------------------//

const Dashboard = () => {
    const [isLoading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);

    // Paralelo-specific stats (only for ADMIN when a course is selected)
    const [parallelLoading, setParallelLoading] = useState(false);
    const [parallelStats, setParallelStats] = useState(null);

    // ── Global dashboard stats ───────────────────────────────────────────────
    useEffect(() => {
        if (!account.isInitialized) return;

        const fetchStats = async () => {
            try {
                const response = await axios.get(`${configData.API_SERVER}reports/dashboard_stats/`, {
                    headers: { Authorization: `Bearer ${account.token}` }
                });
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [account.isInitialized, account.token]);

    // ── Paralelo stats (enrollments + gradesheet) ───────────────────────────
    useEffect(() => {
        if (!activeCourse?.id || !account.token) {
            setParallelStats(null);
            return;
        }

        setParallelLoading(true);

        const fetchParallelStats = async () => {
            try {
                axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

                const [enrollRes, gradeRes] = await Promise.all([
                    axios.get(`${configData.API_SERVER}enrollments/?course=${activeCourse.id}`),
                    axios.get(
                        `${configData.API_SERVER}criterion-scores/gradesheet/?course_id=${activeCourse.id}&page=1&page_size=200`
                    ),
                ]);

                const enrollCount =
                    enrollRes.data.count ??
                    (enrollRes.data.results || enrollRes.data).length;

                const structure = gradeRes.data.structure || [];
                const rows = gradeRes.data.rows || [];

                let avgGrade = null;
                let passRate = null;
                let criterionData = [];
                let topStudents = [];

                if (rows.length > 0 && structure.length > 0) {
                    // Final grades per student
                    const studentGrades = rows.map((row) => ({
                        enrollment_id: row.enrollment_id,
                        name: [row.paternal_surname, row.maternal_surname, row.first_name]
                            .filter(Boolean).join(' '),
                        ci: row.ci,
                        grade: parseFloat(computeStudentGrade(row, structure).toFixed(2)),
                    }));

                    const validGrades = studentGrades.filter((s) => s.grade > 0);

                    if (validGrades.length > 0) {
                        avgGrade = (
                            validGrades.reduce((s, g) => s + g.grade, 0) / validGrades.length
                        ).toFixed(1);

                        passRate = (
                            (validGrades.filter((g) => g.grade >= 51).length / validGrades.length) * 100
                        ).toFixed(0);
                    }

                    // Top 7 students
                    topStudents = [...studentGrades]
                        .sort((a, b) => b.grade - a.grade)
                        .slice(0, 7);

                    // Criterion averages
                    criterionData = structure.map((group) => {
                        const scores = rows.map((row) => {
                            let s = 0;
                            group.sub_criteria.forEach((sub) => {
                                const v = row.grades[sub.id];
                                if (v !== undefined && v !== null && v !== '') s += parseFloat(v);
                            });
                            (group.special_criteria || []).forEach((spec) => {
                                const v = row.grades[spec.id];
                                if (v !== undefined && v !== null && v !== '') s += parseFloat(v);
                            });
                            return Math.min(s, parseFloat(group.weight));
                        });
                        const avg = scores.length
                            ? scores.reduce((a, b) => a + b, 0) / scores.length
                            : 0;
                        const pct = (avg / parseFloat(group.weight)) * 100;
                        return {
                            name: truncate(group.name),
                            fullName: group.name,
                            promedio: parseFloat(avg.toFixed(2)),
                            maximo: parseFloat(group.weight),
                            pct: parseFloat(pct.toFixed(1)),
                        };
                    });
                }

                setParallelStats({
                    enrollCount,
                    avgGrade,
                    passRate,
                    criterionData,
                    topStudents,
                    criterionCount: structure.length,
                });
            } catch (err) {
                console.error('Error fetching parallel stats:', err);
                setParallelStats(null);
            } finally {
                setParallelLoading(false);
            }
        };

        fetchParallelStats();
    }, [activeCourse?.id, account.token]);

    // ── Role-based rendering ─────────────────────────────────────────────────
    if (account.user?.role === 'STUDENT') return <StudentDashboard />;
    if (account.user?.role === 'TEACHER') return <TeacherDashboard />;

    // ── Resolve card data: paralelo stats override global when available ─────
    const hasParallelStats = !!parallelStats;
    const cardLoading = isLoading || parallelLoading;

    const courseName = activeCourse
        ? `${activeCourse.subject_details?.name ?? ''} — Paralelo ${activeCourse.parallel ?? ''}`
        : null;

    // Card 1 — Tasa de Aprobación (paralelo) vs Cursos Activos (global)
    const card1 = hasParallelStats
        ? {
            title: 'Tasa de Aprobación',
            count: parallelStats.passRate != null ? `${parallelStats.passRate}%` : '—',
            icon: <CheckCircleTwoToneIcon fontSize="inherit" />,
        }
        : {
            title: stats.card1?.title,
            count: stats.card1?.count,
            icon: <SchoolTwoToneIcon fontSize="inherit" />,
        };

    // Card 2 — Promedio del Paralelo vs global card2
    const card2 = hasParallelStats
        ? {
            title: 'Promedio del Paralelo',
            count: parallelStats.avgGrade != null ? `${parallelStats.avgGrade} / 100` : '—',
            icon: <AssessmentTwoToneIcon fontSize="inherit" />,
        }
        : {
            title: stats.card2?.title,
            count: stats.card2?.count,
            icon: <PeopleAltTwoToneIcon fontSize="inherit" />,
        };

    // Card 3 — Estudiantes del Paralelo vs global card3
    const card3 = hasParallelStats
        ? {
            title: 'Estudiantes Inscritos',
            count: parallelStats.enrollCount ?? '—',
            icon: <PeopleAltTwoToneIcon fontSize="inherit" />,
        }
        : {
            title: stats.card3?.title,
            count: stats.card3?.count,
            icon: <ClassTwoToneIcon fontSize="inherit" />,
        };

    // Card 4 — Criterios Evaluados vs global card4
    const card4 = hasParallelStats
        ? {
            title: 'Criterios Evaluados',
            count: parallelStats.criterionCount ?? '—',
            icon: <AssignmentTurnedInTwoToneIcon fontSize="inherit" />,
        }
        : {
            title: stats.card4?.title,
            count: stats.card4?.count,
            icon: <LibraryBooksTwoToneIcon fontSize="inherit" />,
        };

    return (
        <Grid container spacing={gridSpacing}>
            {/* ── Row 1: KPI cards ─────────────────────────────────────────── */}
            <Grid size={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid size={{ lg: 4, md: 6, sm: 6, xs: 12 }}>
                        <EarningCard
                            isLoading={cardLoading}
                            title={card1.title}
                            count={card1.count}
                            icon={card1.icon}
                        />
                    </Grid>
                    <Grid size={{ lg: 4, md: 6, sm: 6, xs: 12 }}>
                        <TotalOrderLineChartCard
                            isLoading={cardLoading}
                            title={card2.title}
                            count={card2.count}
                            icon={card2.icon}
                        />
                    </Grid>
                    <Grid size={{ lg: 4, md: 12, sm: 12, xs: 12 }}>
                        <Grid container spacing={gridSpacing}>
                            <Grid size={{ sm: 6, xs: 12, md: 6, lg: 12 }}>
                                <TotalIncomeDarkCard
                                    isLoading={cardLoading}
                                    title={card3.title}
                                    count={card3.count}
                                    icon={card3.icon}
                                />
                            </Grid>
                            <Grid size={{ sm: 6, xs: 12, md: 6, lg: 12 }}>
                                <TotalIncomeLightCard
                                    isLoading={cardLoading}
                                    title={card4.title}
                                    count={card4.count}
                                    icon={card4.icon}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* ── Row 2: Criterion chart + Top students ────────────────────── */}
            <Grid size={12}>
                <Grid container spacing={gridSpacing} alignItems="stretch">
                    <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <CriterionPerformanceChart
                            isLoading={cardLoading}
                            criterionData={parallelStats?.criterionData}
                            courseName={courseName}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <TopStudentsCard
                            isLoading={cardLoading}
                            students={parallelStats?.topStudents}
                            courseName={courseName}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
