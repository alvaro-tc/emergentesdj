import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, IconButton, Stack } from '@mui/material';
import { IconBrandFacebook, IconBrandYoutube, IconBrandTiktok, IconBrandInstagram } from '@tabler/icons-react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import configData from '../../../config';
import logo from './../../../assets/images/logo_emergentes.png';

const NAV_LINKS = [
    { label: 'Inicio', to: '/' },
    { label: 'Cursos', to: '/courses' },
    { label: 'Acerca de', to: '/about' },
    { label: 'Publicaciones', to: '/publications' },
];

const LandingFooter = ({ isDark }) => {
    const [socialLinks, setSocialLinks] = useState({ facebook: '', youtube: '', tiktok: '', instagram: '' });

    const C = isDark ? {
        bg:         '#050a14',
        border:     '#1a1630',
        purple:     '#8b5cf6',
        purpleLight:'#c4b5fd',
        text:       '#e2dff0',
        textMuted:  '#4a4660',
        divider:    '#12102a',
    } : {
        bg:         '#f5f3ff',
        border:     '#e0daf4',
        purple:     '#6d28d9',
        purpleLight:'#8b5cf6',
        text:       '#1c1033',
        textMuted:  '#8b80b8',
        divider:    '#ede8ff',
    };

    useEffect(() => {
        const fetchSocialLinks = async () => {
            try {
                const res = await axios.get(`${configData.API_SERVER}web-config/`);
                if (res.data) setSocialLinks(res.data);
            } catch {}
        };
        fetchSocialLinks();
    }, []);

    const hasSocial = socialLinks.facebook || socialLinks.youtube || socialLinks.tiktok || socialLinks.instagram;

    const SocialBtn = ({ href, hoverColor, children }) => (
        <IconButton
            component="a" href={href} target="_blank" rel="noopener noreferrer"
            size="small"
            sx={{
                color: C.textMuted,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                width: 38, height: 38,
                transition: 'all 0.2s',
                '&:hover': { color: hoverColor, borderColor: hoverColor, background: `${hoverColor}12` },
            }}
        >
            {children}
        </IconButton>
    );

    return (
        <Box sx={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                <Grid container spacing={4}>
                    {/* Brand */}
                    <Grid
                        size={{
                            xs: 12,
                            md: 4
                        }}>
                        <Box sx={{
                            width: 110, height: 44,
                            maskImage: `url(${logo})`,
                            WebkitMaskImage: `url(${logo})`,
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskPosition: 'center left',
                            WebkitMaskPosition: 'center left',
                            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                            mb: 2,
                        }} />
                        <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.85rem',
                            color: C.textMuted,
                            lineHeight: 1.7,
                            maxWidth: 260,
                        }}>
                            Plataforma académica moderna para la gestión de cursos, evaluaciones y proyectos estudiantiles.
                        </Typography>
                    </Grid>

                    {/* Nav */}
                    <Grid
                        size={{
                            xs: 6,
                            md: 2
                        }}>
                        <Typography sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.68rem',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: C.purple,
                            mb: 2.5,
                        }}>
                            Navegación
                        </Typography>
                        <Stack spacing={1.25}>
                            {NAV_LINKS.map((link) => (
                                <Box key={link.to} component={RouterLink} to={link.to} sx={{
                                    textDecoration: 'none',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.875rem',
                                    color: C.textMuted,
                                    transition: 'color 0.2s',
                                    '&:hover': { color: C.purple },
                                }}>
                                    {link.label}
                                </Box>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Acceso */}
                    <Grid
                        size={{
                            xs: 6,
                            md: 2
                        }}>
                        <Typography sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.68rem',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: C.purple,
                            mb: 2.5,
                        }}>
                            Acceso
                        </Typography>
                        <Stack spacing={1.25}>
                            {[
                                { label: 'Iniciar Sesión', to: '/login' },
                                { label: 'Proyectos', to: '/project-registration' },
                            ].map((link) => (
                                <Box key={link.to} component={RouterLink} to={link.to} sx={{
                                    textDecoration: 'none',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.875rem',
                                    color: C.textMuted,
                                    transition: 'color 0.2s',
                                    '&:hover': { color: C.purple },
                                }}>
                                    {link.label}
                                </Box>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Social */}
                    {hasSocial && (
                        <Grid
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}
                            size={{
                                xs: 12,
                                md: 4
                            }}>
                            <Typography sx={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.68rem',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: C.purple,
                                mb: 2.5,
                            }}>
                                Redes Sociales
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                {socialLinks.facebook  && <SocialBtn href={socialLinks.facebook}  hoverColor="#1877f2"><IconBrandFacebook  size={18} /></SocialBtn>}
                                {socialLinks.youtube   && <SocialBtn href={socialLinks.youtube}   hoverColor="#ff0000"><IconBrandYoutube   size={18} /></SocialBtn>}
                                {socialLinks.tiktok    && <SocialBtn href={socialLinks.tiktok}    hoverColor="#69c9d0"><IconBrandTiktok    size={18} /></SocialBtn>}
                                {socialLinks.instagram && <SocialBtn href={socialLinks.instagram} hoverColor="#e1306c"><IconBrandInstagram size={18} /></SocialBtn>}
                            </Stack>
                        </Grid>
                    )}
                </Grid>
            </Container>
            {/* Bottom bar */}
            <Box sx={{ borderTop: `1px solid ${C.divider}`, py: 2.5 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Typography sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.72rem',
                            color: C.textMuted,
                            letterSpacing: '0.04em',
                        }}>
                            © 2026 Plataforma Emergentes — Todos los derechos reservados
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.72rem',
                            color: `${C.textMuted}70`,
                            letterSpacing: '0.06em',
                        }}>
                            v2.0
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingFooter;
