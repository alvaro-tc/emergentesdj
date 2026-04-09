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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import CriteriaDialog from './CriteriaDialog';

const CriteriaList = () => {
    const account = useSelector((state) => state.account);
    const [templates, setTemplates] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);

    const fetchTemplates = React.useCallback(() => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'evaluation-templates')
                .then(response => {
                    setTemplates(response.data);
                })
                .catch(error => console.error("Error fetching templates", error));
        }
    }, [account.token]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

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
        setSelectedTemplate(null);
        setOpenDialog(true);
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setTemplateToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!templateToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}evaluation-templates/${templateToDelete}`);
            fetchTemplates();
            setOpenDeleteDialog(false);
            setTemplateToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainCard title="Etapas de Evaluación" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid>
                        <OutlinedInput
                            id="input-search-templates"
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
                            Añadir Etapa
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
                            <TableCell>Nombre</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTemplates
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((template) => (
                                <TableRow key={template.id} hover>
                                    <TableCell>{template.id}</TableCell>
                                    <TableCell>{template.name}</TableCell>
                                    <TableCell>{template.description}</TableCell>
                                    <TableCell>
                                        {template.criteria && template.criteria.map(c => (
                                            <Chip key={c.id} label={`${c.name}: ${c.weight}%`} size="small" style={{ marginRight: 5 }} />
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(template)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(template.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredTemplates.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
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
                count={filteredTemplates.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Eliminar Etapa</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar esta etapa? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="secondary" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            <CriteriaDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                template={selectedTemplate}
                onSave={fetchTemplates}
            />
        </MainCard>
    );
};

export default CriteriaList;
