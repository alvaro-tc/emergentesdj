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
import { IconSearch, IconPlus, IconEdit, IconTrash, IconLock, IconLockOpen } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import SubjectDialog from './SubjectDialog';

const Subjects = () => {
    const account = useSelector((state) => state.account);
    const [subjects, setSubjects] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [subjectToLock, setSubjectToLock] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    const fetchSubjects = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'subjects')
                .then(response => {
                    setSubjects(response.data);
                })
                .catch(error => console.error("Error fetching subjects", error));
        }
    };

    useEffect(() => {
        fetchSubjects();
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
        setSelectedSubject(null);
        setOpenDialog(true);
    };

    const handleEdit = (subject) => {
        setSelectedSubject(subject);
        setOpenDialog(true);
    };

    const handleToggleLock = (subject) => {
        setSubjectToLock(subject);
        setOpenConfirmDialog(true);
    };

    const handleConfirmLock = async () => {
        if (!subjectToLock) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.patch(`${configData.API_SERVER}subjects/${subjectToLock.id}/`, {
                subcriteria_locked: !subjectToLock.subcriteria_locked
            });
            fetchSubjects();
            setOpenConfirmDialog(false);
            setSubjectToLock(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = (id) => {
        setSubjectToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!subjectToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}subjects/${subjectToDelete}/`);
            fetchSubjects();
            setOpenDeleteDialog(false);
            setSubjectToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(search.toLowerCase()) ||
        subject.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainCard title="Materias" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid>
                        <OutlinedInput
                            id="input-search-subjects"
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
                            Añadir Materia
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
                            <TableCell>Código</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Carrera</TableCell>
                            <TableCell>Periodo</TableCell>
                            <TableCell>Criterios</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSubjects
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((subject) => (
                                <TableRow key={subject.id} hover>
                                    <TableCell>{subject.id}</TableCell>
                                    <TableCell>{subject.code}</TableCell>
                                    <TableCell>{subject.name}</TableCell>
                                    <TableCell>{subject.program_details ? subject.program_details.name : '-'}</TableCell>
                                    <TableCell>{subject.period_details ? subject.period_details.name : '-'}</TableCell>
                                    <TableCell>{subject.evaluation_template_details ? subject.evaluation_template_details.name : '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={subject.archived ? "Archivado" : "Activo"}
                                            color={subject.archived ? "default" : "secondary"}
                                            size="small"
                                        />
                                    </TableCell>
                                    {/* Note: Serializer might need update to show period name */}
                                    <TableCell>

                                        <IconButton onClick={() => handleEdit(subject)} size="small">
                                            <IconEdit size="1.3rem" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(subject.id)} size="small" color="error">
                                            <IconTrash size="1.3rem" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filteredSubjects.length === 0 && (
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
                count={filteredSubjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    {subjectToLock && subjectToLock.subcriteria_locked
                        ? "Desbloquear Subcriterios"
                        : "Bloquear Subcriterios"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {subjectToLock && subjectToLock.subcriteria_locked
                            ? "¿Está seguro que desea desbloquear los subcriterios de evaluación para esta materia?"
                            : "¿Está seguro que desea bloquear los subcriterios de evaluación? Una vez bloqueados, los profesores no podrán añadir ni editar subcriterios."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmLock} variant="contained" color="secondary" autoFocus>
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Eliminar Materia</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar esta materia? Esta acción no se puede deshacer.
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
            <SubjectDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                subject={selectedSubject}
                onSave={fetchSubjects}
            />
        </MainCard>
    );
};

export default Subjects;
