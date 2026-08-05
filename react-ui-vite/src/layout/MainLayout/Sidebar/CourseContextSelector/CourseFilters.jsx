import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    MenuItem,
    Stack,
    TextField
} from '@mui/material';
import { IconSearch } from '@tabler/icons-react';

/** Filtros para encontrar un curso: búsqueda, periodo, carrera y archivados. */
const CourseFilters = ({
    search,
    setSearch,
    periods,
    filterPeriod,
    onChangePeriod,
    programs,
    filterProgram,
    setFilterProgram,
    showArchived,
    setShowArchived
}) => (
    <Box sx={{ p: 1.5, pb: 0.5 }}>
        <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder="Buscar materia o paralelo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconSearch size="1rem" stroke={1.5} />
                        </InputAdornment>
                    )
                }
            }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <TextField
                select
                fullWidth
                size="small"
                label="Periodo"
                value={filterPeriod}
                onChange={(event) => {
                    const id = event.target.value;
                    onChangePeriod(id, periods.find((p) => p.id === id));
                }}
            >
                <MenuItem value="">Todos</MenuItem>
                {periods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                        {period.name}
                        {period.active ? ' (activo)' : ''}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                select
                fullWidth
                size="small"
                label="Carrera"
                value={filterProgram}
                onChange={(event) => setFilterProgram(event.target.value)}
            >
                <MenuItem value="">Todas</MenuItem>
                {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                        {program.name}
                    </MenuItem>
                ))}
            </TextField>
        </Stack>
        <FormControlLabel
            sx={{ mt: 0.5 }}
            control={
                <Checkbox
                    size="small"
                    checked={showArchived}
                    onChange={(event) => setShowArchived(event.target.checked)}
                />
            }
            label="Incluir materias archivadas"
            slotProps={{ typography: { variant: 'caption' } }}
        />
    </Box>
);

CourseFilters.propTypes = {
    search: PropTypes.string.isRequired,
    setSearch: PropTypes.func.isRequired,
    periods: PropTypes.array.isRequired,
    filterPeriod: PropTypes.any,
    onChangePeriod: PropTypes.func.isRequired,
    programs: PropTypes.array.isRequired,
    filterProgram: PropTypes.any,
    setFilterProgram: PropTypes.func.isRequired,
    showArchived: PropTypes.bool.isRequired,
    setShowArchived: PropTypes.func.isRequired
};

export default CourseFilters;
