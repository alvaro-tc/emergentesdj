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
import UserDialog from './UserDialog';

const Teachers = () => {
    const account = useSelector((state) => state.account);
    const [teachers, setTeachers] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState(null);

    const fetchTeachers = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'manage-users', { params: { role: 'TEACHER' } })
                .then(response => {
                    console.log('Teachers fetched:', response.data);
                    setTeachers(response.data);
                })
                .catch(error => console.error("Error fetching teachers", error));
        } else {
            console.warn('No account token available');
        }
    };

    useEffect(() => {
        console.log('Teachers component mounted, account:', account);
        fetchTeachers();
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
        setSelectedTeacher(null);
        setOpenDialog(true);
    };

    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setTeacherToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!teacherToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}manage-users/${teacherToDelete}`);
            fetchTeachers();
            setOpenDeleteDialog(false);
            setTeacherToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        (teacher.first_name && teacher.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (teacher.paternal_surname && teacher.paternal_surname.toLowerCase().includes(search.toLowerCase())) ||
        (teacher.ci_number && teacher.ci_number.toLowerCase().includes(search.toLowerCase())) ||
        teacher.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainCard title="Docentes" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid>
                        <OutlinedInput
                            id="input-search-teachers"
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
                            Añadir Docente
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
                            <TableCell>Nombre Completo</TableCell>
                            <TableCell>CI</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTeachers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((teacher) => (
                                <TableRow key={teacher.id} hover>
                                    <TableCell>{teacher.id}</TableCell>
                                    <TableCell>{`${teacher.first_name || ''} ${teacher.paternal_surname || ''} ${teacher.maternal_surname || ''}`}</TableCell>
                                    <TableCell>{teacher.ci_number || '-'}</TableCell>
                                    <TableCell>{teacher.email}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(teacher)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(teacher.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredTeachers.length === 0 && (
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
                count={filteredTeachers.length}
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
                <DialogTitle>Eliminar Docente</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar este docente? Esta acción no se puede deshacer.
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
            <UserDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                user={selectedTeacher}
                role="TEACHER"
                onSave={fetchTeachers}
            />
        </MainCard>
    );
};

export default Teachers;
