import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useSelector } from 'react-redux';
import { Avatar, Box, ButtonBase, Typography } from '@mui/material';

// project imports
import LogoSection from '../LogoSection';
import SearchSection from './SearchSection';
import ProfileSection from './ProfileSection';

// assets
import { IconMenu2 } from '@tabler/icons-react';

//-----------------------|| MAIN NAVBAR / HEADER ||-----------------------//

const Header = ({ handleLeftDrawerToggle }) => {
    const activeCourse = useSelector((state) => state.account.activeCourse);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* logo & toggler button */}
            <Box sx={{ width: { xs: 'auto', md: '228px' }, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
                    <LogoSection />
                </Box>
                <ButtonBase
                    sx={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        width: '34px',
                        height: '34px',
                        flexShrink: 0,
                    }}
                    onClick={handleLeftDrawerToggle}
                    aria-label="open drawer"
                >
                    <Avatar
                        variant="rounded"
                        sx={(theme) => ({
                            ...theme.typography.commonAvatar,
                            ...theme.typography.mediumAvatar,
                            width: '34px',
                            height: '34px',
                            transition: 'all .2s ease-in-out',
                            bgcolor: 'secondary.light',
                            color: 'secondary.dark',
                            '&:hover': {
                                bgcolor: 'secondary.dark',
                                color: 'secondary.light',
                            },
                        })}
                        color="inherit"
                    >
                        <IconMenu2 stroke={1.5} size="1.3rem" />
                    </Avatar>
                </ButtonBase>
            </Box>

            {/* header search */}
            <SearchSection />

            {/* Mobile: active course name — uses flexGrow so it does NOT block touch events */}
            <Box
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    flexGrow: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    px: 1,
                    pointerEvents: 'none',
                }}
            >
                {activeCourse && (
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.75,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'primary.light',
                            bgcolor: 'primary.light',
                            maxWidth: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <Typography
                            variant="body2"
                            noWrap
                            sx={{
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: 'primary.dark',
                                fontSize: '0.78rem',
                                textAlign: 'center',
                            }}
                        >
                            {activeCourse.subject_details?.name || 'Sin materia'}
                            {activeCourse.parallel ? ` "${activeCourse.parallel}"` : ''}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Desktop: course info chips */}
            {activeCourse && (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
                    <Box
                        sx={{
                            p: 1.25,
                            px: 2,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'primary.light',
                            bgcolor: 'primary.light',
                            mr: 1,
                        }}
                    >
                        <Typography variant="subtitle1" color="primary.dark">
                            {activeCourse.subject_details ? activeCourse.subject_details.name : 'Unknown Subject'}
                            {activeCourse.parallel ? ` - ${activeCourse.parallel}` : ''}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            p: 1.25,
                            px: 2,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'secondary.light',
                            bgcolor: 'secondary.light',
                            mr: 1,
                        }}
                    >
                        <Typography variant="subtitle1" color="secondary.dark">
                            {activeCourse.subject_details?.period_details
                                ? activeCourse.subject_details.period_details.name
                                : 'No Period'}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            p: 1.25,
                            px: 2,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'orange.light',
                            bgcolor: 'orange.light',
                        }}
                    >
                        <Typography variant="subtitle1" color="orange.dark">
                            {activeCourse.subject_details?.program_details
                                ? activeCourse.subject_details.program_details.name
                                : 'No Program'}
                        </Typography>
                    </Box>
                </Box>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <ProfileSection />
        </Box>
    );
};

Header.propTypes = {
    handleLeftDrawerToggle: PropTypes.func
};

export default Header;
