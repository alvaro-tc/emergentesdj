import React from 'react';
import { Box, Typography } from '@mui/material';
import { IconSchool, IconCalendarTime, IconBrandWhatsapp, IconExternalLink } from '@tabler/icons-react';
import { DARK, LIGHT } from './LandingTheme';
import { getScheduleItems } from '../../../utils/scheduleUtils';

// ─── CourseCard ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, getImageUrl, isDark, mobile = false, actions }) => {
    const C = isDark ? DARK : LIGHT;
    const scheduleItems = getScheduleItems(course.schedule);

    return (
        <Box sx={{
            flex: mobile ? '0 0 calc(100vw - 48px)' : undefined,
            scrollSnapAlign: mobile ? 'start' : undefined,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            height: mobile ? 'auto' : 'auto',
            minHeight: '470px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            '&:hover': {
                borderColor: C.purpleLight,
                transform: 'translateY(-4px)',
                boxShadow: isDark
                    ? '0 16px 48px rgba(0,0,0,0.5)'
                    : `0 16px 48px ${LIGHT.purpleDim}`,
            },
        }}>
            {/* Image header */}
            <Box sx={{ height: 155, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                {course.image ? (
                    <img
                        src={getImageUrl(course.image)}
                        alt={course.subject_details?.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Box sx={{
                        width: '100%', height: '100%',
                        background: isDark
                            ? 'linear-gradient(135deg, #0f1d38 0%, #1a1048 100%)'
                            : `linear-gradient(135deg, ${LIGHT.purpleDim} 0%, ${LIGHT.border} 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <IconSchool size={36} color={`${C.purple}60`} />
                    </Box>
                )}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: isDark
                        ? 'linear-gradient(to bottom, transparent 40%, rgba(15,20,40,0.8) 100%)'
                        : 'linear-gradient(to bottom, transparent 40%, rgba(247,245,255,0.6) 100%)',
                }} />
                {/* Course code badge */}
                <Box sx={{
                    position: 'absolute', top: 10, left: 10,
                    px: 1.25, py: 0.4,
                    background: `${C.purple}20`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${C.purple}40`,
                    borderRadius: '4px',
                }}>
                    <Typography sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.62rem',
                        letterSpacing: '0.1em',
                        color: isDark ? C.purpleLight : C.purple,
                        textTransform: 'uppercase',
                    }}>
                        {course.subject_details?.code || 'CURSO'}
                    </Typography>
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '1.05rem',
                    color: C.text,
                    lineHeight: 1.3,
                    mb: 0.5,
                }}>
                    {course.subject_details?.name}
                </Typography>
                <Typography sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.68rem',
                    letterSpacing: '0.08em',
                    color: C.textMuted,
                    mb: scheduleItems.length > 0 ? 1.5 : 0,
                }}>
                    Paralelo {course.parallel}
                </Typography>

                {scheduleItems.length > 0 && (
                    <Box sx={{
                        p: 1.25,
                        background: isDark ? '#ffffff06' : '#6d28d908',
                        border: `1px solid ${C.border}`,
                        borderRadius: '6px',
                        mb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.4,
                    }}>
                        {scheduleItems.map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <IconCalendarTime size={12} color={C.textMuted} />
                                <Typography sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.75rem',
                                    color: C.textMuted,
                                }}>
                                    {item}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto' }}>
                    {course.platform_link && (
                        <Box component="a" href={course.platform_link} target="_blank" rel="noopener noreferrer" sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                            textDecoration: 'none',
                            py: 1.1,
                            background: 'transparent',
                            border: `1px solid ${C.border}`,
                            borderRadius: '6px',
                            color: C.textMuted,
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: '0.83rem',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: C.purple, color: C.purple, background: C.purpleDim },
                        }}>
                            <IconExternalLink size={14} />
                            Plataforma Virtual
                        </Box>
                    )}
                    {course.whatsapp_link && (
                        <Box component="a" href={course.whatsapp_link} target="_blank" rel="noopener noreferrer" sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                            textDecoration: 'none',
                            py: 1.1,
                            background: C.greenDim,
                            border: `1px solid ${C.green}35`,
                            borderRadius: '6px',
                            color: C.green,
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: '0.83rem',
                            transition: 'all 0.2s',
                            '&:hover': { background: `${C.green}28`, borderColor: C.green },
                        }}>
                            <IconBrandWhatsapp size={15} />
                            Unirse al grupo
                        </Box>
                    )}


                    {/* Render action slot (used in PublicCourses for 'Inscribirse' button) */}
                    {actions && (
                        <Box sx={{ mt: 1 }}>
                            {actions}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CourseCard;
