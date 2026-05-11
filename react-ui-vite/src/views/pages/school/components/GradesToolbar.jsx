import React from 'react';
import { Grid, TextField, Button, Tooltip, InputAdornment } from '@mui/material';
import { IconSearch, IconSettings, IconDownload, IconUpload } from '@tabler/icons-react';

const GradesToolbar = ({ search, onSearchChange, onExport, onImport, onSettings, isMobile }) => (
    <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar estudiante..."
                value={search}
                onChange={onSearchChange}
                size="small"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconSearch stroke={1.5} size="1rem" />
                        </InputAdornment>
                    )
                }}
            />
        </Grid>
        {!isMobile && (
            <Grid sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Importar Calificaciones">
                    <Button variant="outlined" onClick={onImport} startIcon={<IconUpload />} size="small">Importar</Button>
                </Tooltip>
                <Tooltip title="Exportar Calificaciones">
                    <Button variant="outlined" onClick={onExport} startIcon={<IconDownload />} size="small">Exportar</Button>
                </Tooltip>
                <Tooltip title="Ajustes de Calificaciones">
                    <Button variant="outlined" onClick={onSettings} startIcon={<IconSettings />} size="small">Ajustes</Button>
                </Tooltip>
            </Grid>
        )}
    </Grid>
);

export default React.memo(GradesToolbar);
