import React from 'react';
import axios from 'axios';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    InputLabel,
    OutlinedInput,
    Typography,
    Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import configData from '../../../../config';
import AnimateButton from '../../../../ui-component/extended/AnimateButton';
import useScriptRef from '../../../../hooks/useScriptRef';

const ForgotPasswordForm = () => {
    const theme = useTheme();
    const scriptedRef = useScriptRef();
    const [sent, setSent] = React.useState(false);

    const inputSx = { ...theme.typography.customInput };

    if (sent) {
        return (
            <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                    ¡Correo enviado!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                    Revisa tu bandeja de entrada y la carpeta de spam.
                </Typography>
            </Box>
        );
    }

    return (
        <Formik
            initialValues={{ email: '', submit: null }}
            validationSchema={Yup.object().shape({
                email: Yup.string().email('Ingresa un correo válido').max(255).required('El correo es obligatorio'),
            })}
            onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
                axios
                    .post(configData.API_SERVER + 'password-reset/request/', { email: values.email })
                    .then(() => {
                        if (scriptedRef.current) {
                            setStatus({ success: true });
                            setSubmitting(false);
                            setSent(true);
                        }
                    })
                    .catch(() => {
                        if (scriptedRef.current) {
                            setStatus({ success: false });
                            setErrors({ submit: 'Error de conexión. Intenta más tarde.' });
                            setSubmitting(false);
                        }
                    });
            }}
        >
            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                <form noValidate onSubmit={handleSubmit}>
                    <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={inputSx}>
                        <InputLabel htmlFor="outlined-adornment-email-forgot">Correo Electrónico</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-email-forgot"
                            type="email"
                            value={values.email}
                            name="email"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            label="Correo Electrónico"
                        />
                        {touched.email && errors.email && (
                            <FormHelperText error id="helper-text-email-forgot">
                                {' '}{errors.email}{' '}
                            </FormHelperText>
                        )}
                    </FormControl>

                    {errors.submit && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="error">{errors.submit}</Alert>
                        </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <AnimateButton>
                            <Button
                                disableElevation
                                disabled={isSubmitting}
                                fullWidth
                                size="large"
                                type="submit"
                                variant="contained"
                                color="secondary"
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </Button>
                        </AnimateButton>
                    </Box>
                </form>
            )}
        </Formik>
    );
};

export default ForgotPasswordForm;
