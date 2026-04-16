
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
    Button,
    Grid,
    Typography,
    Container,
    CardContent,
    CircularProgress,
    Box,
    Chip,
    InputAdornment,
    TextField
} from '@mui/material';

// project imports
import axios from 'axios';
import configData from '../../../config';
import MainCard from '../../../ui-component/cards/MainCard';
import { IconClipboardList, IconSearch } from '@tabler/icons-react';

const PublicProjects = () => {
    const theme = useTheme();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get(`${configData.API_SERVER}project-registration/available_projects/`);
                setProjects(response.data);
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p =>
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.course_details?.subject_details?.name && p.course_details.subject_details.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.background.default} 100%)`,
                    pt: 0,
                    pb: 8,
                    minHeight: '100vh',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
            <Box sx={{ pt: { xs: 4, md: 6 } }} />

            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
                    <Typography variant="h2" gutterBottom color="primary" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 700 }}>
                        Actividades Disponibles
                    </Typography>
                    <Typography variant="h5" color="textSecondary" sx={{ fontWeight: 400, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Encuentra tu actividad e inscribe a tu grupo
                    </Typography>
                </Box>

                {/* Search Bar */}
                <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
                    <TextField
                        fullWidth
                        placeholder="Buscar por materia o nombre de actividad..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconSearch stroke={1.5} size="1.5rem" color={theme.palette.grey[500]} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 4, bgcolor: 'background.paper', boxShadow: theme.shadows[2] }
                        }}
                        variant="outlined"
                    />
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress color="secondary" />
                    </Box>
                ) : (
                    <Grid container spacing={4} justifyContent="center">
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <Grid
                                    key={project.id}
                                    size={{
                                        xs: 12,
                                        sm: 6,
                                        md: 4
                                    }}>
                                    <MainCard
                                        border={false}
                                        boxShadow
                                        shadow={theme.shadows[10]}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.3s',
                                            '&:hover': { transform: 'translateY(-8px)' }
                                        }}
                                    >
                                        <Box sx={{ p: 3, background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, color: 'white', display: 'flex', alignItems: 'center' }}>
                                            <IconClipboardList size={32} />
                                            <Box ml={2}>
                                                <Typography variant="h4" color="inherit" sx={{ lineHeight: 1.2 }}>
                                                    {project.course_details?.subject_details?.name || 'Materia Desconocida'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box sx={{ mb: 2 }}>
                                                <Chip
                                                    label={`Paralelo ${project.course_details?.parallel || 'A'}`}
                                                    color="secondary"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                                <Typography variant="caption" sx={{ ml: 1, color: theme.palette.grey[500] }}>
                                                    {project.course_details?.subject_details?.code}
                                                </Typography>
                                            </Box>

                                            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                                actividad:
                                            </Typography>
                                            <Typography variant="h3" gutterBottom sx={{ minHeight: 40, fontWeight: 600 }}>
                                                {project.name}
                                            </Typography>

                                            <Grid container spacing={1} sx={{ mt: 2 }}>
                                                <Grid>
                                                    <Chip label={`Max. Miembros: ${project.max_members || 'N/A'}`} size="small" variant="outlined" />
                                                </Grid>
                                                {project.registration_end && (
                                                    <Grid>
                                                        <Chip label={`Cierra: ${new Date(project.registration_end).toLocaleDateString()}`} size="small" color="error" variant="outlined" />
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </CardContent>
                                        <Box sx={{ p: 3, pt: 0 }}>
                                            <Button
                                                component={RouterLink}
                                                to={`/project-registration?projectId=${project.id}`}
                                                fullWidth
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                sx={{ borderRadius: 2 }}
                                            >
                                                Registrar Grupo
                                            </Button>
                                        </Box>
                                    </MainCard>
                                </Grid>
                            ))
                        ) : (
                            <Grid size={12}>
                                <Box textAlign="center" py={10}>
                                    <Typography variant="h3" color="textSecondary">
                                        No hay actividads disponibles para registro en este momento.
                                    </Typography>
                                    <Button component={RouterLink} to="/" variant="text" sx={{ mt: 2 }}>
                                        Volver al inicio
                                    </Button>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Container>

            </Box>
        </Box>
    );
};

export default PublicProjects;
