
import React from 'react';
import { Link as RouterLink, useOutletContext } from 'react-router-dom';
import { Grid, Typography, Container, Box, Stack, CircularProgress } from '@mui/material';
import {
    IconArrowRight,
    IconBrandWhatsapp,
    IconExternalLink,
    IconSchool,
    IconClipboardList,
    IconCertificate,
    IconCalendarTime,
    IconZoomIn,
    IconZoomOut,
} from '@tabler/icons-react';

import axios from 'axios';
import configData from '../../../config';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { getScheduleItems } from '../../../utils/scheduleUtils';
import { KEYFRAMES, fadeUp, DARK, LIGHT } from './LandingTheme';
import CourseCard from './CourseCard';

// ─── Features data ────────────────────────────────────────────────────────────
const FEATURES = [
    { icon: IconSchool, num: '01', title: 'Gestión de Cursos', desc: 'Administra inscripciones, materiales y paralelos de cada asignatura desde un panel centralizado.' },
    { icon: IconClipboardList, num: '02', title: 'Proyectos Estudiantiles', desc: 'Registra y da seguimiento a los avances de proyectos con control por etapas y criterios.' },
    { icon: IconCertificate, num: '03', title: 'Sistema de Evaluaciones', desc: 'Plantillas flexibles, notas por criterio y cálculo automático del promedio final.' },
];

// ─── DiagramFrame ─────────────────────────────────────────────────────────────
// Muestra el drawio PNG dentro de un marco tipo ventana de aplicación
const DiagramFrame = ({ src, isDark }) => {
    const C = isDark ? DARK : LIGHT;
    const [zoom, setZoom] = React.useState(1);

    const handleZoomIn = (e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.25, 2)); };
    const handleZoomOut = (e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.25, 0.5)); };

    return (
        <Box sx={{
            ...fadeUp(0.2),
            position: 'relative',
            width: '100%',
            maxWidth: 560,
            animation: `lp-fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both, lp-float 6s ease-in-out 1s infinite`,
        }}>
            {/* Outer glow */}
            <Box sx={{
                position: 'absolute',
                inset: '-16px -8px',
                borderRadius: '20px',
                background: `radial-gradient(ellipse at 50% 40%, ${C.purple}22 0%, transparent 70%)`,
                filter: 'blur(18px)',
                zIndex: 0,
                pointerEvents: 'none',
            }} />

            {/* Window frame */}
            <Box sx={{
                position: 'relative',
                zIndex: 1,
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid ${C.border}`,
                boxShadow: `0 20px 60px ${C.frameShadow}, 0 0 0 1px ${C.border}`,
            }}>
                {/* ── Title bar ── */}
                <Box sx={{
                    background: C.windowBar,
                    borderBottom: `1px solid ${C.border}`,
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    userSelect: 'none',
                }}>
                    {/* Traffic-light dots */}
                    <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                        <Box sx={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', boxShadow: '0 0 4px #ff5f5760' }} />
                        <Box sx={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', boxShadow: '0 0 4px #febc2e60' }} />
                        <Box sx={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', boxShadow: '0 0 4px #28c84060' }} />
                    </Stack>

                    {/* Filename tab */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                    }}>
                        <Box sx={{
                            px: 1.5, py: 0.4,
                            background: isDark ? '#1f1a38' : '#e8e0ff',
                            border: `1px solid ${C.border}`,
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                        }}>
                            {/* Drawio icon (simplified) */}
                            <Box sx={{
                                width: 12, height: 12, borderRadius: '2px',
                                background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                                flexShrink: 0,
                            }} />
                            <Typography sx={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.68rem',
                                color: C.windowText,
                                letterSpacing: '0.02em',
                                whiteSpace: 'nowrap',
                            }}>
                                CausalGrupo.drawio
                            </Typography>
                        </Box>
                    </Box>

                    {/* Zoom controls */}
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                        <Box
                            onClick={handleZoomOut}
                            sx={{
                                width: 24, height: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: C.windowText,
                                transition: 'all 0.15s',
                                '&:hover': { background: isDark ? '#2a2250' : '#ddd4f8', color: C.purple },
                            }}
                        >
                            <IconZoomOut size={13} />
                        </Box>
                        <Box
                            onClick={handleZoomIn}
                            sx={{
                                width: 24, height: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: C.windowText,
                                transition: 'all 0.15s',
                                '&:hover': { background: isDark ? '#2a2250' : '#ddd4f8', color: C.purple },
                            }}
                        >
                            <IconZoomIn size={13} />
                        </Box>
                    </Stack>
                </Box>

                {/* ── Image area ── */}
                <Box sx={{
                    background: '#ffffff',
                    overflow: 'hidden',
                    maxHeight: { xs: 260, md: 380 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}>
                    {/* Checkerboard pattern for transparent areas */}
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='10' height='10' fill='%23f5f5f5'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23f5f5f5'/%3E%3Crect x='10' y='0' width='10' height='10' fill='%23ebebeb'/%3E%3Crect x='0' y='10' width='10' height='10' fill='%23ebebeb'/%3E%3C/svg%3E")`,
                        opacity: 0.5,
                    }} />
                    <img
                        src={src}
                        alt="Diagrama del sistema"
                        draggable={false}
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                        }}
                    />
                </Box>

                {/* ── Status bar ── */}
                <Box sx={{
                    background: C.windowBar,
                    borderTop: `1px solid ${C.border}`,
                    px: 2, py: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Typography sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.6rem',
                        color: C.windowText,
                        letterSpacing: '0.06em',
                    }}>
                        Modelo Causal — Vista de solo lectura
                    </Typography>
                    <Typography sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.6rem',
                        color: `${C.purple}90`,
                        letterSpacing: '0.06em',
                    }}>
                        {Math.round(zoom * 100)}%
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

