
import React, { useState, useEffect } from 'react';
import {
    Grid,
    Typography,
    Paper,
    TextField,
    Button,
    MenuItem,
    Alert,
    CircularProgress,
    Snackbar,
    Box
} from '@mui/material';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { IconCheck } from '@tabler/icons-react';

const StudentCourseRegistration = () => {
    const [openCourses, setOpenCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [form, setForm] = useState({
        ci: '',
        first_name: '',
        paternal_surname: '',
        maternal_surname: '',
        email: '',
        cellphone: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        fetchOpenCourses();
    }, []);

    const fetchOpenCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${configData.API_SERVER}student-course-registration/open_courses/`);
            setOpenCourses(response.data);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Error cargando cursos disponibles', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                course: selectedCourseId,
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

    const handleReset = () => {
        setSuccess(false);
        setForm({
            ci: '',
            first_name: '',
            paternal_surname: '',
            maternal_surname: '',
            email: '',
            cellphone: ''
        });
        setSelectedCourseId('');
    };

    if (success) {
        return (
            <React.Fragment>
                <Box sx={{ pt: 4, pb: 6, backgroundColor: '#eef2f6' }}>
                    <Grid container justifyContent="center">
                        <Grid
                            size={{
                                xs: 12,
                                md: 8
                            }}>
                            <MainCard title="Inscripción de Estudiantes">
                                <Grid container justifyContent="center" style={{ textAlign: 'center', padding: 40 }}>
                                    <Grid size={12}>
                                        <IconCheck size={64} style={{ color: 'green', marginBottom: 16 }} />
                                        <Typography variant="h3" gutterBottom color="primary">¡Solicitud Enviada!</Typography>
                                        <Typography variant="h5" paragraph>
                                            Tus datos han sido registrados correctamente. Tu inscripción está pendiente de confirmación por el administrador/docente.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={handleReset}
                                            style={{ marginTop: 24, marginRight: 16 }}
                                        >
                                            Inscribir otra materia
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            href="/"
                                            style={{ marginTop: 24 }}
                                        >
                                            Volver al Inicio
                                        </Button>
                                    </Grid>
                                </Grid>
                            </MainCard>
                        </Grid>
                    </Grid>
                </Box>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <Box sx={{ pt: 4, pb: 6, backgroundColor: '#eef2f6' }}>
                <Grid container justifyContent="center">
                    <Grid
                        size={{
                            xs: 12,
                            md: 8
                        }}>
                        <MainCard title="Inscripción de Estudiantes">
                            <Typography variant="body1" paragraph>
                                Complete el formulario para solicitar su inscripción en una materia habilitada.
                            </Typography>

                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={3}>
                                        <Grid size={12}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Seleccionar Materia / Paralelo"
                                                value={selectedCourseId}
                                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                                variant="outlined"
                                                required
                                            >
                                                {openCourses.map((course) => (
                                                    <MenuItem key={course.id} value={course.id}>
                                                        {course.subject_details?.name} ({course.subject_details?.code}) - Paralelo {course.parallel}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            {openCourses.length === 0 && (
                                                <Alert severity="info" style={{ marginTop: 8 }}>No hay inscripciones abiertas en este momento.</Alert>
                                            )}
                                        </Grid>

                                        <Grid
                                            size={{
                                                xs: 12,
                                                sm: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Carnet de Identidad (CI)"
                                                name="ci"
                                                value={form.ci}
                                                onChange={handleChange}
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                sm: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Correo Electrónico"
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>

                                        <Grid
                                            size={{
                                                xs: 12,
                                                sm: 4
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Nombres"
                                                name="first_name"
                                                value={form.first_name}
                                                onChange={handleChange}
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                sm: 4
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Apellido Paterno"
                                                name="paternal_surname"
                                                value={form.paternal_surname}
                                                onChange={handleChange}
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                sm: 4
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Apellido Materno"
                                                name="maternal_surname"
                                                value={form.maternal_surname}
                                                onChange={handleChange}
                                                variant="outlined"
                                            />
                                        </Grid>

                                        <Grid
                                            size={{
                                                xs: 12,
                                                sm: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Celular"
                                                name="cellphone"
                                                value={form.cellphone}
                                                onChange={handleChange}
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>

                                        <Grid style={{ textAlign: 'right' }} size={12}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="secondary"
                                                size="large"
                                                disabled={submitting || !selectedCourseId}
                                            >
                                                {submitting ? <CircularProgress size={24} /> : 'Enviar Solicitud'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            )}

                            <Snackbar
                                open={snackbar.open}
                                autoHideDuration={6000}
                                onClose={() => setSnackbar({ ...snackbar, open: false })}
                                message={snackbar.message}
                            />
                        </MainCard>
                    </Grid>
                </Grid>
            </Box>
        </React.Fragment>
    );
};

export default StudentCourseRegistration;
