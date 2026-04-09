import React, { useEffect, useState } from 'react';
import {
    Grid,
    Button,
    Typography,
    Divider,
    Alert,
    CircularProgress,
    Box,
    CardMedia
} from '@mui/material';
import { IconDeviceFloppy, IconPhoto } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';
import MainCard from '../../../ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';

const LandingPageConfig = () => {
    const [config, setConfig] = useState({
        landing_image: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseHost = configData.API_SERVER.replace(/\/api\/$/, '');
        const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${baseHost}${path}`;
    };

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${configData.API_SERVER}landing-page-config/`);
            if (response.data) {
                setConfig({
                    landing_image: response.data.landing_image
                });
                if (response.data.landing_image) {
                    setPreview(getImageUrl(response.data.landing_image));
                }
            }
        } catch (error) {
            console.error('Error fetching landing page config:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setConfig({ ...config, landing_image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const formData = new FormData();
            if (config.landing_image instanceof File) {
                formData.append('landing_image', config.landing_image);
            }

            const response = await axios.post(`${configData.API_SERVER}landing-page-config/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
            if (response.data.landing_image) {
                setPreview(getImageUrl(response.data.landing_image));
            }
        } catch (error) {
            console.error('Error saving landing page config:', error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainCard title="Configuración de Página Principal">
                <Grid container justifyContent="center" style={{ padding: '20px' }}>
                    <CircularProgress />
                </Grid>
            </MainCard>
        );
    }

    return (
        <MainCard title="Configuración de Página Principal">
            <Grid container spacing={gridSpacing}>
                <Grid size={12}>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        Configura los elementos visuales de la página principal (Landing Page).
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
                            <Grid size={12}>
                                <Typography variant="h4" sx={{ mb: 2 }}>
                                    Imagen de Fondo (Hero Image)
                                </Typography>
                                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed #ccc', p: 3, borderRadius: 2 }}>
                                    {preview ? (
                                        <CardMedia
                                            component="img"
                                            image={preview}
                                            alt="Vista previa"
                                            sx={{ maxWidth: '400px', maxHeight: '200px', objectFit: 'contain', mb: 2, borderRadius: 1 }}
                                        />
                                    ) : (
                                        <IconPhoto size="4rem" stroke={1} color="#ccc" />
                                    )}
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="contained-button-file"
                                        type="file"
                                        onChange={handleImageChange}
                                    />
                                    <label htmlFor="contained-button-file">
                                        <Button variant="outlined" component="span" color="primary">
                                            {preview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                                        </Button>
                                    </label>
                                    <Typography variant="caption" sx={{ mt: 1 }}>
                                        Recomendado: 1200x800px o similar. Formatos: JPG, PNG.
                                    </Typography>
                                </Box>
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

export default LandingPageConfig;
