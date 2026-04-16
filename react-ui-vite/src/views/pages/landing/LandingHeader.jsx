
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Box, Container, IconButton, Drawer, List, ListItem, Typography, Stack } from '@mui/material';
import { IconMenu2, IconX, IconArrowRight, IconSun, IconMoon } from '@tabler/icons-react';
import logo from './../../../assets/images/logo_emergentes.png';

const NAV_LINKS = [
    { label: 'Inicio', to: '/' },
    { label: 'Cursos', to: '/courses' },
    { label: 'Acerca de', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Publicaciones', to: '/publications' },
    { label: 'Actividades', to: '/project-registration' },
];

const LandingHeader = ({ isDark, onToggleTheme }) => {
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const isActive = (to) => location.pathname === to;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Dynamic colors ───────────────────────────────────────────────────────
    const C = isDark ? {
        navBg: 'rgba(7, 12, 24, 0.88)',
        drawerBg: '#0c1020',
        border: '#1e1a3a',
        purple: '#8b5cf6',
        purpleLight: '#c4b5fd',
        text: '#e2dff0',
        textMuted: '#6b6888',
        toggleBg: '#1a1530',
        toggleHover: '#251f42',
    } : {
        navBg: 'rgba(250, 248, 255, 0.92)',
        drawerBg: '#ffffff',
        border: '#e0daf4',
        purple: '#6d28d9',
        purpleLight: '#8b5cf6',
        text: '#1c1033',
        textMuted: '#7566a0',
        toggleBg: '#ede8ff',
        toggleHover: '#e0d8ff',
    };

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    background: scrolled ? C.navBg : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
                    borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1200,
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 1.5 }}>
                        {/* Logo */}
                        <Box
                            component={RouterLink}
                            to="/"
                            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexGrow: 1 }}
                        >
                            <Box sx={{
                                width: 120,
                                height: 46,
                                maskImage: `url(${logo})`,
                                WebkitMaskImage: `url(${logo})`,
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskPosition: 'center left',
                                WebkitMaskPosition: 'center left',
                                background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                                flexShrink: 0,
                            }} />
                        </Box>

                        {/* Desktop Nav */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                            {NAV_LINKS.map((link) => (
                                <Box
                                    key={link.to}
                                    component={RouterLink}
                                    to={link.to}
                                    sx={{
                                        position: 'relative',
                                        px: 1.75,
                                        py: 0.75,
                                        textDecoration: 'none',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '0.875rem',
                                        fontWeight: isActive(link.to) ? 600 : 400,
                                        color: isActive(link.to) ? C.purple : C.textMuted,
                                        letterSpacing: '0.01em',
                                        transition: 'color 0.2s ease',
                                        '&:hover': { color: C.text },
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: isActive(link.to) ? '55%' : '0%',
                                            height: '2px',
                                            background: `linear-gradient(90deg, ${C.purple}, ${C.purpleLight})`,
                                            borderRadius: '2px',
                                            transition: 'width 0.25s ease',
                                        },
                                        '&:hover::after': { width: '40%' },
                                    }}
                                >
                                    {link.label}
                                </Box>
                            ))}
                        </Box>

                        {/* Theme Toggle */}
                        <IconButton
                            onClick={onToggleTheme}
                            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                            sx={{
                                width: 36,
                                height: 36,
                                background: C.toggleBg,
                                border: `1px solid ${C.border}`,
                                borderRadius: '8px',
                                color: C.purple,
                                transition: 'all 0.2s',
                                '&:hover': { background: C.toggleHover, transform: 'scale(1.05)' },
                            }}
                        >
                            {isDark
                                ? <IconSun size={16} />
                                : <IconMoon size={16} />
                            }
                        </IconButton>

                        {/* Login CTA */}
                        <Box
                            component={RouterLink}
                            to="/login"
                            sx={{
                                display: { xs: 'none', md: 'inline-flex' },
                                alignItems: 'center',
                                gap: 0.75,
                                textDecoration: 'none',
                                px: 2.5,
                                py: 1,
                                border: `1px solid ${C.purple}`,
                                borderRadius: '6px',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: C.purple,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: C.purple,
                                    color: isDark ? '#070c18' : '#ffffff',
                                    boxShadow: `0 0 20px ${C.purple}40`,
                                },
                            }}
                        >
                            Ingresar
                            <IconArrowRight size={15} />
                        </Box>

                        {/* Mobile Hamburger */}
                        <IconButton
                            sx={{ display: { xs: 'flex', md: 'none' }, color: C.text }}
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Abrir menú"
                        >
                            <IconMenu2 size="1.6rem" />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Spacer */}
            <Box sx={{ height: { xs: 64, md: 72 } }} />

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 300, background: C.drawerBg, borderLeft: `1px solid ${C.border}` } }}
            >
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
                    <Box sx={{
                        width: 100, height: 40,
                        maskImage: `url(${logo})`,
                        WebkitMaskImage: `url(${logo})`,
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskPosition: 'center left',
                        WebkitMaskPosition: 'center left',
                        background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                    }} />
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            onClick={onToggleTheme}
                            size="small"
                            sx={{ color: C.purple, background: C.toggleBg, borderRadius: '6px', border: `1px solid ${C.border}` }}
                        >
                            {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
                        </IconButton>
                        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: C.textMuted }}>
                            <IconX size="1.4rem" />
                        </IconButton>
                    </Stack>
                </Box>

                <List sx={{ pt: 2, px: 1.5 }}>
                    {NAV_LINKS.map((link) => (
                        <ListItem
                            key={link.to}
                            component={RouterLink}
                            to={link.to}
                            onClick={() => setDrawerOpen(false)}
                            sx={{
                                borderRadius: '6px',
                                mb: 0.5,
                                px: 2, py: 1.25,
                                textDecoration: 'none',
                                background: isActive(link.to) ? `${C.purple}12` : 'transparent',
                                borderLeft: isActive(link.to) ? `3px solid ${C.purple}` : '3px solid transparent',
                                '&:hover': { background: `${C.purple}08` },
                            }}
                        >
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: isActive(link.to) ? 600 : 400,
                                fontSize: '0.95rem',
                                color: isActive(link.to) ? C.purple : C.text,
                            }}>
                                {link.label}
                            </Typography>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ p: 2.5, mt: 'auto', borderTop: `1px solid ${C.border}` }}>
                    <Box
                        component={RouterLink}
                        to="/login"
                        onClick={() => setDrawerOpen(false)}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                            textDecoration: 'none',
                            py: 1.5,
                            border: `1px solid ${C.purple}`,
                            borderRadius: '6px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600, fontSize: '0.95rem',
                            color: C.purple,
                            transition: 'all 0.2s',
                            '&:hover': {
                                background: C.purple,
                                color: isDark ? '#070c18' : '#ffffff',
                            },
                        }}
                    >
                        Ingresar al Sistema
                        <IconArrowRight size={16} />
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default LandingHeader;
