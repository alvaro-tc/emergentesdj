import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    Typography,
    IconButton
} from '@mui/material';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import { IconTrash, IconPlus } from '@tabler/icons-react';

const CriteriaDialog = ({ open, handleClose, template, onSave }) => {
    const account = useSelector((state) => state.account);

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            if (template) {
                await axios.put(`${configData.API_SERVER}evaluation-templates/${template.id}/`, values);
            } else {
                await axios.post(`${configData.API_SERVER}evaluation-templates/`, values);
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
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            {open && (
                <>
                    <DialogTitle>{template ? 'Editar Plantilla de Etapas' : 'Nueva Plantilla de Etapas'}</DialogTitle>
                    <Formik
                        initialValues={{
                            name: template ? template.name : '',
                            description: template ? template.description : '',
                            criteria: template && template.criteria ? template.criteria : []
                        }}
                        validationSchema={Yup.object().shape({
                            name: Yup.string().max(255).required('El nombre es requerido'),
                            criteria: Yup.array().of(
                                Yup.object().shape({
                                    name: Yup.string().required('Nombre de la etapa requerido'),
                                    weight: Yup.number().required('Peso requerido')
                                })
                            )
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
                                                label="Nombre de la Plantilla"
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
                                                fullWidth
                                                label="Descripción"
                                                name="description"
                                                value={values.description}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <Typography variant="h4" gutterBottom>Etapas</Typography>
                                            <FieldArray name="criteria">
                                                {({ insert, remove, push }) => (
                                                    <div>
                                                        {values.criteria && values.criteria.length > 0 && values.criteria.map((criterion, index) => (
                                                            <Grid container spacing={2} key={index} alignItems="center" style={{ marginBottom: '10px' }}>
                                                                <Grid size={8}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Nombre de la Etapa"
                                                                        name={`criteria.${index}.name`}
                                                                        value={criterion.name}
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        error={Boolean(touched.criteria && touched.criteria[index] && errors.criteria && errors.criteria[index] && errors.criteria[index].name)}
                                                                        helperText={touched.criteria && touched.criteria[index] && errors.criteria && errors.criteria[index] && errors.criteria[index].name}
                                                                    />
                                                                </Grid>
                                                                <Grid size={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Peso (%)"
                                                                        name={`criteria.${index}.weight`}
                                                                        value={criterion.weight}
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        type="number"
                                                                        error={Boolean(touched.criteria && touched.criteria[index] && errors.criteria && errors.criteria[index] && errors.criteria[index].weight)}
                                                                        helperText={touched.criteria && touched.criteria[index] && errors.criteria && errors.criteria[index] && errors.criteria[index].weight}
                                                                    />
                                                                </Grid>
                                                                <Grid size={1}>
                                                                    <IconButton
                                                                        color="secondary"
                                                                        onClick={() => remove(index)}
                                                                    >
                                                                        <IconTrash />
                                                                    </IconButton>
                                                                </Grid>
                                                            </Grid>
                                                        ))}
                                                        <Button
                                                            variant="outlined"
                                                            color="primary"
                                                            onClick={() => push({ name: '', weight: '' })}
                                                            startIcon={<IconPlus />}
                                                        >
                                                            Añadir Etapa
                                                        </Button>
                                                    </div>
                                                )}
                                            </FieldArray>
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

export default CriteriaDialog;
