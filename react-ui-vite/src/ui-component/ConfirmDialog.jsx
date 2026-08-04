import React from 'react';
import PropTypes from 'prop-types';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

/** Diálogo genérico de confirmación. */
const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    confirmColor = 'secondary',
    onCancel,
    onConfirm
}) => (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel} color="primary">
                {cancelLabel}
            </Button>
            <Button onClick={onConfirm} variant="contained" color={confirmColor} autoFocus>
                {confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.node.isRequired,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    confirmColor: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default ConfirmDialog;
