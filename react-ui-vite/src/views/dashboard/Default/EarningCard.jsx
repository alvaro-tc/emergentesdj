import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Grid, Menu, MenuItem, Typography } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonEarningCard from './../../../ui-component/cards/Skeleton/EarningCard';

// assets
import EarningIcon from './../../../assets/images/icons/earning.svg';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import GetAppTwoToneIcon from '@mui/icons-material/GetAppOutlined';
import FileCopyTwoToneIcon from '@mui/icons-material/FileCopyOutlined';
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ArchiveTwoToneIcon from '@mui/icons-material/ArchiveOutlined';

//===========================|| DASHBOARD DEFAULT - EARNING CARD ||===========================//

const EarningCard = ({ isLoading, title, count, icon }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonEarningCard />
            ) : (
                <MainCard
                    border={false}
                    sx={{
                        backgroundColor: theme.palette.secondary.dark,
                        color: '#fff',
                        overflow: 'hidden',
                        position: 'relative',
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            width: '210px',
                            height: '210px',
                            background: theme.palette.secondary[800],
                            borderRadius: '50%',
                            top: '-85px',
                            right: '-95px',
                        },
                        '&:before': {
                            content: '""',
                            position: 'absolute',
                            width: '210px',
                            height: '210px',
                            background: theme.palette.secondary[800],
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
                                            bgcolor: theme.palette.secondary[800],
                                            mt: 1,
                                        }}
                                    >
                                        {icon || <img src={EarningIcon} alt="Earning" />}
                                    </Avatar>
                                </Grid>
                                <Grid>
                                    <Avatar
                                        variant="rounded"
                                        sx={{
                                            ...theme.typography.commonAvatar,
                                            ...theme.typography.mediumAvatar,
                                            bgcolor: theme.palette.secondary.dark,
                                            color: theme.palette.secondary[200],
                                            zIndex: 1,
                                            cursor: 'pointer',
                                        }}
                                        aria-controls="menu-earning-card"
                                        aria-haspopup="true"
                                        onClick={handleClick}
                                    >
                                        <MoreHorizIcon fontSize="inherit" />
                                    </Avatar>
                                    <Menu
                                        id="menu-earning-card"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                        variant="selectedMenu"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    >
                                        <MenuItem onClick={handleClose}>
                                            <GetAppTwoToneIcon fontSize="inherit" sx={{ mr: '14px', fontSize: '1.25rem' }} /> Import Card
                                        </MenuItem>
                                        <MenuItem onClick={handleClose}>
                                            <FileCopyTwoToneIcon fontSize="inherit" sx={{ mr: '14px', fontSize: '1.25rem' }} /> Copy Data
                                        </MenuItem>
                                        <MenuItem onClick={handleClose}>
                                            <PictureAsPdfTwoToneIcon fontSize="inherit" sx={{ mr: '14px', fontSize: '1.25rem' }} /> Export
                                        </MenuItem>
                                        <MenuItem onClick={handleClose}>
                                            <ArchiveTwoToneIcon fontSize="inherit" sx={{ mr: '14px', fontSize: '1.25rem' }} /> Archive File
                                        </MenuItem>
                                    </Menu>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid>
                            <Grid container alignItems="center">
                                <Grid>
                                    <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: '14px', mb: '6px' }}>
                                        {count}
                                    </Typography>
                                </Grid>
                                <Grid>
                                    <Avatar
                                        sx={{
                                            cursor: 'pointer',
                                            ...theme.typography.smallAvatar,
                                            bgcolor: theme.palette.secondary[200],
                                            color: theme.palette.secondary.dark,
                                        }}
                                    >
                                        <ArrowUpwardIcon fontSize="inherit" sx={{ transform: 'rotate3d(1,1,1,45deg)' }} />
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid sx={{ mb: 1.25 }}>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.secondary[200] }}>
                                {title}
                            </Typography>
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </React.Fragment>
    );
};

EarningCard.propTypes = {
    isLoading: PropTypes.bool,
    title: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.element
};

export default EarningCard;
