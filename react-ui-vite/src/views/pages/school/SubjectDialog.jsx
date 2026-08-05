import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const SubjectDialog = ({ open, handleClose, subject, onSave }) => {
    const account = useSelector((state) => state.account);
    const [programs, setPrograms] = useState([]);

    useEffect(() => {
        if (open) fetchPrograms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fetchPrograms = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(configData.API_SERVER + 'programs')
            .then(response => setPrograms(response.data))
            .catch(error => console.error("Error fetching programs", error));
    };

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        console.log('📤 SubjectDialog: Submitting with values:', values);
        console.log('🔍 Archived field value:', values.archived);
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            let response;
            if (subject) {
                response = await axios.put(`${configData.API_SERVER}subjects/${subject.id}/`, values);
                console.log('✅ PUT response:', response.status, response.data);
            } else {
                response = await axios.post(`${configData.API_SERVER}subjects/`, values);
                console.log('✅ POST response:', response.status, response.data);
            }
            onSave();
            handleClose();
        } catch (error) {
            console.error("❌ Error saving subject:", error.response ? error.response.data : error);
            const msg = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;
            setErrors({ submit: msg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            {open && (
                <>
                    <DialogTitle>{subject ? 'Editar Materia' : 'Añadir Materia'}</DialogTitle>
                    <Formik
                        initialValues={{
                            name: subject ? subject.name : '',
                            code: subject ? subject.code : '',
                            program: subject ? subject.program : '',
                            archived: subject ? subject.archived : false
                        }}
                        validationSchema={Yup.object().shape({
                            name: Yup.string().max(255).required('El nombre es requerido'),
                            code: Yup.string().max(50).required('El código es requerido'),
                            program: Yup.number().required('La carrera es requerida')
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
                                                label="Código"
                                                name="code"
                                                value={values.code}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.code && errors.code)}
                                                helperText={touched.code && errors.code}
                                            />
                                        </Grid>
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
                                        <Grid size={12}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Elejir Carrera"
                                                name="program"
                                                value={values.program}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.program && errors.program)}
                                                helperText={touched.program && errors.program}
                                            >
                                                {programs.map((prog) => (
                                                    <MenuItem key={prog.id} value={prog.id}>
                                                        {prog.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid size={12}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={values.archived}
                                                        onChange={handleChange}
                                                        name="archived"
                                                        color="primary"
                                                    />
                                                }
                                                label="Marcar como Archivada"
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
            )
            }
        </Dialog >
    );
};

export default SubjectDialog;
