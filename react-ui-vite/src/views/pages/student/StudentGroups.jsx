import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    Grid, Typography, Box, Card, CardContent, Chip,
    Stack, Divider, Avatar, Skeleton, Tooltip,
} from '@mui/material';
import axios from 'axios';
import configData from '../../../config';

import GroupsIcon from '@mui/icons-material/Groups';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradeIcon from '@mui/icons-material/Grade';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const CARD_GRADIENTS = [
    ['#1565C0', '#1976D2'],
    ['#2E7D32', '#388E3C'],
    ['#6A1B9A', '#7B1FA2'],
    ['#E65100', '#F57C00'],
    ['#00695C', '#00897B'],
    ['#AD1457', '#C2185B'],
];

const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'default';
    const n = parseFloat(score);
    if (n >= 71) return 'success';
    if (n >= 51) return 'warning';
    return 'error';
};

const MemberRow = ({ member }) => (
    <Box
        display="flex" alignItems="center" gap={1}
        sx={{
            p: 0.75, borderRadius: 1.5,
            bgcolor: member.is_leader ? 'warning.light' : 'action.hover',
            border: '1px solid',
            borderColor: member.is_leader ? 'warning.main' : 'transparent',
        }}
    >
        <Avatar sx={{
            width: 30, height: 30, fontSize: '0.78rem',
            bgcolor: member.is_leader ? 'warning.main' : 'grey.400',
        }}>
            {(member.full_name || '?').charAt(0).toUpperCase()}
        </Avatar>
        <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={member.is_leader ? 700 : 400} noWrap>
                {member.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">CI: {member.ci}</Typography>
        </Box>
        {member.is_leader && (
            <Tooltip title="Líder del grupo">
                <StarRoundedIcon sx={{ fontSize: 17, color: 'warning.dark', flexShrink: 0 }} />
            </Tooltip>
        )}
    </Box>
);

const StudentGroups = () => {
    const account = useSelector((s) => s.account);
    const activeCourse = useSelector((s) => s.account.activeCourse);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchGroups = useCallback(async () => {
        if (!activeCourse?.id) return;
        setLoading(true);
        try {
            const { data } = await axios.get(
                `${configData.API_SERVER}project-registration/my_groups/?course_id=${activeCourse.id}`,
                { headers: { Authorization: `Bearer ${account.token}` } }
            );
            setGroups(data);
        } catch {
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, [activeCourse?.id, account.token]);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);

    if (!activeCourse) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <GroupsIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h4" color="text.secondary">Sin paralelo seleccionado</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                    Usa el buscador del encabezado para seleccionar un paralelo.
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {/* Header */}
            <Grid size={12}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <GroupsIcon color="primary" sx={{ fontSize: 30 }} />
                    <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h2">Mis Grupos</Typography>
                            {!loading && groups.length > 0 && (
                                <Chip
                                    label={`${groups.length} grupo${groups.length !== 1 ? 's' : ''}`}
                                    size="small" color="primary" variant="outlined"
                                />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {activeCourse.subject_details?.name} — Paralelo {activeCourse.parallel}
                        </Typography>
                    </Box>
                </Box>
            </Grid>

            {loading ? (
                [1, 2, 3].map((i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
                    </Grid>
                ))
            ) : groups.length === 0 ? (
                <Grid size={12}>
                    <Box sx={{
                        textAlign: 'center', py: 10, px: 4,
                        bgcolor: 'background.paper', borderRadius: 3,
                        border: '2px dashed', borderColor: 'divider',
                    }}>
                        <GroupsIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h4" color="text.secondary" gutterBottom>
                            Sin grupos en este paralelo
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            Aún no estás inscrito en ningún grupo para{' '}
                            <strong>{activeCourse.subject_details?.name} — {activeCourse.parallel}</strong>.
                        </Typography>
                    </Box>
                </Grid>
            ) : (
                groups.map((group, idx) => {
                    const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                    const scoreVal = group.score !== null ? parseFloat(group.score) : null;
                    const hasScore = scoreVal !== null && scoreVal > 0;

                    return (
                        <Grid key={group.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                            <Card sx={{
                                height: '100%', display: 'flex', flexDirection: 'column',
                                borderRadius: 3, overflow: 'hidden',
                                boxShadow: '0 2px 14px rgba(0,0,0,0.09)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 26px rgba(0,0,0,0.14)' },
                            }}>
                                {/* Gradient header */}
                                <Box sx={{ background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`, p: 2.5 }}>
                                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                                        <Box flex={1} minWidth={0}>
                                            <Typography
                                                variant="overline"
                                                sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', lineHeight: 1.2, display: 'block' }}
                                            >
                                                Grupo #{group.group_number ?? '—'}
                                            </Typography>
                                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.3 }} noWrap title={group.name}>
                                                {group.name}
                                            </Typography>
                                        </Box>
                                        {hasScore && (
                                            <Chip
                                                label={scoreVal.toFixed(1)}
                                                color={getScoreColor(scoreVal)}
                                                icon={<GradeIcon />}
                                                size="small"
                                                sx={{ fontWeight: 700, flexShrink: 0 }}
                                            />
                                        )}
                                    </Box>
                                    <Chip
                                        icon={<AssignmentIcon sx={{ fontSize: '0.8rem !important', color: 'white !important' }} />}
                                        label={group.sub_criterion_name}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 1, fontSize: '0.68rem', height: 22 }}
                                    />
                                </Box>

                                {/* Body */}
                                <CardContent sx={{ flex: 1, p: 2 }}>
                                    {group.description && (
                                        <Typography
                                            variant="body2" color="text.secondary"
                                            sx={{ mb: 1.5, fontStyle: 'italic' }}
                                        >
                                            {group.description}
                                        </Typography>
                                    )}

                                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                                        <PersonIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            {group.members_count} integrante{group.members_count !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>

                                    <Stack spacing={0.6}>
                                        {group.members.map((m) => (
                                            <MemberRow key={m.ci} member={m} />
                                        ))}
                                    </Stack>

                                    {group.observations && (
                                        <>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Box display="flex" alignItems="flex-start" gap={0.5}>
                                                <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {group.observations}
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })
            )}
        </Grid>
    );
};

export default StudentGroups;
