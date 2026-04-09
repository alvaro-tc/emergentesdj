import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Button, Grid, Typography } from '@mui/material';

// third-party
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonTotalOrderCard from './../../../ui-component/cards/Skeleton/EarningCard';

// assets
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

//-----------------------|| DASHBOARD - TOTAL ORDER LINE CHART CARD ||-----------------------//

const MONTH_DATA = [45, 66, 41, 89, 25, 44, 9, 54].map((value, index) => ({ index, value }));
const YEAR_DATA = [35, 44, 9, 54, 45, 66, 41, 69].map((value, index) => ({ index, value }));

const TotalOrderLineChartCard = ({ isLoading, title, count, icon }) => {
    const theme = useTheme();
    const [timeValue, setTimeValue] = React.useState(false);

    const handleChangeTime = (event, newValue) => setTimeValue(newValue);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonTotalOrderCard />
            ) : (
                <MainCard
                    border={false}
                    sx={{
                        bgcolor: theme.palette.primary.dark,
                        color: '#fff',
                        overflow: 'hidden',
                        position: 'relative',
                        '& > div': { position: 'relative', zIndex: 5 },
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            width: '210px',
                            height: '210px',
                            background: theme.palette.primary[800],
                            borderRadius: '50%',
                            zIndex: 1,
                            top: '-85px',
                            right: '-95px',
                        },
                        '&:before': {
                            content: '""',
                            position: 'absolute',
                            zIndex: 1,
                            width: '210px',
                            height: '210px',
                            background: theme.palette.primary[800],
                            borderRadius: '50%',
                            top: '-125px',
                            right: '-15px',
                            opacity: 0.5,
                        },
                    }}
                    contentSX={{ p: '20px !important' }}
                >
                    <Grid container direction="column">
                        <Grid>
                            <Grid container justifyContent="space-between">
                                <Grid>
                                    <Avatar
                                        variant="rounded"
                                        sx={{
                                            ...theme.typography.commonAvatar,
                                            ...theme.typography.largeAvatar,
                                            bgcolor: theme.palette.primary[800],
                                            color: '#fff',
                                            mt: 1,
                                        }}
                                    >
                                        {icon || <LocalMallOutlinedIcon fontSize="inherit" />}
                                    </Avatar>
                                </Grid>
                                <Grid>
                                    <Button
                                        disableElevation
                                        variant={timeValue ? 'contained' : 'text'}
                                        size="small"
                                        sx={{ color: 'inherit' }}
                                        onClick={(e) => handleChangeTime(e, true)}
                                    >
                                        Month
                                    </Button>
                                    <Button
                                        disableElevation
                                        variant={!timeValue ? 'contained' : 'text'}
                                        size="small"
                                        sx={{ color: 'inherit' }}
                                        onClick={(e) => handleChangeTime(e, false)}
                                    >
                                        Year
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid sx={{ mb: 0.75 }}>
                            <Grid container alignItems="center">
                                <Grid size={6}>
                                    <Grid container alignItems="center">
                                        <Grid>
                                            <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: '14px', mb: '6px' }}>
                                                {count}
                                            </Typography>
                                        </Grid>
                                        <Grid>
                                            <Avatar
                                                sx={{
                                                    ...theme.typography.smallAvatar,
                                                    cursor: 'pointer',
                                                    bgcolor: theme.palette.primary[200],
                                                    color: theme.palette.primary.dark,
                                                }}
                                            >
                                                <ArrowDownwardIcon fontSize="inherit" sx={{ transform: 'rotate3d(1,1,1,45deg)' }} />
                                            </Avatar>
                                        </Grid>
                                        <Grid size={12}>
                                            <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.primary[200] }}>
                                                {title}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid size={6}>
                                    <ResponsiveContainer width="100%" height={90}>
                                        <LineChart
                                            data={timeValue ? MONTH_DATA : YEAR_DATA}
                                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                                        >
                                            <Tooltip
                                                formatter={(val) => [`Total Order: ${val}`, '']}
                                                contentStyle={{
                                                    backgroundColor: theme.palette.grey[900],
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    color: '#fff',
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#fff"
                                                strokeWidth={3}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </React.Fragment>
    );
};

TotalOrderLineChartCard.propTypes = {
    isLoading: PropTypes.bool,
    title: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.element
};

export default TotalOrderLineChartCard;
