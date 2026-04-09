import React, { useState, useEffect } from 'react';
import {
    Button,
    CardContent,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    OutlinedInput,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Box
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconPhoto } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const Publications = () => {
    const account = useSelector((state) => state.account);
    const [publications, setPublications] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPublication, setSelectedPublication] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [publicationToDelete, setPublicationToDelete] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        stock: 0,
        pages: 0,
        dl: '',
        summary: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);

    const fetchPublications = () => {
        axios.get(configData.API_SERVER + 'publications/')
            .then(response => {
                setPublications(response.data);
            })
            .catch(error => console.error("Error fetching publications", error));
    };

    useEffect(() => {
        fetchPublications();
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event) => {
        setSearch(event.target.value);
    };

    const handleAdd = () => {
        setSelectedPublication(null);
        setFormData({
            title: '',
            author: '',
            stock: 0,
            pages: 0,
            dl: '',
            summary: '',
            image: null
        });
        setImagePreview(null);
        setOpenDialog(true);
    };

    const handleEdit = (publication) => {
        setSelectedPublication(publication);
        setFormData({
            title: publication.title,
            author: publication.author,
            stock: publication.stock,
            pages: publication.pages,
            dl: publication.dl || '',
            summary: publication.summary,
            image: null
        });
        setImagePreview(publication.image_url);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setPublicationToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!publicationToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}publications/${publicationToDelete}/`);
            fetchPublications();
            setOpenDeleteDialog(false);
            setPublicationToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                image: file
            });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            // Debug: check if token exists
            if (!account.token) {
                console.error("No authentication token found. User may not be logged in.");
                alert("Por favor, inicia sesión para realizar esta acción.");
                return;
            }

            console.log("Token exists:", account.token.substring(0, 10) + "...");

            // axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;

            const data = new FormData();
            data.append('title', formData.title);
            data.append('author', formData.author);
            data.append('stock', formData.stock);
            data.append('pages', formData.pages);
            data.append('dl', formData.dl);
            data.append('summary', formData.summary);

            if (formData.image) {
                data.append('image', formData.image);
            }

            if (selectedPublication) {
                await axios.patch(`${configData.API_SERVER}publications/${selectedPublication.id}/`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        // 'Authorization': `Token ${account.token}`
                    }
                });
            } else {
                await axios.post(`${configData.API_SERVER}publications/`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        // 'Authorization': `Token ${account.token}`
                    }
                });
            }

            fetchPublications();
            setOpenDialog(false);
        } catch (error) {
            console.error("Error saving publication", error);
            console.error("Error response:", error.response?.data);
            alert("Error al guardar la publicación: " + (error.response?.data?.detail || error.message));
        }
    };

    const filteredPublications = publications.filter(pub =>
        pub.title.toLowerCase().includes(search.toLowerCase()) ||
        pub.author.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainCard title="Publicaciones" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid>
                        <OutlinedInput
                            id="input-search-publications"
                            placeholder="Buscar"
                            startAdornment={
                                <InputAdornment position="start">
                                    <IconSearch stroke={1.5} size="1rem" />
                                </InputAdornment>
                            }
                            size="small"
                            value={search}
                            onChange={handleSearch}
                        />
                    </Grid>
                    <Grid>
                        <Button variant="contained" color="secondary" startIcon={<IconPlus />} onClick={handleAdd}>
                            Añadir Publicación
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
            <Divider />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Imagen</TableCell>
                            <TableCell>Título</TableCell>
                            <TableCell>Autor</TableCell>
                            <TableCell>Stock</TableCell>
                            <TableCell>Páginas</TableCell>
                            <TableCell>DL</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPublications
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((publication) => (
                                <TableRow key={publication.id} hover>
                                    <TableCell>{publication.id}</TableCell>
                                    <TableCell>
                                        {publication.image_url ? (
                                            <img src={publication.image_url} alt={publication.title} style={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 4 }} />
                                        ) : (
                                            <IconPhoto size="2rem" />
                                        )}
                                    </TableCell>
                                    <TableCell>{publication.title}</TableCell>
                                    <TableCell>{publication.author}</TableCell>
                                    <TableCell>{publication.stock}</TableCell>
                                    <TableCell>{publication.pages}</TableCell>
                                    <TableCell>{publication.dl || '-'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(publication)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(publication.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredPublications.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No se encontraron registros
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPublications.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
                <DialogTitle>{selectedPublication ? 'Editar Publicación' : 'Añadir Publicación'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid
                            size={{
                                xs: 12,
                                md: 6
                            }}>
                            <TextField
                                fullWidth
                                label="Título"
                                name="title"
                                value={formData.title}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                md: 6
                            }}>
                            <TextField
                                fullWidth
                                label="Autor"
                                name="author"
                                value={formData.author}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                md: 4
                            }}>
                            <TextField
                                fullWidth
                                label="Existencias"
                                name="stock"
                                type="number"
                                value={formData.stock}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                md: 4
                            }}>
                            <TextField
                                fullWidth
                                label="Páginas"
                                name="pages"
                                type="number"
                                value={formData.pages}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                md: 4
                            }}>
                            <TextField
                                fullWidth
                                label="Depósito Legal"
                                name="dl"
                                value={formData.dl}
                                onChange={handleFormChange}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Resumen"
                                name="summary"
                                value={formData.summary}
                                onChange={handleFormChange}
                                multiline
                                rows={4}
                                required
                            />
                        </Grid>
                        <Grid size={12}>
                            <Button variant="outlined" component="label" fullWidth>
                                Subir Imagen
                                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                            </Button>
                        </Grid>
                        {imagePreview && (
                            <Grid size={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} variant="contained" color="secondary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle>Eliminar Publicación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar esta publicación? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="secondary">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
};

export default Publications;
