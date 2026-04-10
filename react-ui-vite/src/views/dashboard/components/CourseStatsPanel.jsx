import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box, Typography, Grid, Skeleton, useTheme, Divider
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';
import axios from 'axios';
import configData from '../../../config';
import MainCard from '../../../ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';
import PeopleAltTwoToneIcon from '@mui/icons-material/PeopleAltTwoTone';
import SchoolTwoToneIcon from '@mui/icons-material/SchoolTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';

// ─── helpers ────────────────────────────────────────────────────────────────

const computeStudentGrade = (row, structure) => {
    let finalGrade = 0;
    structure.forEach((group) => {
        let totalScore = 0;
        group.sub_criteria.forEach((sub) => {
            const score = row.grades[sub.id];
            if (score !== undefined && score !== null && score !== '') {
                totalScore += parseFloat(score);
            }
        });
        let extraPoints = 0;
        (group.special_criteria || []).forEach((spec) => {
            const score = row.grades[spec.id];
            if (score !== undefined && score !== null && score !== '') {
                extraPoints += parseFloat(score);
            }
        });
        const rawTotal = totalScore + extraPoints;
        const maxWeight = parseFloat(group.weight);
        if (rawTotal > 0) {
            finalGrade += Math.min(rawTotal, maxWeight);
        }
    });
    return finalGrade;
};

