import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Grid, Typography } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonTotalOrderCard from './../../../ui-component/cards/Skeleton/EarningCard';

// assets
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';

//-----------------------|| DASHBOARD - TOTAL ORDER CARD ||-----------------------//

const TotalOrderLineChartCard = ({ isLoading, title, count, icon }) => {
    const theme = useTheme();

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
                        <Grid sx={{ mb: 0.75 }}>
                            <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: '14px', mb: '6px' }}>
                                {count}
                            </Typography>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.primary[200] }}>
                                {title}
                            </Typography>
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
