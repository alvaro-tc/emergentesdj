import React, { useState } from 'react';
import {
    Box, Typography, Chip, TextField, Button, Divider,
    Stack, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { IconTrash, IconSend, IconX, IconMail, IconPhone, IconClock } from '@tabler/icons-react';
import WhatsAppModal from './WhatsAppModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import configData from '../../../config';

const STATUS_COLORS = { unread: 'error', read: 'default', replied: 'success' };
const STATUS_LABELS = { unread: 'No leído', read: 'Leído', replied: 'Respondido' };

const MessageDetail = ({ message, token, onDeleted, onReplied }) => {
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [whatsappOpen, setWhatsappOpen] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const handleReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        setAlert(null);
        try {
            await axios.post(`${configData.API_SERVER}contact-messages/${message.id}/reply/`, { reply_text: reply }, { headers });
            setReply('');
            setAlert({ severity: 'success', text: 'Respuesta enviada correctamente.' });
            onReplied(message.id);
        } catch {
            setAlert({ severity: 'error', text: 'Error al enviar la respuesta.' });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Eliminar este mensaje?')) return;
        setDeleting(true);
        try {
            await axios.delete(`${configData.API_SERVER}contact-messages/${message.id}/`, { headers });
            onDeleted(message.id);
        } catch {
            setAlert({ severity: 'error', text: 'Error al eliminar el mensaje.' });
            setDeleting(false);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ mb: 0.5 }}>{message.asunto}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                        {message.full_name}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={STATUS_LABELS[message.status]} color={STATUS_COLORS[message.status]} />
                    <IconButton size="small" color="error" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <CircularProgress size={16} /> : <IconTrash size={16} />}
                    </IconButton>
                </Stack>
            </Box>

            {/* Meta info */}
            <Stack direction="row" spacing={2.5} sx={{ mb: 2.5 }} flexWrap="wrap">
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <IconMail size={14} color="gray" />
                    <Typography variant="caption" color="textSecondary">{message.email}</Typography>
                </Stack>
                {message.celular && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <IconPhone size={14} color="gray" />
                        <Typography
                            variant="caption"
                            color="primary"
                            onClick={() => setWhatsappOpen(true)}
                            sx={{ cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: '#25D366' } }}
                        >
                            {message.celular}
                        </Typography>
                    </Stack>
                )}
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <IconClock size={14} color="gray" />
                    <Typography variant="caption" color="textSecondary">
                        {format(new Date(message.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </Typography>
                </Stack>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Message body */}
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2.5 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {message.mensaje}
                </Typography>
                {message.replied_at && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 2 }}>
                        Respondido el {format(new Date(message.replied_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </Typography>
                )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Reply section */}
            {alert && (
                <Alert severity={alert.severity} onClose={() => setAlert(null)} sx={{ mb: 1.5 }}>
                    {alert.text}
                </Alert>
            )}
            <TextField
                fullWidth multiline rows={3}
                placeholder={`Responder a ${message.nombre}...`}
                value={reply} onChange={e => setReply(e.target.value)}
                variant="outlined" size="small" sx={{ mb: 1.5 }}
            />
            <Button
                variant="contained" color="secondary" disabled={sending || !reply.trim()}
                startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <IconSend size={16} />}
                onClick={handleReply} sx={{ alignSelf: 'flex-end', textTransform: 'none' }}
            >
                {sending ? 'Enviando...' : 'Enviar Respuesta'}
            </Button>

            {message.celular && (
                <WhatsAppModal
                    open={whatsappOpen}
                    onClose={() => setWhatsappOpen(false)}
                    phone={message.celular}
                    contactName={message.full_name}
                />
            )}
        </Box>
    );
};

export default MessageDetail;
