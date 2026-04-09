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
    DialogActions
} from '@mui/material';
import { IconSearch, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import ProgramDialog from './ProgramDialog';

const Programs = () => {
    const account = useSelector((state) => state.account);
    const [programs, setPrograms] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [programToDelete, setProgramToDelete] = useState(null);

    const fetchPrograms = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'programs')
                .then(response => {
                    setPrograms(response.data);
                })
                .catch(error => console.error("Error fetching programs", error));
        }
    };

    useEffect(() => {
        fetchPrograms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account.token]);

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
        setSelectedProgram(null);
        setOpenDialog(true);
    };

    const handleEdit = (program) => {
        setSelectedProgram(program);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setProgramToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!programToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}programs/${programToDelete}`);
            fetchPrograms();
            setOpenDeleteDialog(false);
            setProgramToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredPrograms = programs.filter(program =>
        program.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainCard title="Carreras" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid>
                        <OutlinedInput
                            id="input-search-list-style1"
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
                            Añadir Carrera
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
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPrograms
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((program) => (
                                <TableRow key={program.id} hover>
                                    <TableCell>{program.id}</TableCell>
                                    <TableCell>{program.name}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(program)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(program.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredPrograms.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
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
                count={filteredPrograms.length}
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
                <DialogTitle>Eliminar Carrera</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar esta carrera? Esta acción no se puede deshacer.
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
            <ProgramDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                program={selectedProgram}
                onSave={fetchPrograms}
            />
        </MainCard>
    );
};

export default Programs;
