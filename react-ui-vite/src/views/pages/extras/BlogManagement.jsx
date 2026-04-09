import React, { useState, useEffect } from 'react';
import {
    Button, CardContent, Divider, Grid, IconButton, InputAdornment,
    OutlinedInput, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, TextField,
    Box, Chip, Typography, MenuItem, Select, FormControl, InputLabel,
    Tabs, Tab, Stack, Tooltip
} from '@mui/material';
import {
    IconSearch, IconPlus, IconEdit, IconTrash, IconPhoto,
    IconEye, IconEyeOff, IconTag, IconCategory
} from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const EMPTY_FORM = {
    title: '',
    excerpt: '',
    content: '',
    author_name: '',
    category: '',
    tags: '',
    status: 'draft',
    cover_image: null,
};

const BlogManagement = () => {
    const account = useSelector((s) => s.account);
    const [tab, setTab] = useState(0); // 0=posts, 1=categories
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [imagePreview, setImagePreview] = useState(null);

    // Category dialog
    const [openCatDialog, setOpenCatDialog] = useState(false);
    const [catName, setCatName] = useState('');
    const [selectedCat, setSelectedCat] = useState(null);
    const [openCatDeleteDialog, setOpenCatDeleteDialog] = useState(false);
    const [catToDelete, setCatToDelete] = useState(null);

    const fetchPosts = () => {
        axios.get(`${configData.API_SERVER}blog-posts/`)
            .then(r => setPosts(r.data))
            .catch(console.error);
    };

    const fetchCategories = () => {
        axios.get(`${configData.API_SERVER}blog-categories/`)
            .then(r => setCategories(r.data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, []);

    // ── Posts CRUD ───────────────────────────────────────────────────────────
    const handleAdd = () => {
        setSelectedPost(null);
        setFormData(EMPTY_FORM);
        setImagePreview(null);
        setOpenDialog(true);
    };

    const handleEdit = (post) => {
        setSelectedPost(post);
        setFormData({
            title: post.title,
            excerpt: post.excerpt || '',
            content: post.content,
            author_name: post.author_name || '',
            category: post.category || '',
            tags: post.tags || '',
            status: post.status,
            cover_image: null,
        });
        setImagePreview(post.cover_image_url || null);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        try {
            await axios.delete(`${configData.API_SERVER}blog-posts/${toDelete}/`);
            fetchPosts();
        } catch (e) { console.error(e); }
        setOpenDeleteDialog(false);
        setToDelete(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, cover_image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('excerpt', formData.excerpt);
            data.append('content', formData.content);
            data.append('author_name', formData.author_name);
            data.append('tags', formData.tags);
            data.append('status', formData.status);
            if (formData.category) data.append('category', formData.category);
            if (formData.cover_image) data.append('cover_image', formData.cover_image);

            if (selectedPost) {
                await axios.patch(`${configData.API_SERVER}blog-posts/${selectedPost.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post(`${configData.API_SERVER}blog-posts/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchPosts();
            setOpenDialog(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar: ' + (e.response?.data?.detail || e.message));
        }
    };

    const handleToggleStatus = async (post) => {
        try {
            const action = post.status === 'published' ? 'unpublish' : 'publish';
            await axios.post(`${configData.API_SERVER}blog-posts/${post.id}/${action}/`);
            fetchPosts();
        } catch (e) { console.error(e); }
    };

    // ── Categories CRUD ──────────────────────────────────────────────────────
    const handleAddCat = () => {
        setSelectedCat(null);
        setCatName('');
        setOpenCatDialog(true);
    };

    const handleEditCat = (cat) => {
        setSelectedCat(cat);
        setCatName(cat.name);
        setOpenCatDialog(true);
    };

    const handleSaveCat = async () => {
        try {
            if (selectedCat) {
                await axios.patch(`${configData.API_SERVER}blog-categories/${selectedCat.id}/`, { name: catName });
            } else {
                await axios.post(`${configData.API_SERVER}blog-categories/`, { name: catName });
            }
            fetchCategories();
            setOpenCatDialog(false);
        } catch (e) {
            alert('Error: ' + (e.response?.data?.name?.[0] || e.message));
        }
    };

    const handleDeleteCat = (id) => {
        setCatToDelete(id);
        setOpenCatDeleteDialog(true);
    };

    const handleConfirmDeleteCat = async () => {
        if (!catToDelete) return;
        try {
            await axios.delete(`${configData.API_SERVER}blog-categories/${catToDelete}/`);
            fetchCategories();
        } catch (e) { console.error(e); }
        setOpenCatDeleteDialog(false);
        setCatToDelete(null);
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(search.toLowerCase())
    );

    const statusChip = (status) => (
        <Chip
            label={status === 'published' ? 'Publicado' : 'Borrador'}
            size="small"
            sx={{
                bgcolor: status === 'published' ? '#22c55e22' : '#f59e0b22',
                color: status === 'published' ? '#16a34a' : '#b45309',
                fontWeight: 600,
                fontSize: '0.72rem',
            }}
        />
    );

    return (
        <MainCard title="Blog" content={false}>
            <CardContent>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                    <Tab label="Entradas" icon={<IconTag size={16} />} iconPosition="start" />
                    <Tab label="Categorías" icon={<IconCategory size={16} />} iconPosition="start" />
                </Tabs>

                {tab === 0 && (
                    <>
                        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                            <Grid>
                                <OutlinedInput
                                    placeholder="Buscar"
                                    size="small"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    startAdornment={<InputAdornment position="start"><IconSearch stroke={1.5} size="1rem" /></InputAdornment>}
                                />
                            </Grid>
                            <Grid>
                                <Button variant="contained" color="secondary" startIcon={<IconPlus />} onClick={handleAdd}>
                                    Nueva Entrada
                                </Button>
                            </Grid>
                        </Grid>
                        <Divider sx={{ mt: 2 }} />
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Portada</TableCell>
                                        <TableCell>Título</TableCell>
                                        <TableCell>Autor</TableCell>
                                        <TableCell>Categoría</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell>Vistas</TableCell>
                                        <TableCell>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPosts
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map(post => (
                                            <TableRow key={post.id} hover>
                                                <TableCell>{post.id}</TableCell>
                                                <TableCell>
                                                    {post.cover_image_url
                                                        ? <img src={post.cover_image_url} alt={post.title} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                                        : <IconPhoto size="2rem" />
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {post.title}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{post.author_name}</TableCell>
                                                <TableCell>{post.category_detail?.name || '-'}</TableCell>
                                                <TableCell>{statusChip(post.status)}</TableCell>
                                                <TableCell>{post.views_count}</TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title={post.status === 'published' ? 'Despublicar' : 'Publicar'}>
                                                            <IconButton size="small" onClick={() => handleToggleStatus(post)}>
                                                                {post.status === 'published'
                                                                    ? <IconEyeOff size="1.2rem" />
                                                                    : <IconEye size="1.2rem" />
                                                                }
                                                            </IconButton>
                                                        </Tooltip>
                                                        <IconButton size="small" onClick={() => handleEdit(post)}>
                                                            <IconEdit size="1.2rem" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(post.id)}>
                                                            <IconTrash size="1.2rem" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {filteredPosts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">No se encontraron entradas</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredPosts.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, v) => setPage(v)}
                            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        />
                    </>
                )}

                {tab === 1 && (
                    <>
                        <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
                            <Button variant="contained" color="secondary" startIcon={<IconPlus />} onClick={handleAddCat}>
                                Nueva Categoría
                            </Button>
                        </Grid>
                        <Divider />
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Nombre</TableCell>
                                        <TableCell>Slug</TableCell>
                                        <TableCell>Entradas</TableCell>
                                        <TableCell>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categories.map(cat => (
                                        <TableRow key={cat.id} hover>
                                            <TableCell>{cat.id}</TableCell>
                                            <TableCell>{cat.name}</TableCell>
                                            <TableCell><code>{cat.slug}</code></TableCell>
                                            <TableCell>{posts.filter(p => p.category === cat.id).length}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleEditCat(cat)}>
                                                    <IconEdit size="1.2rem" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteCat(cat.id)}>
                                                    <IconTrash size="1.2rem" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {categories.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">No hay categorías</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </CardContent>

            {/* ── Post Dialog ──────────────────────────────────────────────── */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
                <DialogTitle>{selectedPost ? 'Editar Entrada' : 'Nueva Entrada de Blog'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={12}>
                            <TextField fullWidth label="Título" name="title" value={formData.title} onChange={handleFormChange} required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Autor" name="author_name" value={formData.author_name} onChange={handleFormChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Categoría</InputLabel>
                                <Select name="category" value={formData.category} label="Categoría" onChange={handleFormChange}>
                                    <MenuItem value="">Sin categoría</MenuItem>
                                    {categories.map(cat => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth label="Extracto" name="excerpt" value={formData.excerpt}
                                onChange={handleFormChange} multiline rows={2}
                                helperText="Breve descripción del artículo (máx. 500 caracteres)"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth label="Contenido" name="content" value={formData.content}
                                onChange={handleFormChange} multiline rows={10} required
                                helperText="Puedes usar HTML para dar formato al contenido"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Etiquetas" name="tags" value={formData.tags}
                                onChange={handleFormChange}
                                helperText="Separadas por comas: educación, tecnología, noticias"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select name="status" value={formData.status} label="Estado" onChange={handleFormChange}>
                                    <MenuItem value="draft">Borrador</MenuItem>
                                    <MenuItem value="published">Publicado</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<IconPhoto />}>
                                {imagePreview ? 'Cambiar imagen de portada' : 'Subir imagen de portada'}
                                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                            </Button>
                        </Grid>
                        {imagePreview && (
                            <Grid size={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, objectFit: 'cover' }} />
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" color="secondary">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Post Dialog ───────────────────────────────────────── */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Entrada</DialogTitle>
                <DialogContent>
                    <DialogContentText>¿Seguro que desea eliminar esta entrada? Esta acción no se puede deshacer.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* ── Category Dialog ──────────────────────────────────────────── */}
            <Dialog open={openCatDialog} onClose={() => setOpenCatDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{selectedCat ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth label="Nombre de la categoría" value={catName}
                        onChange={e => setCatName(e.target.value)} sx={{ mt: 1 }} autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCatDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSaveCat} variant="contained" color="secondary">Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Category Dialog ───────────────────────────────────── */}
            <Dialog open={openCatDeleteDialog} onClose={() => setOpenCatDeleteDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Categoría</DialogTitle>
                <DialogContent>
                    <DialogContentText>¿Seguro que desea eliminar esta categoría?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCatDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDeleteCat} variant="contained" color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
};

export default BlogManagement;
