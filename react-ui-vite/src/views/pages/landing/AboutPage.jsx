import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { KEYFRAMES, fadeUp } from './LandingTheme';
import { IconBulb, IconUsers, IconWorld } from '@tabler/icons-react'; // Better icons than emojis

const AboutPage = () => {
    // ── Theme state (from shared LandingLayout) ──────────────────────────────
    const { isDark, C, DOT } = useOutletContext();

    const objectives = [
        {
            icon: IconBulb,
            title: 'Educación Innovadora',
            description: 'Ofrecer cursos actualizados sobre tecnologías emergentes, Desarrollo Web, Comercio Electrónico, Seguridad Informática, IA y Blockchain.'
        },
        {
            icon: IconWorld,
            title: 'Accesibilidad',
            description: 'Garantizar que estudiantes y profesionales de diversas áreas y regiones geográficas accedan a formación de primer nivel.'
        },
        {
            icon: IconUsers,
            title: 'Comunidad Tecnológica',
            description: 'Fomentar una red de aprendizaje colaborativo a través de plataformas virtuales y grupos de discusión.'
        }
    ];

    const SectionLabel = ({ text }) => (
        <Typography sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.purple,
            mb: 1.5,
        }}>
            {text}
        </Typography>
    );

    const SectionHeading = ({ children }) => (
        <Typography sx={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: { xs: '2rem', md: '2.75rem' },
            fontWeight: 400,
            color: C.text,
            lineHeight: 1.2,
        }}>
            {children}
        </Typography>
    );

    return (
        <React.Fragment>
            <style>{KEYFRAMES}</style>
            <Box sx={{
                minHeight: '100vh',
                background: C.bg,
                backgroundImage: DOT,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Ambient glows */}
                <Box sx={{
                    position: 'absolute', top: '5%', left: '-8%',
                    width: { xs: 280, md: 480 }, height: { xs: 280, md: 480 },
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${C.purple}15 0%, transparent 70%)`,
                    pointerEvents: 'none', zIndex: 0,
                }} />
                <Box sx={{
                    position: 'absolute', top: '-5%', right: '10%',
                    width: { xs: 180, md: 380 }, height: { xs: 180, md: 380 },
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${C.purpleLight}10 0%, transparent 70%)`,
                    pointerEvents: 'none', zIndex: 0,
                }} />

                <Box sx={{ pt: { xs: 4, md: 6 } }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: 10 }}>
                    <Box sx={{ ...fadeUp(0.1), textAlign: 'center', mb: { xs: 6, md: 8 } }}>
                        <SectionLabel text="// Identidad y Visión" />
                        <SectionHeading>
                            Acerca de EMERGENTES
                        </SectionHeading>
                        <Typography sx={{
                            mt: 2,
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: { xs: '1rem', md: '1.05rem' },
                            color: C.textMuted,
                            lineHeight: 1.8,
                            maxWidth: 700,
                            mx: 'auto'
                        }}>
                            Conoce nuestra misión de formar profesionales del futuro liderando un mundo tecnológico en constante evolución.
                        </Typography>
                    </Box>

                    {/* Mission Card */}
                    <Box sx={{
                        ...fadeUp(0.2),
                        position: 'relative',
                        background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: `0 24px 64px ${C.frameShadow}`,
                        mb: { xs: 8, md: 12 },
                        p: { xs: 4, md: 8 },
                        color: '#fff',
                        textAlign: 'center'
                    }}>
                        {/* Inner ambient flare */}
                        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }} />
                        <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />

                        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 800, mx: 'auto' }}>
                            <Typography sx={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: { xs: '1.75rem', md: '2.5rem' },
                                mb: 3,
                                lineHeight: 1.2
                            }}>
                                Nuestra Misión
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: { xs: '1.05rem', md: '1.2rem' },
                                color: 'rgba(255,255,255,0.9)',
                                lineHeight: 1.8,
                            }}>
                                EMERGENTES es una plataforma educativa innovadora, diseñada para ofrecer formación de vanguardia en tecnologías de información y comunicación. Nuestro objetivo principal es preparar a estudiantes, docentes y profesionales para liderar en un mundo totalmente digital y sin fronteras.
                            </Typography>
                        </Box>
                    </Box>

                    {/* Objectives Section */}
                    <Box sx={{ mb: 6, ...fadeUp(0.3) }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
                            <SectionLabel text="// Pilares Fundamentales" />
                            <SectionHeading>
                                Nuestros Objetivos
                            </SectionHeading>
                        </Box>

                        <Grid container spacing={4} justifyContent="center">
                            {objectives.map((objective, index) => {
                                const Icon = objective.icon;
                                return (
                                    <Grid key={index} size={{ xs: 12, md: 4 }}>
                                        <Box sx={{
                                            p: 4, height: '100%',
                                            background: C.card,
                                            border: `1px solid ${C.border}`,
                                            borderRadius: '16px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                            transition: 'all 0.3s ease',
                                            position: 'relative', overflow: 'hidden',
                                            '&:hover': {
                                                borderColor: C.purpleLight,
                                                transform: 'translateY(-6px)',
                                                boxShadow: isDark
                                                    ? '0 16px 40px rgba(0,0,0,0.4)'
                                                    : `0 16px 40px ${C.purpleDim}`,
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                                background: `linear-gradient(90deg, ${C.purple}, ${C.purpleLight})`,
                                                opacity: 0,
                                                transition: 'opacity 0.3s',
                                            },
                                            '&:hover::before': { opacity: 1 },
                                        }}>
                                            <Box sx={{
                                                width: 64, height: 64, mb: 3,
                                                borderRadius: '14px',
                                                background: C.purpleDim,
                                                border: `1px solid ${C.purple}30`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: C.purple,
                                            }}>
                                                <Icon size={32} stroke={1.5} />
                                            </Box>
                                            
                                            <Typography sx={{
                                                fontFamily: "'DM Serif Display', serif",
                                                fontSize: '1.4rem',
                                                color: C.text,
                                                mb: 2,
                                                lineHeight: 1.2
                                            }}>
                                                {objective.title}
                                            </Typography>
                                            
                                            <Typography sx={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: '0.95rem',
                                                color: C.textMuted,
                                                lineHeight: 1.7,
                                            }}>
                                                {objective.description}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                </Container>
                
            </Box>
        </React.Fragment>
    );
};

export default AboutPage;