const truncate = (str, max = 18) =>
    str && str.length > max ? str.substring(0, max - 1) + '…' : str;

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CriterionTooltip = ({ active, payload }) => {
    const theme = useTheme();
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 1.5,
                boxShadow: 3,
                minWidth: 180,
            }}
        >
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                {d.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Promedio: <strong>{d.promedio} / {d.maximo} pts</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Rendimiento: <strong>{d.pct}%</strong>
            </Typography>
        </Box>
    );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatChip = ({ icon: Icon, label, value, color, loading }) => {
    const theme = useTheme();
    const bg = theme.palette[color]?.light ?? theme.palette.grey[100];
    const fg = theme.palette[color]?.dark ?? theme.palette.text.primary;
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: bg,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                height: '100%',
            }}
        >
            <Box
                sx={{
                    bgcolor: theme.palette[color]?.main ?? 'grey.300',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon sx={{ color: '#fff', fontSize: '1.2rem' }} />
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </Typography>
                {loading ? (
                    <Skeleton variant="text" width={50} height={32} />
                ) : (
                    <Typography variant="h3" sx={{ color: fg, lineHeight: 1.2 }}>
                        {value}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * CourseStatsPanel
 *
 * Props:
 *   courseId       {number|string} – ID del paralelo activo
 *   courseName     {string}        – Nombre legible (opcional)
 *   token          {string}        – JWT / Token auth
 *
 * Para rol STUDENT pasa `criteriaGrades` en lugar de courseId/token:
 *   criteriaGrades {Array}         – Datos de criteria_grades del estudiante
 *   enrollmentCount {number}       – Número de estudiantes del paralelo (opcional para STUDENT)
 */
const CourseStatsPanel = ({
    courseId,
    courseName,
    token,
    criteriaGrades,  // Student mode: pre-loaded data
    studentMode = false,
}) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(!studentMode);
    const [enrollmentCount, setEnrollmentCount] = useState(null);
    const [avgGrade, setAvgGrade] = useState(null);
    const [passRate, setPassRate] = useState(null);
    const [criterionData, setCriterionData] = useState([]);

    // ── Teacher / Admin: fetch from API ──────────────────────────────────────
    useEffect(() => {
        if (studentMode || !courseId || !token) return;

        setLoading(true);
        setAvgGrade(null);
        setPassRate(null);
        setCriterionData([]);

        const fetchData = async () => {
            try {
                axios.defaults.headers.common['Authorization'] = `Token ${token}`;

                const [enrollRes, gradeRes] = await Promise.all([
                    axios.get(`${configData.API_SERVER}enrollments/?course=${courseId}`),
                    axios.get(
                        `${configData.API_SERVER}criterion-scores/gradesheet/?course_id=${courseId}&page=1&page_size=200`
                    ),
                ]);

                // ── Enrollment count ───────────────────────────────────────
                const count =
                    enrollRes.data.count ??
                    (enrollRes.data.results || enrollRes.data).length;
                setEnrollmentCount(count);

                // ── Grade computations ─────────────────────────────────────
                const structure = gradeRes.data.structure || [];
                const rows = gradeRes.data.rows || [];

                if (rows.length > 0 && structure.length > 0) {
                    const grades = rows.map((row) => computeStudentGrade(row, structure));
                    const validGrades = grades.filter((g) => g > 0);

                    if (validGrades.length > 0) {
                        const avg = validGrades.reduce((s, g) => s + g, 0) / validGrades.length;
                        setAvgGrade(avg.toFixed(1));
                        const passing = validGrades.filter((g) => g >= 51).length;
                        setPassRate(((passing / validGrades.length) * 100).toFixed(0));
                    }

                    // Criterion averages (% of max weight)
                    const critData = structure.map((group) => {
                        const scores = rows.map((row) => {
                            let total = 0;
                            group.sub_criteria.forEach((sub) => {
                                const s = row.grades[sub.id];
                                if (s !== undefined && s !== null && s !== '') total += parseFloat(s);
                            });
                            (group.special_criteria || []).forEach((spec) => {
                                const s = row.grades[spec.id];
                                if (s !== undefined && s !== null && s !== '') total += parseFloat(s);
                            });
                            return Math.min(total, parseFloat(group.weight));
                        });

                        const avgScore =
                            scores.length > 0
                                ? scores.reduce((s, v) => s + v, 0) / scores.length
                                : 0;
                        const pct = (avgScore / parseFloat(group.weight)) * 100;

                        return {
                            name: truncate(group.name),
                            fullName: group.name,
                            promedio: parseFloat(avgScore.toFixed(2)),
                            maximo: parseFloat(group.weight),
                            pct: parseFloat(pct.toFixed(1)),
                        };
                    });

                    setCriterionData(critData);
                }

                setLoading(false);
            } catch (err) {
                console.error('CourseStatsPanel error:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, token, studentMode]);

    // ── Student mode: derive data from criteriaGrades prop ──────────────────
    useEffect(() => {
        if (!studentMode || !criteriaGrades) return;

        const critData = criteriaGrades
            .filter((group) => !group.is_special)
            .map((group) => {
                let totalScore = 0;
                (group.sub_criteria || []).forEach((sub) => {
                    if (sub.score !== undefined && sub.score !== null && sub.score !== '') {
                        totalScore += parseFloat(sub.score);
                    }
                });
                (group.special_criteria || []).forEach((spec) => {
                    if (spec.score !== undefined && spec.score !== null && spec.score !== '') {
                        totalScore += parseFloat(spec.score);
                    }
                });
                const maxWeight = parseFloat(group.weight ?? group.max_points ?? 100);
                const capped = Math.min(totalScore, maxWeight);
                const pct = maxWeight > 0 ? (capped / maxWeight) * 100 : 0;

                return {
                    name: truncate(group.name),
                    fullName: group.name,
                    promedio: parseFloat(capped.toFixed(2)),
                    maximo: maxWeight,
                    pct: parseFloat(pct.toFixed(1)),
                };
            });

        const total = critData.reduce((s, d) => s + d.promedio, 0);
        setAvgGrade(total.toFixed(1));
        setCriterionData(critData);
        setLoading(false);
    }, [criteriaGrades, studentMode]);

    // ── Color helpers ────────────────────────────────────────────────────────
    const getBarColor = (pct) => {
        if (pct >= 70) return theme.palette.success.main;
        if (pct >= 50) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const passRateColor = () => {
        if (passRate == null) return 'text.primary';
        if (passRate >= 70) return 'success.main';
        if (passRate >= 50) return 'warning.main';
        return 'error.main';
    };

    if (!courseId && !criteriaGrades) return null;

    const chartHeight = Math.max(criterionData.length * 52 + 30, 120);

    return (
        <MainCard
            title={
                <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
                    <Typography variant="h4" fontWeight={700}>
                        {studentMode ? 'Mi Rendimiento en el Paralelo' : 'Estadísticas del Paralelo'}
                    </Typography>
                    {courseName && (
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {courseName}
                        </Typography>
                    )}
                </Box>
            }
        >
            <Grid container spacing={gridSpacing}>

                {/* ── KPI row ───────────────────────────────────────────── */}
                <Grid size={12}>
                    <Grid container spacing={2}>
                        {!studentMode && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <StatChip
                                    icon={PeopleAltTwoToneIcon}
                                    label="Estudiantes inscritos"
                                    value={enrollmentCount ?? '—'}
                                    color="primary"
                                    loading={loading}
                                />
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: studentMode ? 6 : 4 }}>
                            <StatChip
                                icon={SchoolTwoToneIcon}
                                label={studentMode ? 'Mi nota acumulada' : 'Promedio del paralelo'}
                                value={avgGrade != null ? `${avgGrade} / 100` : '—'}
                                color="secondary"
                                loading={loading}
                            />
                        </Grid>
                        {!studentMode && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <StatChip
                                    icon={CheckCircleTwoToneIcon}
                                    label="Tasa de aprobación"
                                    value={passRate != null ? `${passRate}%` : '—'}
                                    color={passRate >= 70 ? 'success' : passRate >= 50 ? 'warning' : 'error'}
                                    loading={loading}
                                />
                            </Grid>
                        )}
                        {studentMode && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StatChip
                                    icon={CheckCircleTwoToneIcon}
                                    label="Estado"
                                    value={
                                        avgGrade == null ? '—'
                                            : avgGrade >= 51 ? 'Aprobado'
                                            : 'En riesgo'
                                    }
                                    color={avgGrade >= 51 ? 'success' : 'error'}
                                    loading={loading}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>

                {/* ── Criterion bar chart ───────────────────────────────── */}
                {!loading && criterionData.length > 0 && (
                    <Grid size={12}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                            {studentMode
                                ? 'Mi puntuación por criterio'
                                : 'Rendimiento promedio por criterio de evaluación'}
                        </Typography>
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <BarChart
                                layout="vertical"
                                data={criterionData}
                                margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.grey[200]} />
                                <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    unit="%"
                                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={130}
                                    tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CriterionTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                                <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={30}>
                                    {criterionData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={getBarColor(entry.pct)} />
                                    ))}
                                    <LabelList
                                        dataKey="pct"
                                        position="right"
                                        formatter={(v) => `${v}%`}
                                        style={{ fontSize: 12, fontWeight: 700, fill: theme.palette.text.primary }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <Box mt={1.5} display="flex" gap={2.5} flexWrap="wrap" justifyContent="flex-end">
                            {[
                                { color: 'success.main', label: '≥ 70% — Buen rendimiento' },
                                { color: 'warning.main', label: '50–69% — Rendimiento medio' },
                                { color: 'error.main', label: '< 50% — Necesita atención' },
                            ].map(({ color, label }) => (
                                <Box key={label} display="flex" alignItems="center" gap={0.75}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color }} />
                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Grid>
                )}

                {!loading && criterionData.length === 0 && (
                    <Grid size={12}>
                        <Typography variant="body2" color="text.secondary" align="center" py={3}>
                            Aún no hay datos de notas para este paralelo.
                        </Typography>
                    </Grid>
                )}

            </Grid>
        </MainCard>
    );
};

CourseStatsPanel.propTypes = {
    courseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    courseName: PropTypes.string,
    token: PropTypes.string,
    criteriaGrades: PropTypes.array,
    studentMode: PropTypes.bool,
};

export default CourseStatsPanel;
