import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { Avatar, Box, ButtonBase } from '@mui/material';

// project imports
import LogoSection from '../LogoSection';
import ProfileSection from './ProfileSection';

// assets
import { IconMenu2 } from '@tabler/icons-react';

//-----------------------|| MAIN NAVBAR / HEADER ||-----------------------//

// El contexto de trabajo (curso, periodo, carrera) vive en la cabecera del sidebar,
// por lo que la barra superior solo conserva navegación y perfil.
const Header = ({ handleLeftDrawerToggle }) => (
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

        <Box sx={{ flexGrow: 1 }} />

        <ProfileSection />
    </Box>
);

Header.propTypes = {
    handleLeftDrawerToggle: PropTypes.func
};

export default Header;
