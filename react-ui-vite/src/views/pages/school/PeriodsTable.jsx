import React from 'react';
import PropTypes from 'prop-types';
import {
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';
import { IconCircleCheck, IconEdit, IconTrash } from '@tabler/icons-react';

const formatDate = (value) =>
    new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const PeriodsTable = ({ periods, onEdit, onDelete, onActivate }) => (
    <TableContainer>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell>Fecha Fin</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {periods.map((period) => (
                    <TableRow key={period.id} hover selected={period.active}>
                        <TableCell>{period.id}</TableCell>
                        <TableCell>{period.name}</TableCell>
                        <TableCell>{formatDate(period.start_date)}</TableCell>
                        <TableCell>{formatDate(period.end_date)}</TableCell>
                        <TableCell>
                            {period.active ? (
                                <Chip size="small" color="success" label="Activo" />
                            ) : (
                                <Chip size="small" variant="outlined" label="Inactivo" />
                            )}
                        </TableCell>
                        <TableCell>
                            <Tooltip title={period.active ? 'Este es el periodo activo' : 'Activar periodo'}>
                                <span>
                                    <IconButton
                                        onClick={() => onActivate(period)}
                                        size="small"
                                        color="success"
                                        disabled={period.active}
                                    >
                                        <IconCircleCheck size="1.3rem" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <IconButton onClick={() => onEdit(period)} size="small">
                                <IconEdit size="1.3rem" />
                            </IconButton>
                            <IconButton onClick={() => onDelete(period.id)} size="small" color="error">
                                <IconTrash size="1.3rem" />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
                {periods.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} align="center">
                            No se encontraron registros
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>
);

PeriodsTable.propTypes = {
    periods: PropTypes.array.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onActivate: PropTypes.func.isRequired
};

export default PeriodsTable;
