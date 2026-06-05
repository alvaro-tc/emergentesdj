import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Typography, Box,
} from '@mui/material';
import { IconBrandWhatsapp, IconX } from '@tabler/icons-react';

const WhatsAppModal = ({ open, onClose, phone, contactName }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        const clean = phone.replace(/\D/g, '');
        const url = `https://wa.me/${clean}${text.trim() ? `?text=${encodeURIComponent(text.trim())}` : ''}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
        setText('');
    };

    const handleClose = () => {
        onClose();
        setText('');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconBrandWhatsapp size={22} color="#25D366" />
                <Typography variant="h5" component="span">Enviar WhatsApp</Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Destinatario: <strong>{contactName}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Número: <strong>{phone}</strong>
                    </Typography>
                </Box>
                <TextField
                    fullWidth multiline rows={4}
                    label="Mensaje (opcional)"
                    placeholder="Escribe un mensaje para enviar por WhatsApp..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    variant="outlined"
                    autoFocus
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={handleClose} startIcon={<IconX size={16} />} color="inherit">
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSend}
                    startIcon={<IconBrandWhatsapp size={16} />}
                    sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe57' }, textTransform: 'none' }}
                >
                    Abrir WhatsApp
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WhatsAppModal;