// ─── LandingPage ──────────────────────────────────────────────────────────────
const LandingPage = () => {
    const [courses, setCourses] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [landingConfig, setLandingConfig] = React.useState(null);

    // ── Theme state (from shared LandingLayout) ──────────────────────────────
    const { isDark, C, DOT } = useOutletContext();

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get(`${configData.API_SERVER}student-course-registration/open_courses/`);
                setCourses(res.data);
            } catch { }
            finally { setLoading(false); }
        };
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${configData.API_SERVER}landing-page-config/`);
                setLandingConfig(res.data);
            } catch { }
        };
        fetchCourses();
        fetchConfig();
    }, []);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const base = configData.API_SERVER.replace(/\/api\/$/, '');
        const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${base}${path}`;
    };

    // Determine the hero image source
    const heroImageSrc = landingConfig?.landing_image
        ? getImageUrl(landingConfig.landing_image)
        : `${configData.API_SERVER.replace(/\/api\/$/, '')}/media/landing-page/CausalGrupo.drawio.png`;

    const sliderSettings = {
        dots: true,
        infinite: courses.length > 3,
        speed: 600,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1, infinite: courses.length > 2 } },
            { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1, infinite: courses.length > 1 } },
        ],
    };

    // ─── Section label helper ────────────────────────────────────────────────
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
        <>
            <style>{KEYFRAMES}</style>
            <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>

                {/* ══════════════════ HERO ══════════════════════════════════════ */}
                <Box sx={{
                    position: 'relative',
                    background: C.bg,
                    backgroundImage: DOT,
                    overflow: 'hidden',
                    pb: { xs: 8, md: 12 },
                    transition: 'background 0.3s ease',
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
                    {/* Decorative rings */}
                    <Box sx={{
                        position: 'absolute', bottom: '8%', right: '-60px',
                        width: 260, height: 260,
                        border: `1px solid ${C.border}`,
                        borderRadius: '50%',
                        opacity: 0.5, pointerEvents: 'none', zIndex: 0,
                    }} />

                    <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 8 }, position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">

                            {/* ── Left ── */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <Box sx={{ ...fadeUp(0.05), display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <Box sx={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: C.purple,
                                        boxShadow: `0 0 10px ${C.purple}`,
                                        animation: 'lp-blink 2.5s ease-in-out infinite',
                                    }} />
                                    <Typography sx={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '0.7rem',
                                        letterSpacing: '0.16em',
                                        textTransform: 'uppercase',
                                        color: C.purple,
                                    }}>
                                        Plataforma Académica
                                    </Typography>
                                </Box>

                                <Box sx={fadeUp(0.15)}>
                                    <Typography sx={{
                                        fontFamily: "'DM Serif Display', 'Georgia', serif",
                                        fontSize: { xs: '2.5rem', sm: '3rem', md: '3.8rem', lg: '4.2rem' },
                                        fontWeight: 400,
                                        lineHeight: 1.1,
                                        color: C.text,
                                        mb: 0.5,
                                    }}>
                                        Bienvenido a la
                                    </Typography>
                                    <Typography component="span" sx={{
                                        display: 'block',
                                        fontFamily: "'DM Serif Display', 'Georgia', serif",
                                        fontSize: { xs: '2.5rem', sm: '3rem', md: '3.8rem', lg: '4.2rem' },
                                        fontWeight: 400,
                                        lineHeight: 1.1,
                                        background: `linear-gradient(90deg, ${C.purple}, ${C.purpleLight}, ${C.purple})`,
                                        backgroundSize: '200% auto',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        animation: 'lp-shimmer 6s linear infinite',
                                        mb: 3,
                                    }}>
                                        Plataforma EMERGENTES
                                    </Typography>
                                </Box>

                                <Typography sx={{
                                    ...fadeUp(0.25),
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: { xs: '1rem', md: '1.05rem' },
                                    color: C.textMuted,
                                    lineHeight: 1.8,
                                    maxWidth: 460,
                                    mb: 4,
                                }}>
                                    Gestiona cursos, proyectos y evaluaciones desde un único panel. Tecnología moderna para la administración académica de tu institución.
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={fadeUp(0.35)}>
                                    <Box component={RouterLink} to="/login" sx={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                        textDecoration: 'none',
                                        px: 3.5, py: 1.5,
                                        background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        boxShadow: `0 4px 24px ${C.purple}40`,
                                        transition: 'all 0.25s ease',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${C.purple}55` },
                                    }}>
                                        Iniciar Sesión
                                        <IconArrowRight size={17} />
                                    </Box>
                                    <Box component={RouterLink} to="/courses" sx={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                        textDecoration: 'none',
                                        px: 3.5, py: 1.5,
                                        border: `1px solid ${C.border}`,
                                        color: C.text,
                                        borderRadius: '8px',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 500,
                                        fontSize: '0.95rem',
                                        transition: 'all 0.25s ease',
                                        '&:hover': { borderColor: C.purple, color: C.purple, background: C.purpleDim },
                                    }}>
                                        Ver Cursos
                                    </Box>
                                </Stack>
                            </Grid>

                            {/* ── Right: Diagram Frame ── */}
                            <Grid
                                sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', alignItems: 'center' }}
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <DiagramFrame src={heroImageSrc} isDark={isDark} />
                            </Grid>
                        </Grid>


                    </Container>
                </Box>


                {/* ══════════════════ COURSES ═══════════════════════════════════ */}
                <Box sx={{ background: C.surface, py: { xs: 6, md: 10 }, transition: 'background 0.3s ease' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ mb: { xs: 5, md: 7 }, textAlign: 'center' }}>
                            <SectionLabel text="// Cursos Disponibles" />
                            <SectionHeading>Explora los cursos</SectionHeading>
                        </Box>

                        {loading ? (
                            <Box textAlign="center" py={8}>
                                <CircularProgress size={38} thickness={2} sx={{ color: C.purple }} />
                                <Typography sx={{
                                    mt: 2,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '0.76rem',
                                    color: C.textMuted,
                                    letterSpacing: '0.08em',
                                }}>
                                    Cargando cursos...
                                </Typography>
                            </Box>
                        ) : courses.length > 0 ? (
                            <>
                                {/* Mobile scroll */}
                                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                    <Box sx={{
                                        display: 'flex',
                                        overflowX: 'auto',
                                        scrollSnapType: 'x mandatory',
                                        WebkitOverflowScrolling: 'touch',
                                        gap: 2, pb: 2, px: 1,
                                        '&::-webkit-scrollbar': { display: 'none' },
                                        scrollbarWidth: 'none',
                                    }}>
                                        {courses.map((course) => (
                                            <CourseCard key={course.id} course={course} getImageUrl={getImageUrl} isDark={isDark} mobile />
                                        ))}
                                    </Box>
                                </Box>

                                {/* Desktop slider */}
                                <Box sx={{
                                    display: { xs: 'none', md: 'block' },
                                    px: 1,
                                    '& .slick-dots li button:before': { color: C.textMuted, fontSize: 7 },
                                    '& .slick-dots li.slick-active button:before': { color: C.purple },
                                }}>
                                    <Slider {...sliderSettings}>
                                        {courses.map((course) => (
                                            <Box key={course.id} sx={{ px: 1.5 }}>
                                                <CourseCard course={course} getImageUrl={getImageUrl} isDark={isDark} />
                                            </Box>
                                        ))}
                                    </Slider>
                                </Box>

                                <Box textAlign="center" mt={6}>
                                    <Box component={RouterLink} to="/courses" sx={{
                                        display: 'inline-flex', alignItems: 'center', gap: 1,
                                        textDecoration: 'none',
                                        px: 4, py: 1.5,
                                        border: `1px solid ${C.border}`,
                                        color: C.text,
                                        borderRadius: '8px',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 500, fontSize: '0.9rem',
                                        transition: 'all 0.25s ease',
                                        '&:hover': { borderColor: C.purple, color: C.purple, background: C.purpleDim },
                                    }}>
                                        Ver todos los cursos
                                        <IconArrowRight size={16} />
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <Box textAlign="center" py={10}>
                                <Box sx={{
                                    width: 68, height: 68, borderRadius: '14px',
                                    border: `1px solid ${C.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mx: 'auto', mb: 3,
                                    background: C.purpleDim,
                                }}>
                                    <IconSchool size={30} color={C.purple} />
                                </Box>
                                <Typography sx={{
                                    fontFamily: "'DM Serif Display', serif",
                                    fontSize: '1.5rem', color: C.text, mb: 1,
                                }}>
                                    No hay cursos disponibles
                                </Typography>
                                <Typography sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.9rem', color: C.textMuted,
                                }}>
                                    ¡Pronto habrá nuevos cursos disponibles!
                                </Typography>
                            </Box>
                        )}
                    </Container>
                </Box>


                {/* ══════════════════ FEATURES ══════════════════════════════════ */}
                <Box sx={{ background: C.bg, backgroundImage: DOT, py: { xs: 8, md: 12 }, transition: 'background 0.3s ease' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ mb: { xs: 5, md: 8 }, textAlign: 'center' }}>
                            <SectionLabel text="// Funcionalidades" />
                            <SectionHeading>Todo en un solo lugar</SectionHeading>
                        </Box>

                        <Grid container spacing={3}>
                            {FEATURES.map(({ icon: Icon, num, title, desc }) => (
                                <Grid
                                    key={num}
                                    size={{
                                        xs: 12,
                                        md: 4
                                    }}>
                                    <Box sx={{
                                        p: 4, height: '100%',
                                        background: C.card,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: '12px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        cursor: 'default',
                                        '&:hover': {
                                            borderColor: C.purpleLight,
                                            background: C.cardHover,
                                            transform: 'translateY(-4px)',
                                            boxShadow: isDark
                                                ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${C.purple}25`
                                                : `0 12px 40px ${C.purpleDim}, 0 0 0 1px ${C.purple}20`,
                                        },
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                                            background: `linear-gradient(90deg, transparent, ${C.purple}55, transparent)`,
                                            opacity: 0,
                                            transition: 'opacity 0.3s',
                                        },
                                        '&:hover::before': { opacity: 1 },
                                    }}>
                                        <Typography sx={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: '0.62rem', letterSpacing: '0.15em',
                                            color: `${C.purple}70`, mb: 2.5,
                                        }}>
                                            {num}
                                        </Typography>
                                        <Box sx={{
                                            width: 46, height: 46,
                                            borderRadius: '10px',
                                            background: C.purpleDim,
                                            border: `1px solid ${C.purple}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            mb: 3,
                                        }}>
                                            <Icon size={22} color={C.purple} />
                                        </Box>
                                        <Typography sx={{
                                            fontFamily: "'DM Serif Display', serif",
                                            fontSize: '1.25rem', fontWeight: 400,
                                            color: C.text, mb: 1.5, lineHeight: 1.3,
                                        }}>
                                            {title}
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: '0.875rem', color: C.textMuted, lineHeight: 1.75,
                                        }}>
                                            {desc}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>


                {/* ══════════════════ CTA BANNER ════════════════════════════════ */}
                <Box sx={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, transition: 'background 0.3s ease' }}>
                    <Container maxWidth="md" sx={{ py: { xs: 8, md: 11 }, textAlign: 'center' }}>
                        <SectionLabel text="// Accede ahora" />
                        <Typography sx={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: { xs: '2rem', md: '3rem' },
                            fontWeight: 400, color: C.text, lineHeight: 1.2, mb: 2,
                        }}>
                            ¿Listo para comenzar?
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '1rem', color: C.textMuted,
                            mb: 5, maxWidth: 480, mx: 'auto', lineHeight: 1.75,
                        }}>
                            Ingresa al panel de administración y gestiona tu institución con toda la potencia de la plataforma.
                        </Typography>
                        <Box component={RouterLink} to="/login" sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 1.5,
                            textDecoration: 'none',
                            px: 5, py: 1.75,
                            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700, fontSize: '1rem',
                            boxShadow: `0 6px 30px ${C.purple}40`,
                            transition: 'all 0.25s ease',
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 40px ${C.purple}55` },
                        }}>
                            Iniciar Sesión
                            <IconArrowRight size={18} />
                        </Box>
                    </Container>
                </Box>


            </Box>
        </>
    );
};

export default LandingPage;
