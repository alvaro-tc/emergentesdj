import React from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Typography,
    Alert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import configData from '../../../../config';
import AnimateButton from '../../../../ui-component/extended/AnimateButton';
import useScriptRef from '../../../../hooks/useScriptRef';

const ResetPasswordForm = () => {
    const theme = useTheme();
    const scriptedRef = useScriptRef();
    const { uid, token } = useParams();
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [done, setDone] = React.useState(false);
    const [invalidLink, setInvalidLink] = React.useState(!uid || !token);

    const inputSx = { ...theme.typography.customInput };

    if (invalidLink) {
        return (
            <Box sx={{ textAlign: 'center', py: 2 }}>
                <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                    Enlace no válido
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    El enlace de recuperación no es válido o ha expirado.
                </Typography>
                <Button component={RouterLink} to="/forgot-password" variant="outlined" color="secondary">
                    Solicitar nuevo enlace
                </Button>
            </Box>
        );
    }

    if (done) {
        return (
            <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                    ¡Contraseña actualizada!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.
                </Typography>
                <Button component={RouterLink} to="/login" variant="contained" color="secondary">
                    Ir al inicio de sesión
                </Button>
            </Box>
        );
    }

    return (
        <Formik
            initialValues={{ new_password: '', confirm_password: '', submit: null }}
            validationSchema={Yup.object().shape({
                new_password: Yup.string()
                    .min(8, 'Mínimo 8 caracteres')
                    .max(255)
                    .required('La contraseña es obligatoria'),
                confirm_password: Yup.string()
                    .oneOf([Yup.ref('new_password')], 'Las contraseñas no coinciden')
                    .required('Confirma tu contraseña'),
            })}
            onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
                axios
                    .post(configData.API_SERVER + 'password-reset/confirm/', {
                        uid,
                        token,
                        new_password: values.new_password,
                        confirm_password: values.confirm_password,
                    })
                    .then((response) => {
                        if (scriptedRef.current) {
                            if (response.data.success) {
                                setStatus({ success: true });
                                setDone(true);
                            } else {
                                setErrors({ submit: response.data.msg || 'Error al restablecer.' });
                            }
                            setSubmitting(false);
                        }
                    })
                    .catch((error) => {
                        if (scriptedRef.current) {
                            const msg = error.response?.data?.msg;
                            if (msg && (msg.includes('expirado') || msg.includes('válido'))) {
                                setInvalidLink(true);
                            } else {
                                setErrors({ submit: msg || 'Error de conexión. Intenta más tarde.' });
                            }
                            setSubmitting(false);
                        }
                    });
            }}
        >
            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                <form noValidate onSubmit={handleSubmit}>
                    <FormControl fullWidth error={Boolean(touched.new_password && errors.new_password)} sx={inputSx}>
                        <InputLabel htmlFor="outlined-new-password">Nueva Contraseña</InputLabel>
                        <OutlinedInput
                            id="outlined-new-password"
                            type={showPassword ? 'text' : 'password'}
                            value={values.new_password}
                            name="new_password"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            label="Nueva Contraseña"
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        edge="end"
                                    >
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                        {touched.new_password && errors.new_password && (
                            <FormHelperText error>{' '}{errors.new_password}{' '}</FormHelperText>
                        )}
                    </FormControl>

                    <FormControl fullWidth error={Boolean(touched.confirm_password && errors.confirm_password)} sx={inputSx}>
                        <InputLabel htmlFor="outlined-confirm-password">Confirmar Contraseña</InputLabel>
                        <OutlinedInput
                            id="outlined-confirm-password"
                            type={showConfirm ? 'text' : 'password'}
                            value={values.confirm_password}
                            name="confirm_password"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            label="Confirmar Contraseña"
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        edge="end"
                                    >
                                        {showConfirm ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                        {touched.confirm_password && errors.confirm_password && (
                            <FormHelperText error>{' '}{errors.confirm_password}{' '}</FormHelperText>
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
                                {isSubmitting ? 'Guardando...' : 'Cambiar Contraseña'}
                            </Button>
                        </AnimateButton>
                    </Box>
                </form>
            )}
        </Formik>
    );
};

export default ResetPasswordForm;
