import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import configData from '../../../../config';

// material-ui
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Stack,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';

// project imports
import useScriptRef from '../../../../hooks/useScriptRef';
import AnimateButton from '../../../../ui-component/extended/AnimateButton';
import { ACCOUNT_INITIALIZE } from './../../../../store/actions';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

//============================|| API JWT - LOGIN ||============================//

const RestLogin = ({ login, ...others }) => {
    const theme = useTheme();
    const dispatcher = useDispatch();

    const scriptedRef = useScriptRef();
    const [checked, setChecked] = React.useState(true);
    const [showPassword, setShowPassword] = React.useState(false);

    // Force Update State
    const [forceUpdateOpen, setForceUpdateOpen] = React.useState(false);
    const [tempToken, setTempToken] = React.useState(null);
    const [updateData, setUpdateData] = React.useState({ email: '', password: '', confirmPassword: '' });
    const [updateError, setUpdateError] = React.useState('');
    const [updating, setUpdating] = React.useState(false);
    const [existingEmail, setExistingEmail] = React.useState(null);

    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleMouseDownPassword = (event) => event.preventDefault();

    const handleUpdateChange = (e) => {
        setUpdateData({ ...updateData, [e.target.name]: e.target.value });
    };

    const handleUpdateSubmit = async () => {
        setUpdateError('');
        if (!updateData.email || !updateData.password || !updateData.confirmPassword) {
            setUpdateError('Todos los campos son obligatorios');
            return;
        }
        if (updateData.password !== updateData.confirmPassword) {
            setUpdateError('Las contraseñas no coinciden');
            return;
        }
        if (updateData.password.length < 6) {
            setUpdateError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setUpdating(true);
        try {
            const response = await axios.post(
                configData.API_SERVER + 'manage-users/update-credentials/',
                { email: updateData.email, password: updateData.password },
                { headers: { Authorization: `Bearer ${tempToken}` } }
            );

            if (response.data.success) {
                dispatcher({
                    type: ACCOUNT_INITIALIZE,
                    payload: { isLoggedIn: true, user: response.data.user, token: tempToken }
                });
                setForceUpdateOpen(false);
            } else {
                setUpdateError(response.data.msg || 'Error al actualizar');
            }
        } catch (error) {
            console.error(error);
            setUpdateError(error.response?.data?.msg || JSON.stringify(error.response?.data) || 'Error de conexión');
        } finally {
            setUpdating(false);
        }
    };

    // customInput style (replaces theme.typography.customInput from old JSS)
    const inputSx = {
        ...theme.typography.customInput,
    };

    return (
        <React.Fragment>
            <Formik
                initialValues={{ email: '', password: '', submit: null }}
                validationSchema={Yup.object().shape({
                    email: Yup.string().max(255).required('El correo/usuario es obligatorio'),
                    password: Yup.string().max(255).required('La contraseña es obligatoria')
                })}
                onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
                    try {
                        axios
                            .post(configData.API_SERVER + 'login/', {
                                password: values.password,
                                email: values.email
                            })
                            .then(function (response) {
                                if (response.data.success) {
                                    if (response.data.requires_account_update) {
                                        setTempToken(response.data.token);
                                        const userEmail = response.data.user?.email;
                                        if (userEmail) {
                                            setExistingEmail(userEmail);
                                            setUpdateData(prev => ({ ...prev, email: userEmail }));
                                        }
                                        setForceUpdateOpen(true);
                                        setSubmitting(false);
                                    } else {
                                        dispatcher({
                                            type: ACCOUNT_INITIALIZE,
                                            payload: { isLoggedIn: true, user: response.data.user, token: response.data.token }
                                        });
                                        if (scriptedRef.current) {
                                            setStatus({ success: true });
                                            setSubmitting(false);
                                        }
                                    }
                                } else {
                                    setStatus({ success: false });
                                    setErrors({ submit: response.data.msg });
                                    setSubmitting(false);
                                }
                            })
                            .catch(function (error) {
                                setStatus({ success: false });
                                const errorMessage = error.response?.data?.msg || error.response?.data?.error || 'Error de conexión con el servidor';
                                setErrors({ submit: errorMessage });
                                setSubmitting(false);
                            });
                    } catch (err) {
                        console.error(err);
                        if (scriptedRef.current) {
                            setStatus({ success: false });
                            setErrors({ submit: err.message });
                            setSubmitting(false);
                        }
                    }
                }}
            >
                {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                    <form noValidate onSubmit={handleSubmit} {...others}>
                        <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={inputSx}>
                            <InputLabel htmlFor="outlined-adornment-email-login">Correo Electrónico / Carnet Identidad</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-email-login"
                                type="text"
                                value={values.email}
                                name="email"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                label="Correo Electrónico / Carnet Identidad"
                            />
                            {touched.email && errors.email && (
                                <FormHelperText error id="standard-weight-helper-text-email-login">
                                    {' '}{errors.email}{' '}
                                </FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth error={Boolean(touched.password && errors.password)} sx={inputSx}>
                            <InputLabel htmlFor="outlined-adornment-password-login">Contraseña</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password-login"
                                type={showPassword ? 'text' : 'password'}
                                value={values.password}
                                name="password"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="Contraseña"
                            />
                            {touched.password && errors.password && (
                                <FormHelperText error id="standard-weight-helper-text-password-login">
                                    {' '}{errors.password}{' '}
                                </FormHelperText>
                            )}
                        </FormControl>

                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={checked}
                                        onChange={(event) => setChecked(event.target.checked)}
                                        name="checked"
                                        color="primary"
                                    />
                                }
                                label="Recuérdame"
                            />
                            <Typography
                                variant="subtitle1"
                                component={Link}
                                to={login ? '/pages/forgot-password/forgot-password' + login : '#'}
                                color="secondary"
                                sx={{ textDecoration: 'none' }}
                            >
                                ¿Olvidaste tu contraseña?
                            </Typography>
                        </Stack>

                        {errors.submit && (
                            <Box sx={{ mt: 3 }}>
                                <FormHelperText error>{errors.submit}</FormHelperText>
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
                                    Iniciar Sesión
                                </Button>
                            </AnimateButton>
                        </Box>
                    </form>
                )}
            </Formik>

            {/* Force Update Dialog */}
            <Dialog open={forceUpdateOpen} disableEscapeKeyDown>
                <DialogTitle>Actualización de Credenciales Requerida</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {existingEmail
                            ? "Por seguridad, debes configurar una nueva contraseña personal para tu cuenta."
                            : "Por seguridad, debes configurar un correo electrónico y una nueva contraseña personal para tu cuenta."
                        }
                    </DialogContentText>
                    {updateError && (
                        <Box sx={{ mb: 2 }}>
                            <Typography color="error">{updateError}</Typography>
                        </Box>
                    )}
                    {!existingEmail && (
                        <TextField
                            autoFocus
                            margin="dense"
                            id="new-email"
                            label="Correo Electrónico"
                            type="email"
                            fullWidth
                            variant="outlined"
                            name="email"
                            value={updateData.email}
                            onChange={handleUpdateChange}
                            sx={{ mb: 2 }}
                        />
                    )}
                    <TextField
                        margin="dense"
                        id="new-password"
                        label="Nueva Contraseña"
                        type="password"
                        fullWidth
                        variant="outlined"
                        name="password"
                        value={updateData.password}
                        onChange={handleUpdateChange}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="confirm-password"
                        label="Confirmar Contraseña"
                        type="password"
                        fullWidth
                        variant="outlined"
                        name="confirmPassword"
                        value={updateData.confirmPassword}
                        onChange={handleUpdateChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUpdateSubmit} color="primary" variant="contained" disabled={updating}>
                        {updating ? 'Guardando...' : 'Guardar y Continuar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default RestLogin;
