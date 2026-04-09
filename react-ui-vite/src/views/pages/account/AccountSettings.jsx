import React, { useState, useEffect } from 'react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    TextField,
    Typography,
    Alert,
    Snackbar
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import configData from '../../../config';
import { useSelector, useDispatch } from 'react-redux';
import MainCard from '../../../ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';
import { ACCOUNT_INITIALIZE } from '../../../store/actions';

const AccountSettings = () => {
    const account = useSelector((state) => state.account);
    const dispatcher = useDispatch();
    const [profile, setProfile] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isAdmin = account.user?.role === 'ADMIN';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            const response = await axios.get(`${configData.API_SERVER}manage-users/profile/`);
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setSnackbar({ open: true, message: 'Error al cargar el perfil', severity: 'error' });
        }
    };

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

            // Prepare data - only send fields that have changed
            const data = {};
            if (isAdmin) {
                if (values.first_name !== profile.first_name) data.first_name = values.first_name;
                if (values.paternal_surname !== profile.paternal_surname) data.paternal_surname = values.paternal_surname;
                if (values.maternal_surname !== profile.maternal_surname) data.maternal_surname = values.maternal_surname;
                if (values.ci_number !== profile.ci_number) data.ci_number = values.ci_number;
            }
            if (values.email !== profile.email) data.email = values.email;
            if (values.phone !== profile.phone) data.phone = values.phone;

            // Password fields
            if (values.old_password) {
                data.old_password = values.old_password;
                data.new_password = values.new_password;
                data.confirm_password = values.confirm_password;
            }

            const response = await axios.patch(`${configData.API_SERVER}manage-users/profile/`, data);

            // Update Redux store with new user data
            dispatcher({
                type: ACCOUNT_INITIALIZE,
                payload: { isLoggedIn: true, user: response.data.user, token: account.token }
            });

            setProfile(response.data.user);
            setSnackbar({ open: true, message: 'Perfil actualizado exitosamente', severity: 'success' });

            // Clear password fields
            values.old_password = '';
            values.new_password = '';
            values.confirm_password = '';
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.old_password?.[0] ||
                error.response?.data?.new_password?.[0] ||
                error.response?.data?.confirm_password?.[0] ||
                error.response?.data?.email?.[0] ||
                'Error al actualizar el perfil';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!profile) {
        return <Typography>Cargando...</Typography>;
    }

    return (
        <MainCard title="Configuración de Cuenta">
            <Formik
                initialValues={{
                    email: profile.email || '',
                    phone: profile.phone || '',
                    first_name: profile.first_name || '',
                    paternal_surname: profile.paternal_surname || '',
                    maternal_surname: profile.maternal_surname || '',
                    ci_number: profile.ci_number || '',
                    old_password: '',
                    new_password: '',
                    confirm_password: ''
                }}
                validationSchema={Yup.object().shape({
                    email: Yup.string().email('Debe ser un email válido').required('El email es requerido'),
                    phone: Yup.string().max(20),
                    first_name: isAdmin ? Yup.string().required('El nombre es requerido') : Yup.string(),
                    paternal_surname: isAdmin ? Yup.string().required('El apellido paterno es requerido') : Yup.string(),
                    maternal_surname: Yup.string(),
                    ci_number: isAdmin ? Yup.string().required('El CI es requerido') : Yup.string(),
                    old_password: Yup.string(),
                    new_password: Yup.string().when('old_password', {
                        is: (val) => val && val.length > 0,
                        then: Yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('Ingrese la nueva contraseña')
                    }),
                    confirm_password: Yup.string().when('new_password', {
                        is: (val) => val && val.length > 0,
                        then: Yup.string().oneOf([Yup.ref('new_password')], 'Las contraseñas no coinciden').required('Confirme la contraseña')
                    })
                })}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                    <form onSubmit={handleSubmit}>
                        <CardContent>
                            <Grid container spacing={gridSpacing}>
                                {/* Información Personal */}
                                <Grid size={12}>
                                    <Typography variant="h3" gutterBottom>
                                        Información Personal
                                    </Typography>
                                    <Divider />
                                </Grid>

                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 6
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={values.email}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        error={Boolean(touched.email && errors.email)}
                                        helperText={touched.email && errors.email}
                                    />
                                </Grid>

                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 6
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Teléfono"
                                        name="phone"
                                        value={values.phone}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        error={Boolean(touched.phone && errors.phone)}
                                        helperText={touched.phone && errors.phone}
                                    />
                                </Grid>

                                {isAdmin && (
                                    <>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Nombres"
                                                name="first_name"
                                                value={values.first_name}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.first_name && errors.first_name)}
                                                helperText={touched.first_name && errors.first_name}
                                            />
                                        </Grid>

                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Carnet de Identidad"
                                                name="ci_number"
                                                value={values.ci_number}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.ci_number && errors.ci_number)}
                                                helperText={touched.ci_number && errors.ci_number}
                                            />
                                        </Grid>

                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Apellido Paterno"
                                                name="paternal_surname"
                                                value={values.paternal_surname}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.paternal_surname && errors.paternal_surname)}
                                                helperText={touched.paternal_surname && errors.paternal_surname}
                                            />
                                        </Grid>

                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Apellido Materno"
                                                name="maternal_surname"
                                                value={values.maternal_surname}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.maternal_surname && errors.maternal_surname)}
                                                helperText={touched.maternal_surname && errors.maternal_surname}
                                            />
                                        </Grid>
                                    </>
                                )}

                                {/* Cambiar Contraseña */}
                                <Grid sx={{ mt: 3 }} size={12}>
                                    <Typography variant="h3" gutterBottom>
                                        Cambiar Contraseña
                                    </Typography>
                                    <Divider />
                                </Grid>

                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 4
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Contraseña Actual"
                                        name="old_password"
                                        type="password"
                                        value={values.old_password}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        error={Boolean(touched.old_password && errors.old_password)}
                                        helperText={touched.old_password && errors.old_password}
                                    />
                                </Grid>

                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 4
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Nueva Contraseña"
                                        name="new_password"
                                        type="password"
                                        value={values.new_password}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        error={Boolean(touched.new_password && errors.new_password)}
                                        helperText={touched.new_password && errors.new_password}
                                    />
                                </Grid>

                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 4
                                    }}>
                                    <TextField
                                        fullWidth
                                        label="Confirmar Contraseña"
                                        name="confirm_password"
                                        type="password"
                                        value={values.confirm_password}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        error={Boolean(touched.confirm_password && errors.confirm_password)}
                                        helperText={touched.confirm_password && errors.confirm_password}
                                    />
                                </Grid>

                                {/* Action Buttons */}
                                <Grid sx={{ mt: 2 }} size={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="secondary"
                                        disabled={isSubmitting}
                                        size="large"
                                    >
                                        Guardar Cambios
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </form>
                )}
            </Formik>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
};

export default AccountSettings;
