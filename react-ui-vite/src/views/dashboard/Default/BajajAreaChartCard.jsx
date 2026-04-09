import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Grid, Typography } from '@mui/material';

// third-party
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

//===========================|| DASHBOARD DEFAULT - BAJAJ AREA CHART CARD ||===========================//

const SERIES_DATA = [0, 15, 10, 50, 30, 40, 25].map((value, index) => ({ index, value }));

const BajajAreaChartCard = () => {
    const theme = useTheme();
    const orangeDark = theme.palette.secondary[800];

    return (
        <Card sx={{ bgcolor: 'secondary.light' }}>
            <CardContent sx={{ p: '0px !important' }}>
                <Grid container sx={{ p: 2, pb: 0, color: '#fff' }}>
                    <Grid size={12}>
                        <Grid container alignItems="center" justifyContent="space-between">
                            <Grid>
                                <Typography variant="subtitle1" sx={{ color: theme.palette.secondary.dark }}>
                                    Bajaj Finery
                                </Typography>
                            </Grid>
                            <Grid>
                                <Typography variant="h4" sx={{ color: theme.palette.grey[800] }}>
                                    $1839.00
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid size={12}>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.grey[800] }}>
                            10% Profit
                        </Typography>
                    </Grid>
                </Grid>
                <ResponsiveContainer width="100%" height={95}>
                    <AreaChart data={SERIES_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="bajajGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={orangeDark} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={orangeDark} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            formatter={(val) => [`Ticket ${val}`, '']}
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={orangeDark}
                            strokeWidth={1}
                            fill="url(#bajajGradient)"
                            dot={false}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default BajajAreaChartCard;
