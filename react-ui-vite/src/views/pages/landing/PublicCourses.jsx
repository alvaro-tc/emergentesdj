import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useOutletContext } from 'react-router-dom';
import {
    Button,
    Grid,
    Typography,
    Container,
    CircularProgress,
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    TextField,
    Alert,
    Snackbar
} from '@mui/material';
import axios from 'axios';

// project imports
import configData from '../../../config';
import { getScheduleItems } from '../../../utils/scheduleUtils';
import { KEYFRAMES, fadeUp } from './LandingTheme';
import CourseCard from './CourseCard';

const PublicCourses = () => {
    // ── Theme state (from shared LandingLayout) ──────────────────────────────
    const { isDark, C, DOT } = useOutletContext();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [openModal, setOpenModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [form, setForm] = useState({
        ci: '',
        first_name: '',
        paternal_surname: '',
        maternal_surname: '',
        email: '',
        cellphone: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get(`${configData.API_SERVER}student-course-registration/open_courses/`);
                setCourses(response.data);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleRegisterClick = (course) => {
        setSelectedCourse(course);
        setOpenModal(true);
        setSuccess(false);
        setForm({
            ci: '',
            first_name: '',
            paternal_surname: '',
            maternal_surname: '',
            email: '',
            cellphone: ''
        });
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedCourse(null);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                course: selectedCourse.id,
                ...form
            };
            await axios.post(`${configData.API_SERVER}student-course-registration/submit_request/`, payload);
            setSuccess(true);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || 'Error al enviar la solicitud';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseHost = configData.API_SERVER.replace(/\/api\/$/, '');
        const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${baseHost}${path}`;
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
                        <SectionLabel text="// Cursos Disponibles" />
                        <SectionHeading>
                            Inscríbete a los nuevos paralelos
                        </SectionHeading>
                        <Typography sx={{
                            mt: 2,
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: { xs: '1rem', md: '1.05rem' },
                            color: C.textMuted,
                            lineHeight: 1.8,
                            maxWidth: 600,
                            mx: 'auto'
                        }}>
                            Explora la oferta académica de este periodo y asegura tu lugar en la materia deseada completando tu inscripción en línea.
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box display="flex" flexDirection="column" alignItems="center" mt={4} sx={fadeUp(0.2)}>
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
                    ) : (
                        <Grid container spacing={4} justifyContent="center" sx={fadeUp(0.2)}>
                            {courses.length > 0 ? (
                                courses.map((course) => (
                                    <Grid
                                        key={course.id}
                                        size={{ xs: 12, sm: 6, md: 4 }}>
                                        <CourseCard 
                                            course={course} 
                                            getImageUrl={getImageUrl} 
                                            isDark={isDark} 
                                            actions={
                                                course.is_registration_open && (
                                                    <Box
                                                        onClick={() => handleRegisterClick(course)}
                                                        sx={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                                                            cursor: 'pointer',
                                                            py: 1.1,
                                                            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                                                            border: `1px solid ${C.purple}40`,
                                                            borderRadius: '6px',
                                                            color: '#ffffff',
                                                            fontFamily: "'DM Sans', sans-serif",
                                                            fontWeight: 600,
                                                            fontSize: '0.83rem',
                                                            transition: 'all 0.2s',
                                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${C.purple}40` },
                                                        }}
                                                    >
                                                        ✏️ Inscribirse Ahora
                                                    </Box>
                                                )
                                            }
                                        />
                                    </Grid>
                                ))
                            ) : (
                                <Grid size={12}>
                                    <Box textAlign="center" py={10}>
                                        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2, opacity: 0.3 }}>📚</Typography>
                                        <Typography variant="h4" color={C.textMuted} gutterBottom sx={{ fontFamily: "'DM Serif Display', serif" }}>
                                            No hay cursos disponibles en este momento.
                                        </Typography>
                                        <Typography variant="body1" color={C.textMuted} sx={{ mb: 4, fontFamily: "'DM Sans', sans-serif" }}>
                                            ¡Mantente atento! Pronto habrá nuevos cursos disponibles.
                                        </Typography>
                                        <Box component={RouterLink} to="/" sx={{
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
                                            Volver al inicio
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Container>

                <Box sx={{ borderTop: `1px solid ${C.border}`, py: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: C.textMuted, letterSpacing: '0.05em' }}>
                        © 2026 Plataforma Emergentes
                    </Typography>
                </Box>
            </Box>

            {/* Registration Dialog */}
            <Dialog 
                open={openModal} 
                onClose={handleCloseModal} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: '16px',
                        boxShadow: `0 24px 64px ${C.frameShadow}`,
                    }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', pb: 1, color: C.text, fontFamily: "'DM Serif Display', serif" }}>
                    Inscripción al Curso
                </DialogTitle>
                <DialogContent>
                    {selectedCourse && (
                        <Box mb={3} p={3} sx={{
                            bgcolor: isDark ? C.purpleDim : '#6d28d908',
                            borderRadius: '12px',
                            textAlign: 'center',
                            border: `1px solid ${C.purple}30`
                        }}>
                            <Typography sx={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: C.purple, mb: 0.5 }}>
                                {selectedCourse.subject_details?.name}
                            </Typography>
                            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: C.textMuted, mb: 1.5 }}>
                                {selectedCourse.subject_details?.code}
                            </Typography>
                            <Box mt={1} display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                                <Chip label={`Paralelo ${selectedCourse.parallel}`} sx={{ fontWeight: 600, background: C.purple, color: '#fff' }} size="small" />
                                {getScheduleItems(selectedCourse.schedule).map((item, idx) => (
                                    <Chip key={idx} label={item} size="small" sx={{ background: C.border, color: C.text }} />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {!success ? (
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2.5}>
                                <Grid size={12}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                                        Por favor completa tus datos para solicitar la inscripción
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Carnet de Identidad" name="ci" value={form.ci} onChange={handleChange} required variant="outlined" InputLabelProps={{ style: { color: C.textMuted } }} sx={{ input: { color: C.text }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.purpleLight } } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Nombre" name="first_name" value={form.first_name} onChange={handleChange} required variant="outlined" InputLabelProps={{ style: { color: C.textMuted } }} sx={{ input: { color: C.text }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.purpleLight } } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Apellido Paterno" name="paternal_surname" value={form.paternal_surname} onChange={handleChange} required variant="outlined" InputLabelProps={{ style: { color: C.textMuted } }} sx={{ input: { color: C.text }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.purpleLight } } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Apellido Materno" name="maternal_surname" value={form.maternal_surname} onChange={handleChange} variant="outlined" InputLabelProps={{ style: { color: C.textMuted } }} sx={{ input: { color: C.text }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.purpleLight } } }} />
                                </Grid>
                                <Grid size={12}>
                                    <TextField fullWidth label="Correo Electrónico" name="email" type="email" value={form.email} onChange={handleChange} required variant="outlined" InputLabelProps={{ style: { color: C.textMuted } }} sx={{ input: { color: C.text }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.purpleLight } } }} />
                                </Grid>
                                <Grid size={12}>
                                    <TextField fullWidth label="Teléfono/Celular" name="cellphone" value={form.cellphone} onChange={handleChange} required variant="outlined" InputLabelProps={{ style: { color: C.textMuted } }} sx={{ input: { color: C.text }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.purpleLight } } }} />
                                </Grid>
                            </Grid>
                            <DialogActions sx={{ px: 0, pt: 3, gap: 1 }}>
                                <Button onClick={handleCloseModal} sx={{ borderRadius: 2, px: 3, color: C.textMuted, border: `1px solid ${C.border}`, '&:hover': { background: C.borderLight } }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting} sx={{ borderRadius: 2, px: 4, fontWeight: 600, background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`, color: '#fff', '&:hover': { filter: 'brightness(1.1)' } }}>
                                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                                </Button>
                            </DialogActions>
                        </form>
                    ) : (
                        <Box textAlign="center" py={4}>
                            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>✅</Typography>
                            <Typography sx={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: C.purple, mb: 1 }}>
                                ¡Solicitud Enviada!
                            </Typography>
                            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: C.textMuted, mb: 3 }}>
                                Tu solicitud de inscripción ha sido enviada correctamente. Recibirás una confirmación pronto.
                            </Typography>
                            <Button onClick={handleCloseModal} sx={{ borderRadius: 2, px: 4, fontWeight: 600, background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`, color: '#fff', '&:hover': { filter: 'brightness(1.1)' } }}>
                                Cerrar
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Snackbar Notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </React.Fragment>
    );
};

export default PublicCourses;
