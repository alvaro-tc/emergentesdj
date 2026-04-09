import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const UserDialog = ({ open, handleClose, user, role, onSave }) => {
    const account = useSelector((state) => state.account);

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            const data = { ...values, role };
            if (!data.password) {
                delete data.password;
            }
            if (user) {
                await axios.put(`${configData.API_SERVER}manage-users/${user.id}/`, data);
            } else {
                await axios.post(`${configData.API_SERVER}manage-users/`, data);
            }
            onSave();
            handleClose();
        } catch (error) {
            console.error(error);
            setErrors({ submit: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            {open && (
                <>
                    <DialogTitle>{user ? `Editar ${role === 'STUDENT' ? 'Estudiante' : 'Docente'}` : `Añadir ${role === 'STUDENT' ? 'Estudiante' : 'Docente'}`}</DialogTitle>
                    <Formik
                        initialValues={{
                            email: user ? user.email : '',
                            first_name: user ? user.first_name : '',
                            paternal_surname: user ? user.paternal_surname : '',
                            maternal_surname: user ? user.maternal_surname : '',
                            ci_number: user ? user.ci_number : '',
                            password: ''
                        }}
                        validationSchema={Yup.object().shape({
                            email: Yup.string().email('Debe ser un email válido').max(255).nullable(),
                            first_name: Yup.string().max(255).required('El nombre es requerido'),
                            paternal_surname: Yup.string().max(255).required('El apellido paterno es requerido'),
                            maternal_surname: Yup.string().max(255),
                            ci_number: Yup.string().max(50).required('El CI es requerido'),
                            password: user ? Yup.string().max(255) : Yup.string().max(255).required('La contraseña es requerida')
                        })}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                            <form onSubmit={handleSubmit}>
                                <DialogContent>
                                    <Grid container spacing={2}>

                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                label="Carnet de Identidad"
                                                name="ci_number"
                                                value={values.ci_number || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.ci_number && errors.ci_number)}
                                                helperText={touched.ci_number && errors.ci_number}
                                            />
                                        </Grid>
                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                label="Nombres"
                                                name="first_name"
                                                value={values.first_name || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.first_name && errors.first_name)}
                                                helperText={touched.first_name && errors.first_name}
                                            />
                                        </Grid>
                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                label="Apellido Paterno"
                                                name="paternal_surname"
                                                value={values.paternal_surname || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.paternal_surname && errors.paternal_surname)}
                                                helperText={touched.paternal_surname && errors.paternal_surname}
                                            />
                                        </Grid>
                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                label="Apellido Materno"
                                                name="maternal_surname"
                                                value={values.maternal_surname || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.maternal_surname && errors.maternal_surname)}
                                                helperText={touched.maternal_surname && errors.maternal_surname}
                                            />
                                        </Grid>
                                        <Grid size={12}>
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
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                label={user ? "Contraseña (Dejar en blanco para no cambiar)" : "Contraseña"}
                                                name="password"
                                                type="password"
                                                value={values.password}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.password && errors.password)}
                                                helperText={touched.password && errors.password}
                                            />
                                        </Grid>
                                    </Grid>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleClose} color="primary">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" variant="contained" color="secondary" disabled={isSubmitting}>
                                        Guardar
                                    </Button>
                                </DialogActions>
                            </form>
                        )}
                    </Formik>
                </>
            )}
        </Dialog>
    );
};

export default UserDialog;
