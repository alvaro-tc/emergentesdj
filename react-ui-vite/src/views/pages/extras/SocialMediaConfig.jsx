import React, { useEffect, useState } from 'react';
import {
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    InputAdornment,
    Divider,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import { IconBrandFacebook, IconBrandYoutube, IconBrandTiktok, IconBrandInstagram, IconDeviceFloppy } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';
import MainCard from '../../../ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';

const SocialMediaConfig = () => {
    const [socialLinks, setSocialLinks] = useState({
        facebook: '',
        youtube: '',
        tiktok: '',
        instagram: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSocialLinks();
    }, []);

    const fetchSocialLinks = async () => {
        try {
            const response = await axios.get(`${configData.API_SERVER}web-config/`);
            if (response.data) {
                setSocialLinks({
                    facebook: response.data.facebook || '',
                    youtube: response.data.youtube || '',
                    tiktok: response.data.tiktok || '',
                    instagram: response.data.instagram || ''
                });
            }
        } catch (error) {
            console.error('Error fetching social links:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSocialLinks({
            ...socialLinks,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await axios.post(`${configData.API_SERVER}web-config/`, socialLinks);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
        } catch (error) {
            console.error('Error saving social links:', error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainCard title="Configuración de Redes Sociales">
                <Grid container justifyContent="center" style={{ padding: '20px' }}>
                    <CircularProgress />
                </Grid>
            </MainCard>
        );
    }

    return (
        <MainCard title="Configuración de Redes Sociales">
            <Grid container spacing={gridSpacing}>
                <Grid size={12}>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        Configura los enlaces a las redes sociales que aparecerán en el pie de página del sitio público.
                    </Typography>
                </Grid>
                <Grid size={12}>
                    {message && (
                        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                            {message.text}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="Facebook URL"
                                    name="facebook"
                                    value={socialLinks.facebook}
                                    onChange={handleChange}
                                    variant="outlined"
                                    placeholder="https://facebook.com/tu-pagina"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconBrandFacebook stroke={1.5} size="1.3rem" color="#1877F2" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="YouTube URL"
                                    name="youtube"
                                    value={socialLinks.youtube}
                                    onChange={handleChange}
                                    variant="outlined"
                                    placeholder="https://youtube.com/c/tu-canal"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconBrandYoutube stroke={1.5} size="1.3rem" color="#FF0000" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="TikTok URL"
                                    name="tiktok"
                                    value={socialLinks.tiktok}
                                    onChange={handleChange}
                                    variant="outlined"
                                    placeholder="https://tiktok.com/@tu-usuario"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconBrandTiktok stroke={1.5} size="1.3rem" color="#000000" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="Instagram URL"
                                    name="instagram"
                                    value={socialLinks.instagram}
                                    onChange={handleChange}
                                    variant="outlined"
                                    placeholder="https://instagram.com/tu-usuario"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconBrandInstagram stroke={1.5} size="1.3rem" color="#E4405F" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            <Grid size={12}>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<IconDeviceFloppy />}
                                        disabled={saving}
                                        size="large"
                                    >
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default SocialMediaConfig;
