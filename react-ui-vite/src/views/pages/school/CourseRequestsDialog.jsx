
import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Chip,
    CircularProgress,
    Divider,
    Checkbox,
    ListItemIcon,
    Grid
} from '@mui/material';
import { IconCheck, IconX, IconRefresh, IconUsers } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';

const CourseRequestsDialog = ({ open, handleClose, course, onUpdate }) => {
    const account = useSelector((state) => state.account);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open && course) {
            fetchRequests();
            setSelected([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, course]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            const response = await axios.get(`${configData.API_SERVER}registration-requests`, {
                params: {
                    course_id: course.id,
                    status: 'PENDING'
                }
            });
            setRequests(response.data);
        } catch (error) {
            console.error("Error fetching requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelecteds = requests.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected(newSelected);
    };

    const handleApprove = async (reqIds) => {
        setProcessing(true);
        try {
            const ids = Array.isArray(reqIds) ? reqIds : [reqIds];
            // Process sequentially or parallel. Parallel is faster but might hit rate limits? backend is local.
            await Promise.all(ids.map(id =>
                axios.post(`${configData.API_SERVER}registration-requests/${id}/approve/`)
            ));

            fetchRequests();
            setSelected([]);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error approving request", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (reqIds) => {
        setProcessing(true);
        try {
            const ids = Array.isArray(reqIds) ? reqIds : [reqIds];
            await Promise.all(ids.map(id =>
                axios.post(`${configData.API_SERVER}registration-requests/${id}/reject/`)
            ));
            fetchRequests();
            setSelected([]);
        } catch (error) {
            console.error("Error rejecting request", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle>
                Solicitudes de Inscripción: {course?.subject_details?.name} - {course?.parallel}
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                        <CircularProgress />
                    </div>
                ) : (
                    <>
                        {requests.length === 0 ? (
                            <Typography variant="body1" align="center" style={{ padding: 20 }}>
                                No hay solicitudes pendientes.
                            </Typography>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 10, justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                            indeterminate={selected.length > 0 && selected.length < requests.length}
                                            checked={requests.length > 0 && selected.length === requests.length}
                                            onChange={handleSelectAll}
                                            color="primary"
                                        />
                                        <Typography variant="subtitle2">
                                            {selected.length} seleccionados
                                        </Typography>
                                    </div>
                                    <div>
                                        {selected.length > 0 && (
                                            <>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleReject(selected)}
                                                    disabled={processing}
                                                    style={{ marginRight: 8, color: 'red', borderColor: 'red' }}
                                                >
                                                    Rechazar ({selected.length})
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    onClick={() => handleApprove(selected)}
                                                    disabled={processing}
                                                    startIcon={<IconUsers />}
                                                >
                                                    Aceptar Inscripciones ({selected.length})
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Divider />
                                <List>
                                    {requests.map((req) => {
                                        const isItemSelected = selected.indexOf(req.id) !== -1;
                                        return (
                                            <div key={req.id}>
                                                <ListItem
                                                    button
                                                    onClick={(event) => handleClick(event, req.id)}
                                                    selected={isItemSelected}
                                                >
                                                    <ListItemIcon>
                                                        <Checkbox
                                                            edge="start"
                                                            checked={isItemSelected}
                                                            tabIndex={-1}
                                                            disableRipple
                                                            color="primary"
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={`${req.first_name} ${req.paternal_surname} ${req.maternal_surname || ''}`}
                                                        secondary={
                                                            <>
                                                                <Typography component="span" variant="body2" display="block">
                                                                    CI: {req.ci} | Email: {req.email}
                                                                </Typography>
                                                                <Typography component="span" variant="caption" color="textSecondary">
                                                                    Cel: {req.cellphone || 'N/A'} | Fecha: {new Date(req.created_at).toLocaleString()}
                                                                </Typography>
                                                            </>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton edge="end" aria-label="reject" onClick={() => handleReject(req.id)} style={{ color: 'red', marginRight: 8 }}>
                                                            <IconX />
                                                        </IconButton>
                                                        <IconButton edge="end" aria-label="approve" onClick={() => handleApprove(req.id)} style={{ color: 'green' }}>
                                                            <IconCheck />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                                <Divider />
                                            </div>
                                        );
                                    })}
                                </List>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={fetchRequests} startIcon={<IconRefresh />} disabled={processing}>
                    Actualizar
                </Button>
                <Button onClick={handleClose} color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CourseRequestsDialog;
