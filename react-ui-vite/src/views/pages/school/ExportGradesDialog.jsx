import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider
} from '@mui/material';
import { IconTable, IconFileText } from '@tabler/icons-react';

const ExportGradesDialog = ({ open, onClose, onExport }) => {
    const handleOptionClick = (type) => {
        onExport(type);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Exportar Calificaciones</DialogTitle>
            <Divider />
            <DialogContent>
                <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
                    Seleccione el formato de descarga. Solo se incluirán las columnas visibles actualmente.
                </Typography>
                <List component="nav">
                    <ListItem button onClick={() => handleOptionClick('excel')}>
                        <ListItemIcon>
                            <IconTable color="#1d6f42" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Excel (.xlsx)"
                            secondary="Hoja de cálculo editable"
                        />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem button onClick={() => handleOptionClick('pdf')}>
                        <ListItemIcon>
                            <IconFileText color="#d32f2f" />
                        </ListItemIcon>
                        <ListItemText
                            primary="PDF"
                            secondary="Documento listo para imprimir (Blanco y Negro)"
                        />
                    </ListItem>
                </List>
            </DialogContent>
        </Dialog>
    );
};

export default ExportGradesDialog;
