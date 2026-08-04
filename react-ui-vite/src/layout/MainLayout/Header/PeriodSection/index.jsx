import React from 'react';
import { Box, Chip, FormControl, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { IconArrowBackUp, IconCalendarStats } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import usePeriodContext from '../../../../hooks/usePeriodContext';

/**
 * Selector de periodo del panel de administración.
 * Permite revisar temporalmente otro periodo y volver al periodo activo.
 */
const PeriodSection = () => {
    const isLoggedIn = useSelector((state) => state.account.isLoggedIn);
    const role = useSelector((state) => state.account.user?.role);
    const { activePeriod, contextPeriod, isTemporary, periods, changeViewingPeriod, backToActivePeriod } =
        usePeriodContext({ loadPeriods: true });

    if (!isLoggedIn || role !== 'ADMIN') return null;

    const handleChange = (event) => {
        const period = periods.find((p) => p.id === event.target.value);
        changeViewingPeriod(period || null);
    };

    return (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, ml: 2 }}>
            <IconCalendarStats size="1.2rem" stroke={1.5} />
            <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                    value={contextPeriod?.id ?? ''}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Periodo académico' }}
                    sx={{ borderRadius: '12px' }}
                >
                    <MenuItem value="" disabled>
                        Sin periodo activo
                    </MenuItem>
                    {periods.map((period) => (
                        <MenuItem key={period.id} value={period.id}>
                            <Typography variant="body2" component="span">
                                {period.name}
                            </Typography>
                            {period.active && (
                                <Typography variant="caption" component="span" sx={{ ml: 1, color: 'success.dark' }}>
                                    (activo)
                                </Typography>
                            )}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {isTemporary && (
                <Tooltip title={`Vista temporal. Volver al periodo activo: ${activePeriod?.name || '—'}`}>
                    <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        icon={<IconArrowBackUp size="1rem" />}
                        label="Vista temporal"
                        onClick={backToActivePeriod}
                        sx={{ cursor: 'pointer' }}
                    />
                </Tooltip>
            )}
        </Box>
    );
};

export default PeriodSection;
