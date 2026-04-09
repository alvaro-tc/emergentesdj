import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Box, Container, Typography, Grid, Card, CardMedia, CardContent,
    Chip, Stack, InputAdornment, OutlinedInput, Skeleton, Divider,
    Avatar, Pagination
} from '@mui/material';
import { IconSearch, IconCalendar, IconEye, IconTag, IconArticle } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';

const POSTS_PER_PAGE = 9;

const BlogCardSkeleton = () => (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="100%" height={32} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
        </CardContent>
    </Card>
);

const BlogCard = ({ post, isDark, C, onClick }) => {
    const date = post.published_at
        ? new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date(post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Card
            onClick={onClick}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: `1px solid ${C.border}`,
                background: C.cardBg,
                transition: 'all 0.25s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 40px ${C.purple}22`,
                    borderColor: `${C.purple}55`,
                },
            }}
        >
            {post.cover_image_url ? (
                <CardMedia
                    component="img"
                    height={200}
                    image={post.cover_image_url}
                    alt={post.title}
                    sx={{ objectFit: 'cover' }}
                />
            ) : (
                <Box sx={{
                    height: 200,
                    background: `linear-gradient(135deg, ${C.purple}18 0%, ${C.purpleLight}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <IconArticle size={56} color={C.purple} opacity={0.4} />
                </Box>
            )}
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: 2.5 }}>
                {post.category_detail && (
                    <Chip
                        label={post.category_detail.name}
                        size="small"
                        sx={{
                            alignSelf: 'flex-start',
                            background: `${C.purple}15`,
                            color: C.purple,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                        }}
                    />
                )}
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: 1.4,
                        color: C.text,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {post.title}
                </Typography>
                {post.excerpt && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: C.textMuted,
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flexGrow: 1,
                        }}
                    >
                        {post.excerpt}
                    </Typography>
                )}
                <Divider sx={{ borderColor: C.border }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: `${C.purple}22`, color: C.purple }}>
                            {post.author_name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontSize: '0.75rem', color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                            {post.author_name}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Stack direction="row" spacing={0.4} alignItems="center">
                            <IconCalendar size={12} color={C.textMuted} />
                            <Typography sx={{ fontSize: '0.7rem', color: C.textMuted }}>{date}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.4} alignItems="center">
                            <IconEye size={12} color={C.textMuted} />
                            <Typography sx={{ fontSize: '0.7rem', color: C.textMuted }}>{post.views_count}</Typography>
                        </Stack>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

const PublicBlog = () => {
    const navigate = useNavigate();
    const { isDark, C: baseC } = useOutletContext();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [page, setPage] = useState(1);

    const C = {
        ...baseC,
        cardBg:   isDark ? '#0f1628' : '#ffffff',
        chip:     isDark ? '#1a1530' : '#ede8ff',
        featured: isDark ? '#12182e' : '#f0ebff',
    };

    useEffect(() => {
        Promise.all([
            axios.get(`${configData.API_SERVER}blog-posts/?status=published`),
            axios.get(`${configData.API_SERVER}blog-categories/`),
        ]).then(([postsRes, catsRes]) => {
            setPosts(postsRes.data);
            setCategories(catsRes.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    const filtered = posts.filter(p => {
        const matchSearch = !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
            p.author_name?.toLowerCase().includes(search.toLowerCase());
        const matchCat = !activeCategory || p.category_detail?.slug === activeCategory;
        return matchSearch && matchCat;
    });

    const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
    const featured = posts.find(p => p.status === 'published');

    return (
        <Box sx={{ background: C.bg }}>
            {/* Hero */}
            <Box sx={{
                background: `linear-gradient(135deg, ${C.surface} 0%, ${C.bg} 60%)`,
                borderBottom: `1px solid ${C.border}`,
                py: { xs: 6, md: 10 },
            }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: { xs: '2rem', md: '3rem' },
                            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleLight} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1.5,
                        }}
                    >
                        Blog
                    </Typography>
                    <Typography sx={{ color: C.textMuted, fontSize: '1.05rem', fontFamily: "'DM Sans', sans-serif", maxWidth: 520 }}>
                        Noticias, artículos y recursos educativos del equipo Sigeldyw.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
                {/* Featured post */}
                {!loading && featured && !search && !activeCategory && page === 1 && (
                    <Box
                        onClick={() => navigate(`/blog/${featured.slug}`)}
                        sx={{
                            mb: 6,
                            borderRadius: 4,
                            overflow: 'hidden',
                            border: `1px solid ${C.border}`,
                            background: C.featured,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            transition: 'all 0.25s ease',
                            '&:hover': { boxShadow: `0 16px 48px ${C.purple}22`, borderColor: `${C.purple}55` },
                        }}
                    >
                        {featured.cover_image_url ? (
                            <Box
                                component="img"
                                src={featured.cover_image_url}
                                alt={featured.title}
                                sx={{ width: { xs: '100%', md: 480 }, height: { xs: 240, md: 320 }, objectFit: 'cover', flexShrink: 0 }}
                            />
                        ) : (
                            <Box sx={{
                                width: { xs: '100%', md: 480 }, height: { xs: 240, md: 320 }, flexShrink: 0,
                                background: `linear-gradient(135deg, ${C.purple}20 0%, ${C.purpleLight}10 100%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <IconArticle size={80} color={C.purple} opacity={0.3} />
                            </Box>
                        )}
                        <Box sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label="Destacado" size="small" sx={{ bgcolor: `${C.purple}22`, color: C.purple, fontWeight: 700, fontSize: '0.7rem' }} />
                                {featured.category_detail && (
                                    <Chip label={featured.category_detail.name} size="small" sx={{ bgcolor: C.chip, color: C.textMuted, fontSize: '0.7rem' }} />
                                )}
                            </Stack>
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 800,
                                fontSize: { xs: '1.25rem', md: '1.75rem' },
                                lineHeight: 1.3,
                                color: C.text,
                            }}>
                                {featured.title}
                            </Typography>
                            {featured.excerpt && (
                                <Typography sx={{ color: C.textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
                                    {featured.excerpt}
                                </Typography>
                            )}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: `${C.purple}22`, color: C.purple }}>
                                        {featured.author_name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography sx={{ fontSize: '0.85rem', color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                                        {featured.author_name}
                                    </Typography>
                                </Stack>
                                <Typography sx={{ fontSize: '0.8rem', color: C.textMuted }}>
                                    {featured.published_at
                                        ? new Date(featured.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : ''}
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>
                )}

                {/* Filters */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} mb={4}>
                    <OutlinedInput
                        placeholder="Buscar artículos..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        size="small"
                        startAdornment={<InputAdornment position="start"><IconSearch size={16} color={C.textMuted} /></InputAdornment>}
                        sx={{
                            width: { xs: '100%', sm: 280 },
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border },
                            '& input': { color: C.text, fontFamily: "'DM Sans', sans-serif" },
                            background: C.cardBg,
                        }}
                    />
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                            label="Todos"
                            onClick={() => { setActiveCategory(null); setPage(1); }}
                            size="small"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: !activeCategory ? 700 : 400,
                                bgcolor: !activeCategory ? `${C.purple}22` : C.chip,
                                color: !activeCategory ? C.purple : C.textMuted,
                                border: !activeCategory ? `1px solid ${C.purple}44` : '1px solid transparent',
                            }}
                        />
                        {categories.map(cat => (
                            <Chip
                                key={cat.id}
                                label={cat.name}
                                onClick={() => { setActiveCategory(activeCategory === cat.slug ? null : cat.slug); setPage(1); }}
                                size="small"
                                icon={<IconTag size={12} />}
                                sx={{
                                    cursor: 'pointer',
                                    fontWeight: activeCategory === cat.slug ? 700 : 400,
                                    bgcolor: activeCategory === cat.slug ? `${C.purple}22` : C.chip,
                                    color: activeCategory === cat.slug ? C.purple : C.textMuted,
                                    border: activeCategory === cat.slug ? `1px solid ${C.purple}44` : '1px solid transparent',
                                }}
                            />
                        ))}
                    </Stack>
                </Stack>

                {/* Grid */}
                {loading ? (
                    <Grid container spacing={3}>
                        {[...Array(6)].map((_, i) => (
                            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                                <BlogCardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : paginated.length > 0 ? (
                    <Grid container spacing={3}>
                        {paginated.map(post => (
                            <Grid key={post.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <BlogCard
                                    post={post}
                                    isDark={isDark}
                                    C={C}
                                    onClick={() => navigate(`/blog/${post.slug}`)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <IconArticle size={64} color={C.textMuted} opacity={0.4} />
                        <Typography sx={{ color: C.textMuted, mt: 2, fontFamily: "'DM Sans', sans-serif" }}>
                            No se encontraron artículos
                        </Typography>
                    </Box>
                )}

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            sx={{
                                '& .MuiPaginationItem-root': { color: C.textMuted, borderColor: C.border },
                                '& .Mui-selected': { bgcolor: `${C.purple}22 !important`, color: `${C.purple} !important` },
                            }}
                        />
                    </Box>
                )}
            </Container>

        </Box>
    );
};

export default PublicBlog;
