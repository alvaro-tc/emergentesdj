import React from 'react';
import {
    List, ListItemButton, ListItemText, ListItemAvatar,
    Avatar, Typography, Chip, Divider, Box,
} from '@mui/material';
import { IconMail, IconMailOpened } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS = { unread: 'error', read: 'default', replied: 'success' };
const STATUS_LABELS = { unread: 'No leído', read: 'Leído', replied: 'Respondido' };

const MessagesList = ({ messages, selectedId, onSelect }) => {
    if (!messages.length) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <IconMailOpened size={48} color="gray" />
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                    No hay mensajes aún.
                </Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {messages.map((msg, idx) => {
                const isUnread = msg.status === 'unread';
                const isSelected = msg.id === selectedId;
                const initials = `${msg.nombre?.[0] ?? ''}${msg.apellidos?.[0] ?? ''}`.toUpperCase();
                const timeAgo = (() => {
                    try { return formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: es }); }
                    catch { return ''; }
                })();

                return (
                    <React.Fragment key={msg.id}>
                        <ListItemButton
                            selected={isSelected}
                            onClick={() => onSelect(msg)}
                            sx={{
                                py: 1.5, px: 2,
                                background: isUnread && !isSelected ? 'action.hover' : undefined,
                                borderLeft: isUnread ? '3px solid' : '3px solid transparent',
                                borderLeftColor: isUnread ? 'error.main' : 'transparent',
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{
                                    width: 38, height: 38, fontSize: '0.8rem',
                                    bgcolor: isUnread ? 'error.light' : 'grey.300',
                                    color: isUnread ? 'error.dark' : 'text.secondary',
                                }}>
                                    {initials || <IconMail size={18} />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: isUnread ? 700 : 400, flex: 1, noWrap: true }}
                                            noWrap
                                        >
                                            {msg.full_name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ flexShrink: 0 }}>
                                            {timeAgo}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.3 }}>
                                        <Typography variant="caption" color="textSecondary" noWrap sx={{ flex: 1 }}>
                                            {msg.asunto}
                                        </Typography>
                                        <Chip
                                            size="small" label={STATUS_LABELS[msg.status]}
                                            color={STATUS_COLORS[msg.status]}
                                            sx={{ height: 18, fontSize: '0.6rem', ml: 1, flexShrink: 0 }}
                                        />
                                    </Box>
                                }
                            />
                        </ListItemButton>
                        {idx < messages.length - 1 && <Divider />}
                    </React.Fragment>
                );
            })}
        </List>
    );
};

export default MessagesList;
