import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardMedia,
    CircularProgress,
    Chip
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { IconBook } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';
import { KEYFRAMES, fadeUp } from './LandingTheme';

const PublicPublications = () => {
    // ── Theme state (from shared LandingLayout) ──────────────────────────────
    const { isDark, C, DOT } = useOutletContext();
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublications();
    }, []);

    const fetchPublications = async () => {
        try {
            const response = await axios.get(`${configData.API_SERVER}publications/`);
            setPublications(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching publications:', error);
            setLoading(false);
        }
    };

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
        <Box sx={{
            minHeight: '100vh',
            background: C.bg,
            backgroundImage: DOT,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <style>{KEYFRAMES}</style>
            
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
                    <SectionLabel text="// Biblioteca Virtual" />
                    <SectionHeading>
                        Publicaciones
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
                        Explora nuestra colección de libros e investigaciones de la academia.
                    </Typography>
                </Box>

                {/* Publications Grid */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress size={60} sx={{ color: C.purple }} />
                    </Box>
                ) : publications.length > 0 ? (
                    <Grid container spacing={4} sx={fadeUp(0.2)}>
                        {publications.map((doc) => (
                            <Grid
                                key={doc.id}
                                size={{ xs: 12, sm: 6, md: 4 }}>
                                <Box sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: '16px',
                                    background: C.card,
                                    border: `1px solid ${C.border}`,
                                    transition: 'all 0.3s ease',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        borderColor: C.purpleLight,
                                        boxShadow: isDark
                                            ? '0 16px 48px rgba(0,0,0,0.5)'
                                            : `0 16px 48px ${C.purpleDim}`,
                                    }
                                }}>
                                    {doc.image_url ? (
                                        <CardMedia
                                            component="img"
                                            height="300"
                                            image={doc.image_url}
                                            alt={doc.title}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Box sx={{
                                            height: 300,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: isDark
                                                ? 'linear-gradient(135deg, #0f1d38 0%, #1a1048 100%)'
                                                : `linear-gradient(135deg, ${C.purpleDim} 0%, ${C.border} 100%)`,
                                        }}>
                                            <IconBook size={80} color={isDark ? `${C.text}40` : `${C.purple}60`} />
                                        </Box>
                                    )}

                                    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography sx={{
                                            fontFamily: "'DM Serif Display', serif",
                                            fontSize: '1.4rem',
                                            color: C.text,
                                            mb: 1,
                                            lineHeight: 1.2
                                        }}>
                                            {doc.title}
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: '0.75rem',
                                            color: C.purple,
                                            mb: 2
                                        }}>
                                            Por: {doc.author}
                                        </Typography>
                                        
                                        <Typography sx={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: '0.9rem',
                                            color: C.textMuted,
                                            lineHeight: 1.7,
                                            mb: 2,
                                        }}>
                                            {doc.summary.length > 150
                                                ? `${doc.summary.substring(0, 150)}...`
                                                : doc.summary}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto', pt: 1 }}>
                                            <Chip label={`${doc.pages} páginas`} size="small" sx={{ background: C.border, color: C.text }} />
                                            <Chip label={`${doc.stock} disponibles`} size="small" sx={{ background: doc.stock > 0 ? C.purple : C.border, color: doc.stock > 0 ? '#fff' : C.text }} />
                                            {doc.dl && <Chip label={`DL: ${doc.dl}`} size="small" sx={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted }} />}
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography variant="h1" sx={{ fontSize: '5rem', mb: 2, opacity: 0.3 }}>📚</Typography>
                        <SectionHeading>
                            No se encontraron publicaciones
                        </SectionHeading>
                        <Typography variant="body1" color={C.textMuted} sx={{ mt: 2 }}>
                            Aún no hay publicaciones disponibles
                        </Typography>
                    </Box>
                )}
            </Container>
            
        </Box>
    );
};

export default PublicPublications;
