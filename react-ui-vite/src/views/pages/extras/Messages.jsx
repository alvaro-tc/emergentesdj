import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Grid, Paper, Typography, CircularProgress,
    Alert, Badge, Chip, IconButton, Tooltip,
} from '@mui/material';
import { IconRefresh, IconMailOpened } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import MainCard from '../../../ui-component/cards/MainCard';
import configData from '../../../config';
import MessagesList from './MessagesList';
import MessageDetail from './MessageDetail';

const Messages = () => {
    const token = useSelector(s => s.account.token);
    const [messages, setMessages] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${configData.API_SERVER}contact-messages/`, { headers });
            setMessages(data);
        } catch {
            setError('Error al cargar los mensajes.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleSelect = async (msg) => {
        setSelected(msg);
        if (msg.status === 'unread') {
            // optimistic update
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            setSelected(prev => prev?.id === msg.id ? { ...prev, status: 'read' } : prev);
            try {
                const { data } = await axios.get(`${configData.API_SERVER}contact-messages/${msg.id}/`, { headers });
                setSelected(data);
                setMessages(prev => prev.map(m => m.id === data.id ? data : m));
            } catch { /* silently ignore */ }
        }
    };

    const handleDeleted = (id) => {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const handleReplied = (id) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'replied' } : m));
        setSelected(prev => prev?.id === id ? { ...prev, status: 'replied' } : prev);
    };

    const unreadCount = messages.filter(m => m.status === 'unread').length;

    return (
        <MainCard
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h3">Mensajes de Contacto</Typography>
                    {unreadCount > 0 && (
                        <Chip size="small" label={`${unreadCount} sin leer`} color="error" />
                    )}
                </Box>
            }
            secondary={
                <Tooltip title="Actualizar">
                    <IconButton size="small" onClick={fetchMessages} disabled={loading}>
                        <IconRefresh size={18} />
                    </IconButton>
                </Tooltip>
            }
        >
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Grid container sx={{ minHeight: 520 }}>
                        {/* Left: message list */}
                        <Grid size={{ xs: 12, md: 4 }} sx={{
                            borderRight: { md: '1px solid' }, borderColor: { md: 'divider' },
                            overflowY: 'auto', maxHeight: 580,
                        }}>
                            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconMailOpened size={16} />
                                <Typography variant="caption" color="textSecondary">
                                    {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                            <MessagesList messages={messages} selectedId={selected?.id} onSelect={handleSelect} />
                        </Grid>

                        {/* Right: message detail */}
                        <Grid size={{ xs: 12, md: 8 }} sx={{ overflowY: 'auto', maxHeight: 580 }}>
                            {selected ? (
                                <MessageDetail
                                    message={selected}
                                    token={token}
                                    onDeleted={handleDeleted}
                                    onReplied={handleReplied}
                                />
                            ) : (
                                <Box sx={{
                                    height: '100%', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'text.disabled', p: 4,
                                }}>
                                    <IconMailOpened size={52} />
                                    <Typography variant="body2" sx={{ mt: 2 }}>
                                        Selecciona un mensaje para verlo
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            )}
        </MainCard>
    );
};

export default Messages;
