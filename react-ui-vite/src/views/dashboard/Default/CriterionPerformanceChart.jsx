import PropTypes from 'prop-types';
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import MainCard from '../../../ui-component/cards/MainCard';
import SkeletonTotalGrowthBarChart from '../../../ui-component/cards/Skeleton/TotalGrowthBarChart';

const CriterionTooltip = ({ active, payload }) => {
    const theme = useTheme();
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <Box sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 1.5,
            boxShadow: 3,
        }}>
            <Typography variant="subtitle2" fontWeight={700}>{d.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
                Promedio: <strong>{d.promedio} / {d.maximo} pts</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Rendimiento: <strong>{d.pct}%</strong>
            </Typography>
        </Box>
    );
};

//-----------|| DASHBOARD - CRITERION PERFORMANCE CHART ||-----------//

const CriterionPerformanceChart = ({ isLoading, criterionData, courseName }) => {
    const theme = useTheme();

    const getBarColor = (pct) => {
        if (pct >= 70) return theme.palette.success.main;
        if (pct >= 50) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const hasData = criterionData && criterionData.length > 0;

    // Dynamic domain: floor to nearest 10 below min value (with padding), capped at 100
    // Dynamic YAxis width based on longest label (approx 7px per char + 16px padding)
    const yAxisWidth = React.useMemo(() => {
        if (!hasData) return 80;
        const longest = Math.max(...criterionData.map((d) => (d.name || '').length));
        return Math.min(Math.max(longest * 7 + 16, 48), 160);
    }, [criterionData, hasData]);

    const dynamicDomain = React.useMemo(() => {
        if (!hasData) return [0, 100];
        const minPct = Math.min(...criterionData.map((d) => d.pct));
        const maxPct = Math.max(...criterionData.map((d) => d.pct));
        const lower = Math.max(0, Math.floor((minPct - 10) / 10) * 10);
        const upper = Math.min(100, Math.ceil((maxPct + 5) / 10) * 10);
        return [lower, upper];
    }, [criterionData, hasData]);

    return (
        <>
            {isLoading ? (
                <SkeletonTotalGrowthBarChart />
            ) : (
                <MainCard
                    contentSX={{
                        p: '20px !important',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                    }}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        // Make the inner Card element also stretch
                        '& .MuiCardContent-root': {
                            flex: 1,
                        },
                    }}
                >
                    {/* Header */}
                    <Box mb={1.5} flexShrink={0}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                fontSize: '0.7rem',
                            }}
                        >
                            Rendimiento por Criterio de Evaluación
                        </Typography>
                        {courseName && (
                            <Typography variant="caption" color="text.secondary">
                                {courseName}
                            </Typography>
                        )}
                    </Box>

                    {hasData ? (
                        /* Flex column that fills remaining card height */
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {/* ResponsiveContainer fills all available vertical space */}
                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={criterionData}
                                        margin={{ top: 4, right: 52, left: 0, bottom: 4 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            stroke={theme.palette.grey[200]}
                                        />
                                        <XAxis
                                            type="number"
                                            domain={dynamicDomain}
                                            unit="%"
                                            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={yAxisWidth}
                                            tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            content={<CriterionTooltip />}
                                            cursor={{ fill: theme.palette.action.hover }}
                                        />
                                        <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={28}>
                                            {criterionData.map((entry, i) => (
                                                <Cell key={`cell-${i}`} fill={getBarColor(entry.pct)} />
                                            ))}
                                            <LabelList
                                                dataKey="pct"
                                                position="right"
                                                formatter={(v) => `${v}%`}
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    fill: theme.palette.text.primary,
                                                }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Legend — fixed at bottom */}
                            <Box mt={1} display="flex" gap={2} flexWrap="wrap" justifyContent="flex-end" flexShrink={0}>
                                {[
                                    { color: 'success.main', label: '≥ 70%' },
                                    { color: 'warning.main', label: '50–69%' },
                                    { color: 'error.main', label: '< 50%' },
                                ].map(({ color, label }) => (
                                    <Box key={label} display="flex" alignItems="center" gap={0.5}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color }} />
                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" align="center">
                                Selecciona un paralelo para ver el rendimiento por criterio.
                            </Typography>
                        </Box>
                    )}
                </MainCard>
            )}
        </>
    );
};

CriterionPerformanceChart.propTypes = {
    isLoading: PropTypes.bool,
    criterionData: PropTypes.array,
    courseName: PropTypes.string,
};

export default CriterionPerformanceChart;
