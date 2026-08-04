import React, { useState, useEffect, useMemo } from 'react';
import {
    Alert,
    Button,
    CardContent,
    Divider,
    Grid,
    InputAdornment,
    OutlinedInput,
    Snackbar,
    TablePagination
} from '@mui/material';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import ConfirmDialog from '../../../ui-component/ConfirmDialog';
import axios from 'axios';
import configData from '../../../config';
import { useSelector } from 'react-redux';
import PeriodDialog from './PeriodDialog';
import PeriodsTable from './PeriodsTable';
import usePeriodContext from '../../../hooks/usePeriodContext';
import { useSnackbar } from '../../../hooks/useSnackbar';

const Periods = () => {
    const account = useSelector((state) => state.account);
    const { activePeriod, refreshActivePeriod } = usePeriodContext();
    const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
    const [periods, setPeriods] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [periodToDelete, setPeriodToDelete] = useState(null);
    const [periodToActivate, setPeriodToActivate] = useState(null);

    const fetchPeriods = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios
                .get(configData.API_SERVER + 'periods')
                .then((response) => setPeriods(response.data))
                .catch((error) => console.error('Error fetching periods', error));
        }
    };

    useEffect(() => {
        fetchPeriods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account.token]);

    const handleConfirmDelete = async () => {
        if (!periodToDelete) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.delete(`${configData.API_SERVER}periods/${periodToDelete}`);
            fetchPeriods();
            refreshActivePeriod();
        } catch {
            showSnackbar('No se pudo eliminar el periodo', 'error');
        } finally {
            setPeriodToDelete(null);
        }
    };

    const handleConfirmActivate = async () => {
        if (!periodToActivate) return;
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            await axios.post(`${configData.API_SERVER}periods/${periodToActivate.id}/activate/`);
            fetchPeriods();
            refreshActivePeriod();
            showSnackbar(`Periodo "${periodToActivate.name}" activado`);
        } catch (error) {
            showSnackbar(error.response?.data?.error || 'No se pudo activar el periodo', 'error');
        } finally {
            setPeriodToActivate(null);
        }
    };

    const filteredPeriods = useMemo(
        () => periods.filter((period) => period.name.toLowerCase().includes(search.toLowerCase())),
        [periods, search]
    );

    return (
        <MainCard title="Periodos" content={false}>
            <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Solo un periodo puede estar activo. El landing page muestra únicamente información del periodo activo
                    {activePeriod ? `: ${activePeriod.name}` : ' (actualmente no hay ninguno)'}.
                </Alert>
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
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </Grid>
                    <Grid>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<IconPlus />}
                            onClick={() => {
                                setSelectedPeriod(null);
                                setOpenDialog(true);
                            }}
                        >
                            Añadir Periodo
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
            <Divider />
            <PeriodsTable
                periods={filteredPeriods.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
                onEdit={(period) => {
                    setSelectedPeriod(period);
                    setOpenDialog(true);
                }}
                onDelete={setPeriodToDelete}
                onActivate={setPeriodToActivate}
            />
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPeriods.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                }}
            />
            <ConfirmDialog
                open={Boolean(periodToDelete)}
                title="Eliminar Periodo"
                message="¿Está seguro que desea eliminar este periodo? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onCancel={() => setPeriodToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
            <ConfirmDialog
                open={Boolean(periodToActivate)}
                title="Activar Periodo"
                message={`Se activará "${periodToActivate?.name || ''}" y se desactivará cualquier otro periodo. El landing page pasará a mostrar solo la información de este periodo.`}
                confirmLabel="Activar"
                confirmColor="success"
                onCancel={() => setPeriodToActivate(null)}
                onConfirm={handleConfirmActivate}
            />
            <PeriodDialog
                open={openDialog}
                handleClose={() => setOpenDialog(false)}
                period={selectedPeriod}
                onSave={() => {
                    fetchPeriods();
                    refreshActivePeriod();
                }}
            />
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}>
                <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
};

export default Periods;
