import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink, useOutletContext } from 'react-router-dom';
import {
    Box, Container, Typography, Chip, Stack, Avatar, Divider,
    Skeleton, Breadcrumbs, Link, IconButton
} from '@mui/material';
import { IconCalendar, IconEye, IconArrowLeft, IconTag, IconShare } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';

const PublicBlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isDark, C: baseC } = useOutletContext();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const C = {
        ...baseC,
        chip:       isDark ? '#1a1530' : '#ede8ff',
        blockquote: isDark ? '#1a1530' : '#f0ebff',
        code:       isDark ? '#1e1a3a' : '#f3f0ff',
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${configData.API_SERVER}blog-posts/?status=published`)
            .then(res => {
                const found = res.data.find(p => p.slug === slug);
                if (!found) { setNotFound(true); return; }
                setPost(found);
                // increment views
                axios.post(`${configData.API_SERVER}blog-posts/${found.id}/increment_views/`).catch(() => {});
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);

    const date = post?.published_at
        ? new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : post ? new Date(post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: post.title, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <Box sx={{ background: C.bg }}>
            <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
                {/* Breadcrumb */}
                <Breadcrumbs sx={{ mb: 3 }}>
                    <Link component={RouterLink} to="/" underline="hover" sx={{ color: C.textMuted, fontSize: '0.85rem' }}>
                        Inicio
                    </Link>
                    <Link component={RouterLink} to="/blog" underline="hover" sx={{ color: C.textMuted, fontSize: '0.85rem' }}>
                        Blog
                    </Link>
                    <Typography sx={{ color: C.purple, fontSize: '0.85rem' }}>
                        {loading ? '...' : post?.title}
                    </Typography>
                </Breadcrumbs>

                <Box
                    component="button"
                    onClick={() => navigate('/blog')}
                    sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.75,
                        mb: 4, background: 'none', border: 'none', cursor: 'pointer', p: 0,
                        color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                        '&:hover': { color: C.purple },
                        transition: 'color 0.2s',
                    }}
                >
                    <IconArrowLeft size={16} />
                    Volver al Blog
                </Box>

                {loading ? (
                    <Box>
                        <Skeleton variant="text" width="60%" height={48} />
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mt: 3 }} />
                        <Skeleton variant="text" sx={{ mt: 3 }} />
                        <Skeleton variant="text" />
                        <Skeleton variant="text" width="80%" />
                    </Box>
                ) : notFound ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography variant="h4" sx={{ color: C.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
                            Artículo no encontrado
                        </Typography>
                        <Typography sx={{ color: C.textMuted, mt: 2 }}>
                            El artículo que buscas no existe o fue eliminado.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {/* Category + tags */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
                            {post.category_detail && (
                                <Chip
                                    label={post.category_detail.name}
                                    size="small"
                                    sx={{ bgcolor: `${C.purple}15`, color: C.purple, fontWeight: 700, fontSize: '0.75rem' }}
                                />
                            )}
                            {post.tags_list?.map(tag => (
                                <Chip key={tag} label={tag} size="small" icon={<IconTag size={11} />}
                                    sx={{ bgcolor: C.chip, color: C.textMuted, fontSize: '0.72rem' }} />
                            ))}
                        </Stack>

                        {/* Title */}
                        <Typography
                            variant="h1"
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 800,
                                fontSize: { xs: '1.75rem', md: '2.5rem' },
                                lineHeight: 1.25,
                                color: C.text,
                                mb: 3,
                            }}
                        >
                            {post.title}
                        </Typography>

                        {/* Meta */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, bgcolor: `${C.purple}22`, color: C.purple, fontSize: '0.85rem', fontWeight: 700 }}>
                                    {post.author_name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
                                        {post.author_name}
                                    </Typography>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Stack direction="row" spacing={0.4} alignItems="center">
                                            <IconCalendar size={12} color={C.textMuted} />
                                            <Typography sx={{ fontSize: '0.75rem', color: C.textMuted }}>{date}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.4} alignItems="center">
                                            <IconEye size={12} color={C.textMuted} />
                                            <Typography sx={{ fontSize: '0.75rem', color: C.textMuted }}>{post.views_count} vistas</Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                            <IconButton
                                onClick={handleShare}
                                size="small"
                                sx={{ color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 1.5, '&:hover': { color: C.purple, borderColor: C.purple } }}
                                title="Compartir"
                            >
                                <IconShare size={16} />
                            </IconButton>
                        </Stack>

                        {/* Cover image */}
                        {post.cover_image_url && (
                            <Box
                                component="img"
                                src={post.cover_image_url}
                                alt={post.title}
                                sx={{ width: '100%', borderRadius: 3, mb: 5, maxHeight: 480, objectFit: 'cover' }}
                            />
                        )}

                        {/* Excerpt */}
                        {post.excerpt && (
                            <Box sx={{
                                p: 3, mb: 4, borderRadius: 2,
                                borderLeft: `4px solid ${C.purple}`,
                                background: C.blockquote,
                            }}>
                                <Typography sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '1.05rem',
                                    fontStyle: 'italic',
                                    color: C.text,
                                    lineHeight: 1.7,
                                }}>
                                    {post.excerpt}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ borderColor: C.border, mb: 4 }} />

                        {/* Content */}
                        <Box
                            sx={{
                                '& p': { color: C.text, lineHeight: 1.9, mb: 2, fontFamily: "'DM Sans', sans-serif", fontSize: '1rem' },
                                '& h2': { color: C.text, fontWeight: 700, fontSize: '1.4rem', mt: 4, mb: 1.5, fontFamily: "'DM Sans', sans-serif" },
                                '& h3': { color: C.text, fontWeight: 700, fontSize: '1.15rem', mt: 3, mb: 1, fontFamily: "'DM Sans', sans-serif" },
                                '& ul, & ol': { color: C.text, pl: 3, mb: 2, lineHeight: 2 },
                                '& li': { mb: 0.5 },
                                '& blockquote': {
                                    borderLeft: `4px solid ${C.purple}`,
                                    pl: 2.5, ml: 0, mr: 0,
                                    background: C.blockquote,
                                    borderRadius: '0 8px 8px 0',
                                    py: 1,
                                    fontStyle: 'italic',
                                    color: C.textMuted,
                                },
                                '& code': {
                                    background: C.code,
                                    borderRadius: 1,
                                    px: 0.75,
                                    py: 0.25,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875em',
                                    color: C.purple,
                                },
                                '& pre': {
                                    background: C.code,
                                    borderRadius: 2,
                                    p: 2.5,
                                    overflow: 'auto',
                                    mb: 2,
                                    '& code': { background: 'none', p: 0 },
                                },
                                '& img': { maxWidth: '100%', borderRadius: 2 },
                                '& a': { color: C.purple, textDecoration: 'underline' },
                            }}
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </Box>
                )}
            </Container>

        </Box>
    );
};

export default PublicBlogPost;
