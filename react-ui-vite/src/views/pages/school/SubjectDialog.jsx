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
    const [periods, setPeriods] = useState([]);
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        if (open) {
            fetchPrograms();
            fetchPeriods();
            fetchTemplates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fetchPrograms = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(configData.API_SERVER + 'programs')
            .then(response => setPrograms(response.data))
            .catch(error => console.error("Error fetching programs", error));
    };

    const fetchPeriods = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(configData.API_SERVER + 'periods')
            .then(response => setPeriods(response.data))
            .catch(error => console.error("Error fetching periods", error));
    };

    const fetchTemplates = () => {
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios.get(configData.API_SERVER + 'evaluation-templates')
            .then(response => setTemplates(response.data))
            .catch(error => console.error("Error fetching templates", error));
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
                            period: subject ? subject.period : '',
                            evaluation_template: subject ? subject.evaluation_template : '',
                            archived: subject ? subject.archived : false
                        }}
                        validationSchema={Yup.object().shape({
                            name: Yup.string().max(255).required('El nombre es requerido'),
                            code: Yup.string().max(50).required('El código es requerido'),
                            program: Yup.number().required('La carrera es requerida'),
                            period: Yup.number().required('El periodo es requerido')
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
                                            <TextField
                                                select
                                                fullWidth
                                                label="Periodo"
                                                name="period"
                                                value={values.period}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.period && errors.period)}
                                                helperText={touched.period && errors.period}
                                            >
                                                {periods.map((per) => (
                                                    <MenuItem key={per.id} value={per.id}>
                                                        {per.name}
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
                                        <Grid size={12}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Criterios de Evaluación"
                                                name="evaluation_template"
                                                value={values.evaluation_template || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.evaluation_template && errors.evaluation_template)}
                                                helperText={touched.evaluation_template && errors.evaluation_template}
                                            >
                                                {templates.map((temp) => (
                                                    <MenuItem key={temp.id} value={temp.id}>
                                                        {temp.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
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
