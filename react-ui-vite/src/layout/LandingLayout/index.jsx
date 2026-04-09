import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, LinearProgress } from '@mui/material';
import LandingHeader from '../../views/pages/landing/LandingHeader';
import LandingFooter from '../../views/pages/landing/LandingFooter';
import { useLandingTheme } from '../../views/pages/landing/LandingTheme';

// Minimal loading bar that only covers the content area (header stays visible)
const ContentLoader = () => (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', pt: 1 }}>
        <LinearProgress color="secondary" sx={{ height: 2 }} />
    </Box>
);

const LandingLayout = () => {
    const { isDark, toggleTheme, C, DOT } = useLandingTheme();

    return (
        <Box sx={{ minHeight: '100vh', background: C.bg }}>
            <LandingHeader isDark={isDark} onToggleTheme={toggleTheme} />
            <Suspense fallback={<ContentLoader />}>
                <Outlet context={{ isDark, toggleTheme, C, DOT }} />
            </Suspense>
            <LandingFooter isDark={isDark} />
        </Box>
    );
};

export default LandingLayout;
