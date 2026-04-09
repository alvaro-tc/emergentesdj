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
    Switch,
    IconButton,
    Typography,
    Box
} from '@mui/material';
import { Formik, FieldArray, getIn } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import { IconTrash, IconPlus } from '@tabler/icons-react';

const DAYS_OF_WEEK = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

const CourseDialog = ({ open, handleClose, course, onSave }) => {
    const account = useSelector((state) => state.account);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [showArchivedSubjects, setShowArchivedSubjects] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSubjects();
            fetchTeachers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fetchSubjects = async () => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            const response = await axios.get(configData.API_SERVER + 'subjects/');
            setSubjects(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTeachers = async () => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            const response = await axios.get(configData.API_SERVER + 'manage-users/', { params: { role: 'TEACHER' } });
            setTeachers(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const parseSchedule = (scheduleData) => {
        if (!scheduleData) return [{ day: 'Lunes', start: '', end: '' }];
        try {
            const parsed = JSON.parse(scheduleData);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            // If parsed but empty array
            return [{ day: 'Lunes', start: '', end: '' }];
        } catch (e) {
            // Legacy text support: try to use it as a note or just ignore?
            // For now, return default. User can re-enter.
            // Option: Add a "legacy_note" field to state?
            return [{ day: 'Lunes', start: '', end: '' }];
        }
    };

    const isLegacySchedule = (scheduleData) => {
        if (!scheduleData) return false;
        try {
            const parsed = JSON.parse(scheduleData);
            return !Array.isArray(parsed);
        } catch (e) {
            return true;
        }
    };


    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

            // Prepare FormData for file upload
            const formData = new FormData();

            // Add all simple fields
            formData.append('subject', values.subject);
            formData.append('parallel', values.parallel);
            if (values.teacher) formData.append('teacher', values.teacher);
            // Send course_identifier only when non-empty; empty means "no identifier" (null in DB)
            if (values.course_identifier && values.course_identifier.trim()) {
                formData.append('course_identifier', values.course_identifier.trim());
            } else {
                formData.append('course_identifier', '');
            }

            // Serialize Schedule
            if (values.scheduleList && values.scheduleList.length > 0) {
                // Filter empty rows
                const validSchedule = values.scheduleList.filter(s => s.start && s.end);
                if (validSchedule.length > 0) {
                    formData.append('schedule', JSON.stringify(validSchedule));
                } else {
                    formData.append('schedule', '');
                }
            } else {
                formData.append('schedule', '');
            }

            if (values.whatsapp_link) formData.append('whatsapp_link', values.whatsapp_link);
            else formData.append('whatsapp_link', '');
            if (values.platform_link) formData.append('platform_link', values.platform_link);
            else formData.append('platform_link', '');
            formData.append('is_visible', values.is_visible);
            formData.append('is_registration_open', values.is_registration_open);

            if (values.registration_start) formData.append('registration_start', values.registration_start);
            if (values.registration_end) formData.append('registration_end', values.registration_end);

            // Handle Image - only append if it's a file (new upload)
            if (values.image && values.image instanceof File) {
                formData.append('image', values.image);
            }

            // Determine period logic (same as before)
            const selectedSubject = subjects.find(s => s.id === values.subject);
            const periodId = selectedSubject ? (selectedSubject.period || selectedSubject.period_details?.id) : null;
            if (periodId) {
                formData.append('period', periodId);
            }

            const config = {
                headers: {
                    'content-type': 'multipart/form-data'
                }
            };

            let response;
            if (course) {
                response = await axios.patch(`${configData.API_SERVER}courses/${course.id}/`, formData, config);
            } else {
                response = await axios.post(`${configData.API_SERVER}courses/`, formData, config);
            }

            onSave();
            handleClose();
        } catch (error) {
            console.error("❌ Error saving course:", error.response ? error.response.data : error);
            const msg = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;
            // alert("Error al guardar: " + msg);
            setErrors({ submit: msg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            {open && (
                <>
                    <DialogTitle>{course ? 'Editar Paralelo' : 'Añadir Paralelo'}</DialogTitle>
                    <Formik
                        initialValues={{
                            course_identifier: course ? (course.course_identifier || '') : '',
                            subject: course ? course.subject : '',
                            parallel: course ? course.parallel : '',
                            teacher: course ? course.teacher : '',
                            scheduleList: parseSchedule(course ? course.schedule : ''),
                            whatsapp_link: course ? (course.whatsapp_link || '') : '',
                            platform_link: course ? (course.platform_link || '') : '',
                            is_visible: course ? course.is_visible : false,
                            is_registration_open: course ? course.is_registration_open : false,
                            registration_start: course && course.registration_start ? course.registration_start.slice(0, 16) : '',
                            registration_end: course && course.registration_end ? course.registration_end.slice(0, 16) : '',
                            image: course ? course.image : null
                        }}
                        validationSchema={Yup.object().shape({
                            course_identifier: Yup.string().max(100).nullable(),
                            subject: Yup.number().required('La materia es requerida'),
                            parallel: Yup.string().max(50).required('El paralelo es requerido'),
                            teacher: Yup.number().nullable(),
                            // scheduleList validation logic could be added here if strict
                            whatsapp_link: Yup.string().url('Debe ser una URL válida').nullable(),
                            platform_link: Yup.string().url('Debe ser una URL válida').nullable(),
                            is_visible: Yup.boolean(),
                            is_registration_open: Yup.boolean(),
                            registration_start: Yup.string().nullable(),
                            registration_end: Yup.string().nullable()
                        })}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
                            <form onSubmit={handleSubmit}>
                                <DialogContent>
                                    <Grid container spacing={2}>
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                label="Identificador del Curso (Opcional)"
                                                name="course_identifier"
                                                value={values.course_identifier || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.course_identifier && errors.course_identifier)}
                                                helperText={(touched.course_identifier && errors.course_identifier) || 'Identificador único opcional (ej. PROG-2026-A)'}
                                                inputProps={{ maxLength: 100 }}
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={showArchivedSubjects}
                                                        onChange={(e) => setShowArchivedSubjects(e.target.checked)}
                                                        color="primary"
                                                        size="small"
                                                    />
                                                }
                                                label="Mostrar Materias Archivadas"
                                            />
                                            <TextField
                                                select
                                                fullWidth
                                                label="Materia"
                                                name="subject"
                                                value={values.subject}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.subject && errors.subject)}
                                                helperText={touched.subject && errors.subject}
                                            >
                                                {subjects
                                                    .filter(s => !s.archived || showArchivedSubjects || (course && course.subject === s.id))
                                                    .map((s) => (
                                                        <MenuItem key={s.id} value={s.id}>
                                                            {s.code} - {s.name} {s.archived ? '(Archivado)' : ''}
                                                        </MenuItem>
                                                    ))}
                                            </TextField>
                                        </Grid>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Paralelo (ej. A, B, Mañana)"
                                                name="parallel"
                                                value={values.parallel}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.parallel && errors.parallel)}
                                                helperText={touched.parallel && errors.parallel}
                                            />
                                        </Grid>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Docente (Opcional)"
                                                name="teacher"
                                                value={values.teacher || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.teacher && errors.teacher)}
                                                helperText={touched.teacher && errors.teacher}
                                            >
                                                <MenuItem value="">
                                                    <em>Ninguno</em>
                                                </MenuItem>
                                                {teachers.map((t) => (
                                                    <MenuItem key={t.id} value={t.id}>
                                                        {t.first_name} {t.paternal_surname} ({t.email})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {/* SCHEDULE BUILDER */}
                                        <Grid size={12}>
                                            <Typography variant="h5" sx={{ mb: 1 }}>Horario de Clases</Typography>
                                            {isLegacySchedule(course?.schedule) && (
                                                <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
                                                    Aviso: Este curso tiene un horario en formato antiguo ("{course.schedule}").
                                                    Al guardar, se reemplazará con el nuevo formato.
                                                </Typography>
                                            )}
                                            <FieldArray name="scheduleList">
                                                {({ insert, remove, push }) => (
                                                    <div>
                                                        {values.scheduleList.length > 0 &&
                                                            values.scheduleList.map((scheduleItem, index) => (
                                                                <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 4,
                                                                            md: 3
                                                                        }}>
                                                                        <TextField
                                                                            select
                                                                            fullWidth
                                                                            label="Día"
                                                                            size="small"
                                                                            name={`scheduleList.${index}.day`}
                                                                            value={scheduleItem.day}
                                                                            onChange={handleChange}
                                                                        >
                                                                            {DAYS_OF_WEEK.map(day => (
                                                                                <MenuItem key={day} value={day}>{day}</MenuItem>
                                                                            ))}
                                                                        </TextField>
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 3,
                                                                            md: 3
                                                                        }}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="time"
                                                                            label="Inicio"
                                                                            size="small"
                                                                            name={`scheduleList.${index}.start`}
                                                                            value={scheduleItem.start}
                                                                            onChange={handleChange}
                                                                            InputLabelProps={{ shrink: true }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 3,
                                                                            md: 3
                                                                        }}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="time"
                                                                            label="Fin"
                                                                            size="small"
                                                                            name={`scheduleList.${index}.end`}
                                                                            value={scheduleItem.end}
                                                                            onChange={handleChange}
                                                                            InputLabelProps={{ shrink: true }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 2,
                                                                            md: 1
                                                                        }}>
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => remove(index)}
                                                                        >
                                                                            <IconTrash size="1rem" />
                                                                        </IconButton>
                                                                    </Grid>
                                                                </Grid>
                                                            ))
                                                        }
                                                        <Button
                                                            variant="outlined"
                                                            color="primary"
                                                            startIcon={<IconPlus size="1rem" />}
                                                            size="small"
                                                            onClick={() => push({ day: 'Lunes', start: '', end: '' })}
                                                        >
                                                            Añadir Horario
                                                        </Button>
                                                    </div>
                                                )}
                                            </FieldArray>
                                        </Grid>

                                        <Grid size={12}>
                                            <DialogTitle style={{ paddingLeft: 0 }}>Configuración de Visibilidad e Inscripción</DialogTitle>
                                        </Grid>
                                        <Grid size={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={values.is_visible}
                                                        onChange={handleChange}
                                                        name="is_visible"
                                                        color="primary"
                                                    />
                                                }
                                                label="Visible en página pública (landing page y cursos)"
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={values.is_registration_open}
                                                        onChange={handleChange}
                                                        name="is_registration_open"
                                                        color="secondary"
                                                    />
                                                }
                                                label="Inscripción Abierta (muestra botón de inscribirse en la página de cursos)"
                                            />
                                        </Grid>
                                        {values.is_registration_open && (
                                            <>
                                                <Grid
                                                    size={{
                                                        xs: 12,
                                                        md: 6
                                                    }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Fecha Inicio"
                                                        name="registration_start"
                                                        type="datetime-local"
                                                        value={values.registration_start}
                                                        onChange={handleChange}
                                                        InputLabelProps={{
                                                            shrink: true,
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
                                                        label="Fecha Fin"
                                                        name="registration_end"
                                                        type="datetime-local"
                                                        value={values.registration_end}
                                                        onChange={handleChange}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                    />
                                                </Grid>
                                            </>
                                        )}

                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Link WhatsApp (Opcional)"
                                                name="whatsapp_link"
                                                value={values.whatsapp_link || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.whatsapp_link && errors.whatsapp_link)}
                                                helperText={touched.whatsapp_link && errors.whatsapp_link}
                                            />
                                        </Grid>
                                        <Grid
                                            size={{
                                                xs: 12,
                                                md: 6
                                            }}>
                                            <TextField
                                                fullWidth
                                                label="Enlace a la Plataforma Virtual (Opcional)"
                                                name="platform_link"
                                                value={values.platform_link || ''}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                error={Boolean(touched.platform_link && errors.platform_link)}
                                                helperText={touched.platform_link && errors.platform_link}
                                            />
                                        </Grid>

                                        <Grid size={12}>
                                            <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="raised-button-file"
                                                type="file"
                                                onChange={(event) => {
                                                    const file = event.currentTarget.files[0];
                                                    if (file) {
                                                        setFieldValue("image", file);
                                                    }
                                                }}
                                            />
                                            <label htmlFor="raised-button-file">
                                                <Button variant="outlined" component="span" fullWidth>
                                                    {values.image ? (values.image.name || 'Imagen Seleccionada (Click para cambiar)') : 'Subir Imagen del Curso'}
                                                </Button>
                                            </label>
                                            {values.image && (
                                                <div style={{ marginTop: 10, textAlign: 'center' }}>
                                                    <img
                                                        src={typeof values.image === 'string' ? values.image : URL.createObjectURL(values.image)}
                                                        alt="Preview"
                                                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                                                    />
                                                </div>
                                            )}
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

export default CourseDialog;
