import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import MuiAvatar from '@mui/material/Avatar';

//-----------------------|| AVATAR ||-----------------------//

const Avatar = ({ className, color, outline, size, sx = {}, ...others }) => {
    const theme = useTheme();

    // Build sx styles based on color and outline props
    const colorMap = {
        primary: {
            bg: theme.palette.primary.main,
            text: theme.palette.background.paper,
            border: theme.palette.primary.main,
        },
        secondary: {
            bg: theme.palette.secondary.main,
            text: theme.palette.background.paper,
            border: theme.palette.secondary.main,
        },
        error: {
            bg: theme.palette.error.main,
            text: theme.palette.background.paper,
            border: theme.palette.error.main,
        },
        warning: {
            bg: theme.palette.warning.dark,
            text: theme.palette.background.paper,
            border: theme.palette.warning.dark,
        },
        info: {
            bg: theme.palette.info.main,
            text: theme.palette.background.paper,
            border: theme.palette.info.main,
        },
        success: {
            bg: theme.palette.success.dark,
            text: theme.palette.background.paper,
            border: theme.palette.success.dark,
        },
        grey: {
            bg: theme.palette.grey[500],
            text: theme.palette.background.paper,
            border: theme.palette.grey[500],
        },
    };

    const sizeMap = {
        badge: { width: theme.spacing(3.5), height: theme.spacing(3.5) },
        xs: { width: theme.spacing(4.25), height: theme.spacing(4.25) },
        sm: { width: theme.spacing(5), height: theme.spacing(5) },
        md: { width: theme.spacing(7), height: theme.spacing(7) },
        lg: { width: theme.spacing(9), height: theme.spacing(9) },
        xl: { width: theme.spacing(10.25), height: theme.spacing(10.25) },
    };

    const colorStyles = color && colorMap[color]
        ? outline
            ? {
                background: theme.palette.background.paper,
                color: colorMap[color].border,
                border: `2px solid ${colorMap[color].border}`,
            }
            : {
                background: colorMap[color].bg,
                color: colorMap[color].text,
            }
        : {};

    const sizeStyles = size && sizeMap[size] ? sizeMap[size] : {};

    return (
        <MuiAvatar
            className={className}
            sx={{ ...colorStyles, ...sizeStyles, ...sx }}
            {...others}
        />
    );
};

Avatar.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    outline: PropTypes.bool,
    size: PropTypes.string,
    sx: PropTypes.object,
};

export default Avatar;
