import React, { useEffect, useState } from 'react';
import {
    Box, Container, Grid, Typography, TextField, Button, Stack,
    IconButton, Alert, CircularProgress, Snackbar,
} from '@mui/material';
import {
    IconBrandFacebook, IconBrandYoutube, IconBrandInstagram,
    IconBrandTiktok, IconBrandWhatsapp, IconSend,
    IconPhone, IconMail, IconMapPin,
} from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';

const EMPTY_FORM = { nombre: '', apellidos: '', celular: '', email: '', asunto: '', mensaje: '' };

const ContactPage = ({ isDark }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [social, setSocial] = useState({});

    const C = isDark ? {
        bg: '#050a14', surface: '#0d1220', border: '#1a1630',
        purple: '#8b5cf6', purpleLight: '#c4b5fd', text: '#e2dff0',
        textMuted: '#6b6890', input: '#0a0f1e',
    } : {
        bg: '#f5f3ff', surface: '#ffffff', border: '#e0daf4',
        purple: '#6d28d9', purpleLight: '#8b5cf6', text: '#1c1033',
        textMuted: '#8b80b8', input: '#ffffff',
    };

    useEffect(() => {
        axios.get(`${configData.API_SERVER}web-config/`)
            .then(r => setSocial(r.data || {}))
            .catch(() => {});
    }, []);

    const validate = () => {
        const e = {};
        if (!form.nombre.trim()) e.nombre = 'Requerido';
        if (!form.apellidos.trim()) e.apellidos = 'Requerido';
        if (!form.email.trim()) e.email = 'Requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
        if (!form.asunto.trim()) e.asunto = 'Requerido';
        if (!form.mensaje.trim()) e.mensaje = 'Requerido';
        return e;
    };

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSending(true);
        try {
            await axios.post(`${configData.API_SERVER}contact-messages/`, form);
            setForm(EMPTY_FORM);
            setSnack({ open: true, message: '¡Mensaje enviado! Nos pondremos en contacto contigo pronto.', severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Error al enviar el mensaje. Inténtalo de nuevo.', severity: 'error' });
        } finally {
            setSending(false);
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            background: C.input,
            '& fieldset': { borderColor: C.border },
            '&:hover fieldset': { borderColor: C.purple },
            '&.Mui-focused fieldset': { borderColor: C.purple },
        },
        '& .MuiInputLabel-root': { color: C.textMuted },
        '& .MuiInputBase-input': { color: C.text },
    };

    const SocialBtn = ({ href, color, children }) => (
        <IconButton component="a" href={href} target="_blank" rel="noopener noreferrer"
            sx={{
                color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: '10px',
                width: 44, height: 44,
                '&:hover': { color, borderColor: color, background: `${color}15` },
            }}
        >{children}</IconButton>
    );

    const whatsappUrl = social.whatsapp
        ? `https://wa.me/${social.whatsapp}?text=${encodeURIComponent('Hola, quiero consultar sobre ')}`
        : null;

    return (
        <Box sx={{ minHeight: '100vh', background: C.bg, py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 7 }}>
                    <Typography sx={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                        letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: C.purple, mb: 1.5,
                    }}>
                        Contáctanos
                    </Typography>
                    <Typography variant="h2" sx={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 700,
                        color: C.text, fontSize: { xs: '2rem', md: '2.8rem' }, mb: 2,
                    }}>
                        ¿Tienes alguna consulta?
                    </Typography>
                    <Typography sx={{ color: C.textMuted, fontSize: '1rem', maxWidth: 520, mx: 'auto' }}>
                        Escríbenos y te responderemos a la brevedad posible.
                    </Typography>
                </Box>

                <Grid container spacing={5}>
                    {/* Form */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Box component="form" onSubmit={handleSubmit} sx={{
                            background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: 3, p: { xs: 3, md: 4 },
                        }}>
                            <Grid container spacing={2.5}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Nombre *" name="nombre"
                                        value={form.nombre} onChange={handleChange}
                                        error={!!errors.nombre} helperText={errors.nombre} sx={fieldSx} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Apellidos *" name="apellidos"
                                        value={form.apellidos} onChange={handleChange}
                                        error={!!errors.apellidos} helperText={errors.apellidos} sx={fieldSx} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Celular" name="celular"
                                        value={form.celular} onChange={handleChange} sx={fieldSx} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Email *" name="email" type="email"
                                        value={form.email} onChange={handleChange}
                                        error={!!errors.email} helperText={errors.email} sx={fieldSx} />
                                </Grid>
                                <Grid size={12}>
                                    <TextField fullWidth label="Asunto *" name="asunto"
                                        value={form.asunto} onChange={handleChange}
                                        error={!!errors.asunto} helperText={errors.asunto} sx={fieldSx} />
                                </Grid>
                                <Grid size={12}>
                                    <TextField fullWidth multiline rows={5} label="Mensaje *" name="mensaje"
                                        value={form.mensaje} onChange={handleChange}
                                        error={!!errors.mensaje} helperText={errors.mensaje} sx={fieldSx} />
                                </Grid>
                                <Grid size={12}>
                                    <Button type="submit" variant="contained" fullWidth size="large"
                                        disabled={sending}
                                        startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
                                        sx={{
                                            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                                            py: 1.5, fontWeight: 600, fontSize: '1rem',
                                            borderRadius: 2, textTransform: 'none',
                                            '&:hover': { opacity: 0.9 },
                                        }}
                                    >
                                        {sending ? 'Enviando...' : 'Enviar Mensaje'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* Info panel */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={3}>
                            {/* Info cards */}
                            {[
                                { icon: <IconMail size={22} />, label: 'Email', value: 'infoemergentes@gmail.com' },
                                { icon: <IconPhone size={22} />, label: 'WhatsApp', value: social.whatsapp ? `+${social.whatsapp}` : '' },
                                { icon: <IconMapPin size={22} />, label: 'Ubicación', value: 'Bolivia' },
                            ].map(({ icon, label, value }) => (
                                <Box key={label} sx={{
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    background: C.surface, border: `1px solid ${C.border}`,
                                    borderRadius: 2.5, p: 2.5,
                                }}>
                                    <Box sx={{
                                        width: 44, height: 44, borderRadius: '10px',
                                        background: `${C.purple}18`, color: C.purple,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>{icon}</Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.72rem', color: C.textMuted, mb: 0.3 }}>{label}</Typography>
                                        <Typography sx={{ fontSize: '0.9rem', color: C.text, fontWeight: 500 }}>{value}</Typography>
                                    </Box>
                                </Box>
                            ))}

                            {/* Social links */}
                            <Box sx={{
                                background: C.surface, border: `1px solid ${C.border}`,
                                borderRadius: 2.5, p: 3,
                            }}>
                                <Typography sx={{
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem',
                                    letterSpacing: '0.14em', textTransform: 'uppercase',
                                    color: C.purple, mb: 2,
                                }}>
                                    Redes Sociales
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {social.facebook && <SocialBtn href={social.facebook} color="#1877f2"><IconBrandFacebook size={20} /></SocialBtn>}
                                    {social.youtube && <SocialBtn href={social.youtube} color="#ff0000"><IconBrandYoutube size={20} /></SocialBtn>}
                                    {social.instagram && <SocialBtn href={social.instagram} color="#e1306c"><IconBrandInstagram size={20} /></SocialBtn>}
                                    {social.tiktok && <SocialBtn href={social.tiktok} color="#69c9d0"><IconBrandTiktok size={20} /></SocialBtn>}
                                    {whatsappUrl && <SocialBtn href={whatsappUrl} color="#25d366"><IconBrandWhatsapp size={20} /></SocialBtn>}
                                </Stack>
                                {!social.facebook && !social.youtube && !social.instagram && !social.tiktok && (
                                    <Typography sx={{ color: C.textMuted, fontSize: '0.85rem' }}>
                                        Configura las redes sociales en el panel de administración.
                                    </Typography>
                                )}
                            </Box>

                            {/* WhatsApp CTA */}
                            {whatsappUrl && (
                                <Button component="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                    variant="outlined" fullWidth size="large"
                                    startIcon={<IconBrandWhatsapp size={20} />}
                                    sx={{
                                        borderColor: '#25d366', color: '#25d366',
                                        borderRadius: 2, py: 1.5, fontWeight: 600,
                                        textTransform: 'none', fontSize: '0.95rem',
                                        '&:hover': { background: '#25d36615', borderColor: '#25d366' },
                                    }}
                                >
                                    Chatear por WhatsApp
                                </Button>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            {/* Floating WhatsApp button */}
            {whatsappUrl && (
                <Box component="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                    sx={{
                        position: 'fixed', bottom: 28, right: 28, zIndex: 1300,
                        width: 56, height: 56, borderRadius: '50%',
                        background: '#25d366', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px #25d36660',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 28px #25d36680' },
                    }}
                >
                    <IconBrandWhatsapp size={28} />
                </Box>
            )}

            <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContactPage;
