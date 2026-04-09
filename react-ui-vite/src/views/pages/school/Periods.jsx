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
import PeriodDialog from './PeriodDialog';

const Periods = () => {
    const account = useSelector((state) => state.account);
    const [periods, setPeriods] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [periodToDelete, setPeriodToDelete] = useState(null);

    const fetchPeriods = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'periods')
                .then(response => {
                    setPeriods(response.data);
                })
                .catch(error => console.error("Error fetching periods", error));
        }
    };

    useEffect(() => {
        fetchPeriods();
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
        setSelectedPeriod(null);
        setOpenDialog(true);
    };

    const handleEdit = (period) => {
        setSelectedPeriod(period);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setPeriodToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!periodToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}periods/${periodToDelete}`);
            fetchPeriods();
            setOpenDeleteDialog(false);
            setPeriodToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredPeriods = periods.filter(period =>
        period.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainCard title="Periodos" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid>
                        <OutlinedInput
                            id="input-search-periods"
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
                            Añadir Periodo
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
                            <TableCell>Fecha Inicio</TableCell>
                            <TableCell>Fecha Fin</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPeriods
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((period) => (
                                <TableRow key={period.id} hover>
                                    <TableCell>{period.id}</TableCell>
                                    <TableCell>{period.name}</TableCell>
                                    <TableCell>{new Date(period.start_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                                    <TableCell>{new Date(period.end_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(period)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(period.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredPeriods.length === 0 && (
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
                count={filteredPeriods.length}
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
                <DialogTitle>Eliminar Periodo</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar este periodo? Esta acción no se puede deshacer.
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
            <PeriodDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                period={selectedPeriod}
                onSave={fetchPeriods}
            />
        </MainCard>
    );
};

export default Periods;
