import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Button, CardActions, CardContent, Divider, Grid, Menu, MenuItem, Typography } from '@mui/material';

// project imports
import BajajAreaChartCard from './BajajAreaChartCard';
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonPopularCard from './../../../ui-component/cards/Skeleton/PopularCard';
import { gridSpacing } from './../../../store/constant';
import { getScheduleItems } from '../../../utils/scheduleUtils';

// assets
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';

//-----------------------|| DASHBOARD DEFAULT - POPULAR CARD ||-----------------------//

const PopularCard = ({ isLoading, popularCourses, title, viewAllLink }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonPopularCard />
            ) : (
                <MainCard content={false}>
                    <CardContent>
                        <Grid container spacing={gridSpacing}>
                            <Grid size={12}>
                                <Grid container alignContent="center" justifyContent="space-between">
                                    <Grid>
                                        <Typography variant="h4">{title || 'Datos Populares'}</Typography>
                                    </Grid>
                                    <Grid>
                                        <MoreHorizOutlinedIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.primary[200], cursor: 'pointer' }}
                                            aria-controls="menu-popular-card"
                                            aria-haspopup="true"
                                            onClick={handleClick}
                                        />
                                        <Menu
                                            id="menu-popular-card"
                                            anchorEl={anchorEl}
                                            keepMounted
                                            open={Boolean(anchorEl)}
                                            onClose={handleClose}
                                            variant="selectedMenu"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        >
                                            <MenuItem onClick={handleClose} component={Link} to={viewAllLink || '#'}>
                                                Ver Todos
                                            </MenuItem>
                                        </Menu>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid size={12}>
                                {popularCourses && popularCourses.map((course, index) => (
                                    <React.Fragment key={index}>
                                        <Grid container direction="column">
                                            <Grid>
                                                <Grid container alignItems="center" justifyContent="space-between">
                                                    <Grid>
                                                        <Typography variant="subtitle1" color="inherit">
                                                            {course.name}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {course.count}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid>
                                                                <Avatar
                                                                    variant="rounded"
                                                                    sx={{
                                                                        width: 16,
                                                                        height: 16,
                                                                        borderRadius: '5px',
                                                                        bgcolor: theme.palette.success.light,
                                                                        color: theme.palette.success.dark,
                                                                        ml: '15px',
                                                                    }}
                                                                >
                                                                    <KeyboardArrowUpOutlinedIcon fontSize="small" color="inherit" />
                                                                </Avatar>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid>
                                                <Typography variant="subtitle2" sx={{ color: theme.palette.success.dark }}>
                                                    {course.period}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" component="div">
                                                    {getScheduleItems(course.schedule).map((item, idx) => (
                                                        <div key={idx}>{item}</div>
                                                    ))}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        {index < popularCourses.length - 1 && (
                                            <Divider sx={{ mt: '12px', mb: '12px' }} />
                                        )}
                                    </React.Fragment>
                                ))}
                                {(!popularCourses || popularCourses.length === 0) && (
                                    <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2.5 }}>
                                        No hay datos disponibles.
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                    <CardActions sx={{ p: '10px', pt: 0, justifyContent: 'center' }}>
                        <Button size="small" disableElevation component={Link} to={viewAllLink || '#'}>
                            Ver Todos
                            <ChevronRightOutlinedIcon />
                        </Button>
                    </CardActions>
                </MainCard>
            )}
        </React.Fragment>
    );
};

PopularCard.propTypes = {
    isLoading: PropTypes.bool,
    popularCourses: PropTypes.array,
    title: PropTypes.string,
    viewAllLink: PropTypes.string,
};

export default PopularCard;
