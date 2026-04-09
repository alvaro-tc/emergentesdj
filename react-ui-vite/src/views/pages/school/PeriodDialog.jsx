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

const PeriodDialog = ({ open, handleClose, period, onSave }) => {
    const account = useSelector((state) => state.account);

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            if (period) {
                await axios.put(`${configData.API_SERVER}periods/${period.id}/`, values);
            } else {
                await axios.post(`${configData.API_SERVER}periods/`, values);
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
                    <DialogTitle>{period ? 'Editar Periodo' : 'Añadir Periodo'}</DialogTitle>
                    <Formik
                        initialValues={{
                            name: period ? period.name : '',
                            start_date: period ? period.start_date : '',
                            end_date: period ? period.end_date : ''
                        }}
                        validationSchema={Yup.object().shape({
                            name: Yup.string().max(255).required('El nombre es requerido'),
                            start_date: Yup.date().required('La fecha de inicio es requerida'),
                            end_date: Yup.date().required('La fecha de fin es requerida')
                        })}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                            <form onSubmit={handleSubmit}>
                                <DialogContent>
                                    <Grid container spacing={2}>
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                label="Nombre"
                                                name="name"
                                                value={values.name}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.name && errors.name)}
                                                helperText={touched.name && errors.name}
                                            />
                                        </Grid>
                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                label="Fecha Inicio"
                                                name="start_date"
                                                type="date"
                                                value={values.start_date}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                InputLabelProps={{ shrink: true }}
                                                error={Boolean(touched.start_date && errors.start_date)}
                                                helperText={touched.start_date && errors.start_date}
                                            />
                                        </Grid>
                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                label="Fecha Fin"
                                                name="end_date"
                                                type="date"
                                                value={values.end_date}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                InputLabelProps={{ shrink: true }}
                                                error={Boolean(touched.end_date && errors.end_date)}
                                                helperText={touched.end_date && errors.end_date}
                                            />
                                        </Grid>
                                    </Grid>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleClose}>
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

export default PeriodDialog;
