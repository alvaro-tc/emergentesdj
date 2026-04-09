import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

// material-ui
import { Grid, MenuItem, TextField, Typography, useTheme, Box } from '@mui/material';

// third-party
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// project imports
import SkeletonTotalGrowthBarChart from './../../../ui-component/cards/Skeleton/TotalGrowthBarChart';
import MainCard from './../../../ui-component/cards/MainCard';
import { gridSpacing } from './../../../store/constant';

const status = [
    { value: 'today', label: 'Today' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
];

const DEFAULT_CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, theme }) => {
    if (active && payload && payload.length) {
        return (
            <Box
                sx={{
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.primary.light}`,
                    borderRadius: '12px',
                    padding: '12px 18px',
                    boxShadow: `0 8px 32px ${theme.palette.primary.main}22`,
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        display: 'block',
                        mb: 0.5,
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                        lineHeight: 1,
                    }}
                >
                    {payload[0].value}
                    <Typography component="span" variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5, fontWeight: 400 }}>
                        registros
                    </Typography>
                </Typography>
            </Box>
        );
    }
    return null;
};

const CustomDot = (props) => {
    const { cx, cy, stroke, payload, value } = props;
    if (!value) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={6} fill="white" stroke={stroke} strokeWidth={2.5} />
            <circle cx={cx} cy={cy} r={3} fill={stroke} />
        </g>
    );
};

const CustomActiveDot = (props) => {
    const { cx, cy, stroke } = props;
    return (
        <g>
            <circle cx={cx} cy={cy} r={10} fill={stroke} fillOpacity={0.15} />
            <circle cx={cx} cy={cy} r={6} fill="white" stroke={stroke} strokeWidth={2.5} />
            <circle cx={cx} cy={cy} r={3} fill={stroke} />
        </g>
    );
};

//-----------------------|| DASHBOARD DEFAULT - TOTAL GROWTH AREA CHART ||-----------------------//

const TotalGrowthBarChart = ({ isLoading, growthData, title }) => {
    const [value, setValue] = React.useState('today');
    const theme = useTheme();

    const primaryMain = theme.palette.primary.main;
    const primaryLight = theme.palette.primary.light;
    const primaryDark = theme.palette.primary.dark;

    const chartData = useMemo(() => {
        if (growthData?.length) {
            return growthData.map((item) => ({ name: item.month, Registros: item.count }));
        }
        return DEFAULT_CATEGORIES.map((month) => ({ name: month, Registros: 0 }));
    }, [growthData]);

    const totalRegistros = useMemo(() => {
        return chartData.reduce((sum, item) => sum + (item.Registros || 0), 0);
    }, [chartData]);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonTotalGrowthBarChart />
            ) : (
                <MainCard
                    sx={{
                        overflow: 'hidden',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '280px',
                            height: '280px',
                            background: `radial-gradient(circle at top right, ${primaryMain}18 0%, transparent 65%)`,
                            pointerEvents: 'none',
                        },
                    }}
                >
                    <Grid container spacing={gridSpacing}>
                        <Grid size={12}>
                            <Grid container alignItems="center" justifyContent="space-between">
                                <Grid>
                                    <Grid container direction="column" spacing={1}>
                                        <Grid>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    fontWeight: 600,
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.7rem',
                                                }}
                                            >
                                                {title || 'Crecimiento Total'}
                                            </Typography>
                                        </Grid>
                                        <Grid>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                                <Typography
                                                    variant="h3"
                                                    sx={{
                                                        fontWeight: 800,
                                                        background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryMain} 100%)`,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        backgroundClip: 'text',
                                                        lineHeight: 1.1,
                                                    }}
                                                >
                                                    {totalRegistros}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                                    Registros
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid>
                                    <TextField
                                        id="standard-select-currency"
                                        select
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '10px',
                                                fontSize: '0.8rem',
                                            },
                                        }}
                                    >
                                        {status.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid size={12}>
                            <ResponsiveContainer width="100%" height={480}>
                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={primaryMain} stopOpacity={0.35} />
                                            <stop offset="50%" stopColor={primaryMain} stopOpacity={0.12} />
                                            <stop offset="100%" stopColor={primaryMain} stopOpacity={0.01} />
                                        </linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        stroke={theme.palette.grey[200]}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={8}
                                    />
                                    <YAxis
                                        tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-4}
                                        width={40}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip theme={theme} />}
                                        cursor={{
                                            stroke: primaryMain,
                                            strokeWidth: 1,
                                            strokeDasharray: '4 4',
                                            strokeOpacity: 0.5,
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: 13,
                                            paddingTop: 20,
                                            color: theme.palette.text.secondary,
                                            fontWeight: 500,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Registros"
                                        stroke={primaryMain}
                                        strokeWidth={2.5}
                                        fill="url(#colorRegistros)"
                                        dot={<CustomDot stroke={primaryMain} />}
                                        activeDot={<CustomActiveDot stroke={primaryMain} />}
                                        filter="url(#glow)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </React.Fragment>
    );
};

TotalGrowthBarChart.propTypes = {
    isLoading: PropTypes.bool,
    growthData: PropTypes.array,
    title: PropTypes.string
};

export default TotalGrowthBarChart;
