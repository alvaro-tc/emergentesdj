import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
    MenuItem,
    OutlinedInput,
    Paper,
    Select,
    Snackbar,
    Stack,
    TablePagination,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    IconArrowBackUp,
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconClock,
    IconClockHour4,
    IconEdit,
    IconHistory,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconShieldCheck,
    IconTrash,
    IconUser,
    IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import MainCard from '../../../ui-component/cards/MainCard';
import config from '../../../config';

const API = config.API_SERVER;

// ── Action type metadata ──────────────────────────────────────────────────────

const ACTION_META = {
    create: { label: 'Creación', color: 'success', Icon: IconPlus },
    update: { label: 'Modificación', color: 'info', Icon: IconEdit },
    delete: { label: 'Eliminación', color: 'error', Icon: IconTrash },
    bulk:   { label: 'Llenado masivo', color: 'warning', Icon: IconHistory },
};

function classifyAction(entry) {
    if (entry.is_bulk) return 'bulk';
    const m = (entry.method || '').toUpperCase();
    if (m === 'POST') return 'create';
    if (m === 'PUT' || m === 'PATCH') return 'update';
    if (m === 'DELETE') return 'delete';
    return 'update';
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function relativeTime(iso) {
    try {
        return formatDistanceToNow(parseISO(iso), { locale: es, addSuffix: true });
    } catch {
        return iso;
    }
}

function fullTime(iso) {
    try {
        return format(parseISO(iso), "dd 'de' MMM yyyy, HH:mm:ss", { locale: es });
    } catch {
        return iso;
    }
}

// Build an ISO string for "N minutes ago"
function isoSinceMinutes(mins) {
    return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

// Local datetime-local input → ISO with timezone
function localToISO(local) {
    if (!local) return null;
    return new Date(local).toISOString();
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }) {
    const items = [
        { label: 'Total', value: stats.total, color: 'primary' },
        { label: 'Aplicados', value: stats.committed, color: 'success' },
        { label: 'Revertidos', value: stats.reverted, color: 'warning' },
    ];
    return (
        <Stack direction="row" gap={1.5} flexWrap="wrap" mb={2}>
            {items.map(({ label, value, color }) => (
                <Paper key={label} variant="outlined" sx={{ px: 2.5, py: 1.2, minWidth: 110 }}>
                    <Typography variant="h4" color={`${color}.main`} fontWeight={700}>
                        {value ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Paper>
            ))}
        </Stack>
    );
}

// ── Single audit entry (card) ─────────────────────────────────────────────────

function AuditEntry({ entry, selected, onToggleSelect, onRevert }) {
    const [expanded, setExpanded] = useState(false);
    const cls = classifyAction(entry);
    const meta = ACTION_META[cls];
    const Icon = meta.Icon;
    const reverted = entry.status === 'reverted';
    const canRevert = !reverted;

    return (
        <Paper
            variant="outlined"
            sx={{
                mb: 1,
                borderLeft: '4px solid',
                borderLeftColor: reverted ? 'grey.400' : `${meta.color}.main`,
                opacity: reverted ? 0.65 : 1,
                transition: 'all 0.15s',
                '&:hover': { boxShadow: 2 },
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5 }}>
                <Checkbox
                    checked={selected}
                    onChange={() => onToggleSelect(entry.action_id)}
                    disabled={reverted}
                    size="small"
                />

                <Avatar sx={{ bgcolor: `${meta.color}.main`, width: 38, height: 38 }}>
                    <Icon size={20} />
                </Avatar>

                <Box flex={1} minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                            {entry.description}
                        </Typography>
                        {entry.subject && (
                            <Chip label={entry.subject} size="small" variant="outlined" sx={{ height: 22 }} />
                        )}
                        {reverted && (
                            <Chip
                                icon={<IconArrowBackUp size={12} />}
                                label="Revertido"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ height: 22 }}
                            />
                        )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.5} mt={0.5}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconUser size={12} style={{ opacity: 0.6 }} />
                            <Typography variant="caption" color="text.secondary">
                                {entry.user_name || `Usuario ${entry.user || '?'}`}
                            </Typography>
                        </Stack>

                        <Tooltip title={fullTime(entry.timestamp)} arrow>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'help' }}>
                                <IconClock size={12} style={{ opacity: 0.6 }} />
                                <Typography variant="caption" color="text.secondary">
                                    {relativeTime(entry.timestamp)}
                                </Typography>
                            </Stack>
                        </Tooltip>

                        <Chip
                            label={entry.resource_label}
                            size="small"
                            variant="filled"
                            color={meta.color}
                            sx={{ height: 20, fontSize: '0.68rem' }}
                        />

                        {entry.is_bulk && entry.affected_count > 0 && (
                            <Chip
                                label={`${entry.affected_count} elementos`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem' }}
                            />
                        )}
                    </Stack>
                </Box>

                <Stack direction="row" spacing={0.5}>
                    <Tooltip title={canRevert ? 'Deshacer esta acción' : 'Ya revertida'}>
                        <span>
                            <IconButton
                                size="small"
                                color="warning"
                                disabled={!canRevert}
                                onClick={() => onRevert(entry)}
                            >
                                <IconArrowBackUp size={18} />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={expanded ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}>
                        <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
                            {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            <Collapse in={expanded} unmountOnExit>
                <Divider />
                <Box sx={{ p: 2, bgcolor: 'grey.50', fontSize: '0.78rem' }}>
                    <Stack direction="row" gap={3} flexWrap="wrap" mb={1}>
                        <DetailField label="Método HTTP" value={entry.method} />
                        <DetailField label="URL" value={entry.url} mono />
                        <DetailField label="Estado HTTP" value={entry.http_status} />
                        <DetailField label="ID de acción" value={entry.action_id} mono />
                    </Stack>
                    {reverted && entry.reverted_by_name && (
                        <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                            Revertido por <b>{entry.reverted_by_name}</b> — {fullTime(entry.reverted_at)}
                        </Alert>
                    )}
                    <DataBlock label="Estado previo (lo que se restaurará al deshacer)" data={entry.snapshot_before} />
                    <DataBlock label="Datos enviados" data={entry.request_body} />
                    <DataBlock label="Respuesta del servidor" data={entry.response_data} />
                </Box>
            </Collapse>
        </Paper>
    );
}

function DetailField({ label, value, mono }) {
    if (value == null || value === '') return null;
    return (
        <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: mono ? 'monospace' : undefined, fontSize: '0.75rem' }}>
                {String(value)}
            </Typography>
        </Box>
    );
}

function DataBlock({ label, data }) {
    if (data == null) return null;
    return (
        <Box mb={1}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                {label}
            </Typography>
            <Box
                component="pre"
                sx={{
                    m: 0, fontSize: '0.7rem', p: 1, bgcolor: 'background.paper',
                    borderRadius: 1, border: '1px solid', borderColor: 'divider',
                    overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    maxHeight: 250, overflowY: 'auto',
                }}
            >
                {JSON.stringify(data, null, 2)}
            </Box>
        </Box>
    );
}

// ── Revert single dialog ──────────────────────────────────────────────────────

function RevertDialog({ entry, open, loading, onClose, onConfirm }) {
    if (!entry) return null;
    const cls = classifyAction(entry);
    const meta = ACTION_META[cls];
    const explainText = {
        create: 'Se eliminará el registro que se había creado.',
        update: 'Se restaurarán los valores anteriores del registro.',
        delete: 'Se recreará el registro que había sido eliminado.',
        bulk:   `Se restaurarán las ${entry.affected_count || ''} notas a sus valores anteriores.`,
    }[cls];

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconArrowBackUp size={22} />
                Confirmar reversión
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    Estás por deshacer:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderLeft: '4px solid', borderLeftColor: `${meta.color}.main` }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {entry.description}
                    </Typography>
                    {entry.subject && (
                        <Typography variant="body2" color="text.secondary">
                            {entry.subject}
                        </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Realizada por <b>{entry.user_name}</b> — {fullTime(entry.timestamp)}
                    </Typography>
                </Paper>
                <Alert severity="warning" icon={<IconHistory size={18} />}>
                    <b>¿Qué va a cambiar?</b><br />
                    {explainText}
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button
                    onClick={onConfirm}
                    color="warning"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <IconArrowBackUp size={16} />}
                >
                    {loading ? 'Revirtiendo…' : 'Sí, deshacer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Bulk revert dialog (selection or time-based) ─────────────────────────────

function BulkRevertDialog({ open, mode, count, since, loading, onClose, onConfirm, results }) {
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconArrowBackUp size={22} />
                {mode === 'selection' ? 'Deshacer acciones seleccionadas' : 'Deshacer cambios desde una hora'}
            </DialogTitle>
            <DialogContent>
                {!results ? (
                    <>
                        <Typography variant="body1" gutterBottom>
                            {mode === 'selection'
                                ? <>Vas a deshacer <b>{count}</b> {count === 1 ? 'acción' : 'acciones'} seleccionadas.</>
                                : <>Vas a deshacer todas las acciones aplicadas <b>desde {since ? fullTime(since) : ''}</b>. <br /><br />Total: <b>{count}</b> {count === 1 ? 'acción' : 'acciones'}.</>}
                        </Typography>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Las acciones se deshacen de la más reciente a la más antigua para mantener consistencia. Si alguna no puede revertirse, las demás continuarán.
                        </Alert>
                    </>
                ) : (
                    <Box>
                        <Stack direction="row" gap={2} mb={2}>
                            <Chip color="success" icon={<IconCheck size={14} />} label={`${results.successful} exitosas`} />
                            {results.failed > 0 && (
                                <Chip color="error" icon={<IconX size={14} />} label={`${results.failed} fallidas`} />
                            )}
                        </Stack>
                        {results.results?.filter((r) => !r.success).slice(0, 5).map((r, i) => (
                            <Alert key={i} severity="error" sx={{ mb: 1, py: 0.5 }}>
                                {r.error}
                            </Alert>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {results ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!results && (
                    <Button
                        onClick={onConfirm}
                        color="warning"
                        variant="contained"
                        disabled={loading || count === 0}
                        startIcon={loading ? <CircularProgress size={16} /> : <IconArrowBackUp size={16} />}
                    >
                        {loading ? 'Revirtiendo…' : `Sí, deshacer ${count}`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

// ── Time-based revert toolbar ────────────────────────────────────────────────

function TimeRevertBar({ onPreview, previewing, previewCount, since, onChangeSince, onConfirm, disabled }) {
    const quickPicks = [
        { label: 'Últimos 5 min', mins: 5 },
        { label: 'Últimos 15 min', mins: 15 },
        { label: 'Última hora', mins: 60 },
        { label: 'Últimas 24 h', mins: 60 * 24 },
    ];

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter', borderColor: 'warning.light' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <IconClockHour4 size={20} />
                <Typography variant="subtitle2" fontWeight={700}>
                    Deshacer cambios desde una hora específica
                </Typography>
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                <TextField
                    size="small"
                    label="Desde"
                    type="datetime-local"
                    value={since}
                    onChange={(e) => onChangeSince(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 220 }}
                />
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {quickPicks.map(({ label, mins }) => (
                        <Chip
                            key={mins}
                            label={label}
                            size="small"
                            clickable
                            onClick={() => {
                                const dt = new Date(Date.now() - mins * 60 * 1000);
                                const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                                    .toISOString().slice(0, 16);
                                onChangeSince(local);
                            }}
                        />
                    ))}
                </Stack>
                <Box flex={1} />
                <Button size="small" variant="outlined" onClick={onPreview} disabled={!since || previewing}>
                    {previewing ? <CircularProgress size={14} /> : 'Vista previa'}
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    onClick={onConfirm}
                    disabled={disabled || previewCount === 0}
                    startIcon={<IconArrowBackUp size={14} />}
                >
                    Deshacer {previewCount > 0 ? `${previewCount}` : ''}
                </Button>
            </Stack>
        </Paper>
    );
}

// ── Selection toolbar ─────────────────────────────────────────────────────────

function SelectionBar({ count, onClear, onRevert, onSelectAll, totalVisible }) {
    if (count === 0) return null;
    return (
        <Paper
            sx={{
                p: 1.5, mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText',
                position: 'sticky', top: 0, zIndex: 10,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2}>
                <IconCheck size={20} />
                <Typography variant="body2" fontWeight={600} flex={1}>
                    {count} {count === 1 ? 'acción seleccionada' : 'acciones seleccionadas'}
                </Typography>
                {count < totalVisible && (
                    <Button size="small" variant="text" sx={{ color: 'inherit' }} onClick={onSelectAll}>
                        Seleccionar todas las visibles ({totalVisible})
                    </Button>
                )}
                <Button size="small" variant="text" sx={{ color: 'inherit' }} onClick={onClear}>
                    Limpiar
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    startIcon={<IconArrowBackUp size={14} />}
                    onClick={onRevert}
                >
                    Deshacer seleccionadas
                </Button>
            </Stack>
        </Paper>
    );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AuditLogPanel() {
    const [entries, setEntries] = useState([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ total: 0, committed: 0, reverted: 0 });
    const [loading, setLoading] = useState(false);
    const [resourceOptions, setResourceOptions] = useState([]);
    const [users, setUsers] = useState([]);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Filters
    const [search, setSearch] = useState('');
    const [actionType, setActionType] = useState('ALL');
    const [resourceFilter, setResourceFilter] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterUser, setFilterUser] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Multi-selection
    const [selected, setSelected] = useState(new Set());

    // Single revert
    const [revertEntry, setRevertEntry] = useState(null);
    const [reverting, setReverting] = useState(false);

    // Bulk revert dialog
    const [bulkDialog, setBulkDialog] = useState({ open: false, mode: null, since: null, count: 0 });
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);

    // Time-based revert
    const [sinceLocal, setSinceLocal] = useState('');
    const [previewCount, setPreviewCount] = useState(0);
    const [previewing, setPreviewing] = useState(false);

    const buildParams = useCallback(() => {
        const p = { page: page + 1, page_size: rowsPerPage };
        if (search) p.search = search;
        if (actionType !== 'ALL') p.action_type = actionType;
        if (resourceFilter !== 'ALL') {
            const opt = resourceOptions.find((o) => o.value === resourceFilter);
            if (opt) {
                p.resource = opt.resource;
                p.bulk = opt.bulk ? 'true' : 'false';
            }
        }
        if (filterStatus !== 'ALL') p.status = filterStatus;
        if (filterUser !== 'ALL') p.user = filterUser;
        if (dateFrom) p.date_from = dateFrom;
        if (dateTo) p.date_to = dateTo;
        return p;
    }, [page, rowsPerPage, search, actionType, resourceFilter, filterStatus, filterUser, dateFrom, dateTo, resourceOptions]);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}audit-logs/`, { params: buildParams() });
            const list = data.results ?? data;
            setEntries(list);
            setTotal(data.count ?? list.length);
        } catch (err) {
            showToast('Error al cargar el registro de auditoría.', 'error');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const fetchStats = useCallback(async () => {
        try {
            const [allRes, revertedRes] = await Promise.all([
                axios.get(`${API}audit-logs/`, { params: { page_size: 1 } }),
                axios.get(`${API}audit-logs/`, { params: { page_size: 1, status: 'reverted' } }),
            ]);
            const total = allRes.data.count ?? 0;
            const reverted = revertedRes.data.count ?? 0;
            setStats({ total, committed: total - reverted, reverted });
        } catch (_) {}
    }, []);

    const fetchMeta = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}audit-logs/resources/`);
            setResourceOptions(data.resource_options ?? []);
            setUsers(data.users ?? []);
        } catch (_) {}
    }, []);

    useEffect(() => { fetchMeta(); fetchStats(); }, [fetchMeta, fetchStats]);
    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    function showToast(message, severity = 'success') {
        setToast({ open: true, message, severity });
    }

    function refreshAll() {
        fetchEntries();
        fetchStats();
        fetchMeta();
    }

    // ── Selection handlers ────────────────────────────────────────────────────

    function toggleSelect(id) {
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function clearSelection() {
        setSelected(new Set());
    }

    function selectAllVisible() {
        const ids = entries.filter((e) => e.status === 'committed').map((e) => e.action_id);
        setSelected(new Set(ids));
    }

    // ── Single revert ─────────────────────────────────────────────────────────

    async function handleRevertSingle() {
        if (!revertEntry) return;
        setReverting(true);
        try {
            const { data } = await axios.post(`${API}audit-logs/${revertEntry.action_id}/revert/`);
            showToast(data.message || 'Acción revertida exitosamente.', 'success');
            setRevertEntry(null);
            refreshAll();
        } catch (err) {
            const msg = err?.response?.data?.error || 'Error al revertir.';
            showToast(msg, 'error');
        } finally {
            setReverting(false);
        }
    }

    // ── Bulk revert (selection) ───────────────────────────────────────────────

    function openBulkSelectionDialog() {
        if (selected.size === 0) return;
        setBulkResults(null);
        setBulkDialog({ open: true, mode: 'selection', count: selected.size });
    }

    // ── Time-based revert ─────────────────────────────────────────────────────

    async function previewSince() {
        if (!sinceLocal) return;
        setPreviewing(true);
        try {
            const { data } = await axios.get(`${API}audit-logs/preview_since/`, {
                params: { since: localToISO(sinceLocal) },
            });
            setPreviewCount(data.count ?? 0);
            if ((data.count ?? 0) === 0) {
                showToast('No hay acciones aplicadas desde esa hora.', 'info');
            }
        } catch (err) {
            showToast('Error al obtener vista previa.', 'error');
        } finally {
            setPreviewing(false);
        }
    }

    function openBulkSinceDialog() {
        if (!sinceLocal) return;
        setBulkResults(null);
        setBulkDialog({
            open: true,
            mode: 'since',
            since: localToISO(sinceLocal),
            count: previewCount,
        });
    }

    async function executeBulkRevert() {
        setBulkLoading(true);
        try {
            const payload = bulkDialog.mode === 'selection'
                ? { action_ids: Array.from(selected) }
                : { since: bulkDialog.since };
            const { data } = await axios.post(`${API}audit-logs/bulk_revert/`, payload);
            setBulkResults(data);
            const okMsg = `${data.successful} de ${data.total} acciones revertidas.`;
            showToast(okMsg, data.failed > 0 ? 'warning' : 'success');
            clearSelection();
            setPreviewCount(0);
            refreshAll();
        } catch (err) {
            const msg = err?.response?.data?.error || 'Error al revertir en masa.';
            showToast(msg, 'error');
            setBulkDialog((d) => ({ ...d, open: false }));
        } finally {
            setBulkLoading(false);
        }
    }

    function closeBulkDialog() {
        setBulkDialog({ open: false, mode: null, since: null, count: 0 });
        setBulkResults(null);
    }

    // ── Filter reset ──────────────────────────────────────────────────────────

    function resetFilters() {
        setSearch(''); setActionType('ALL'); setResourceFilter('ALL');
        setFilterStatus('ALL'); setFilterUser('ALL');
        setDateFrom(''); setDateTo(''); setPage(0);
    }

    const hasActiveFilters = search || actionType !== 'ALL' || resourceFilter !== 'ALL'
        || filterStatus !== 'ALL' || filterUser !== 'ALL' || dateFrom || dateTo;

    const visibleSelectableCount = useMemo(
        () => entries.filter((e) => e.status === 'committed').length,
        [entries]
    );

    return (
        <MainCard
            title={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconShieldCheck size={22} />
                    <span>Registro de Auditoría</span>
                </Stack>
            }
            secondary={
                <Tooltip title="Recargar">
                    <IconButton size="small" onClick={refreshAll} disabled={loading}>
                        {loading ? <CircularProgress size={18} /> : <IconRefresh size={18} />}
                    </IconButton>
                </Tooltip>
            }
        >
            <CardContent sx={{ pt: 0 }}>

                <StatsBar stats={stats} />

                {/* ── Filters ── */}
                <Card variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
                    <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} mb={1.5}>
                            <OutlinedInput
                                size="small"
                                placeholder="Buscar usuario, URL, recurso…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                startAdornment={<InputAdornment position="start"><IconSearch size={16} /></InputAdornment>}
                                sx={{ minWidth: 240, bgcolor: 'background.paper' }}
                            />

                            <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'background.paper' }}>
                                <InputLabel>Tipo de acción</InputLabel>
                                <Select
                                    value={actionType}
                                    label="Tipo de acción"
                                    onChange={(e) => { setActionType(e.target.value); setPage(0); }}
                                >
                                    <MenuItem value="ALL">Todas</MenuItem>
                                    <MenuItem value="create">Creación</MenuItem>
                                    <MenuItem value="update">Modificación</MenuItem>
                                    <MenuItem value="delete">Eliminación</MenuItem>
                                    <MenuItem value="bulk">Llenado masivo</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'background.paper' }}>
                                <InputLabel>Recurso</InputLabel>
                                <Select
                                    value={resourceFilter}
                                    label="Recurso"
                                    onChange={(e) => { setResourceFilter(e.target.value); setPage(0); }}
                                >
                                    <MenuItem value="ALL">Todos los recursos</MenuItem>
                                    {resourceOptions
                                        .filter((opt) => opt.value !== 'criterion-scores:single' && opt.value !== 'task-scores:single')
                                        .map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'background.paper' }}>
                                <InputLabel>Estado</InputLabel>
                                <Select value={filterStatus} label="Estado" onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
                                    <MenuItem value="ALL">Todos</MenuItem>
                                    <MenuItem value="committed">Aplicados</MenuItem>
                                    <MenuItem value="reverted">Revertidos</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'background.paper' }}>
                                <InputLabel>Usuario</InputLabel>
                                <Select value={filterUser} label="Usuario" onChange={(e) => { setFilterUser(e.target.value); setPage(0); }}>
                                    <MenuItem value="ALL">Todos los usuarios</MenuItem>
                                    {users.map((u) => (
                                        <MenuItem key={u.user_id} value={u.user_id}>
                                            {u.user_name || `Usuario ${u.user_id}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                size="small" label="Desde" type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 150, bgcolor: 'background.paper' }}
                            />
                            <TextField
                                size="small" label="Hasta" type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 150, bgcolor: 'background.paper' }}
                            />

                            <Box flex={1} />

                            {hasActiveFilters && (
                                <Button size="small" variant="text" onClick={resetFilters} startIcon={<IconX size={14} />}>
                                    Limpiar filtros
                                </Button>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* ── Time-based revert toolbar ── */}
                <TimeRevertBar
                    onPreview={previewSince}
                    previewing={previewing}
                    previewCount={previewCount}
                    since={sinceLocal}
                    onChangeSince={(v) => { setSinceLocal(v); setPreviewCount(0); }}
                    onConfirm={openBulkSinceDialog}
                    disabled={!sinceLocal}
                />

                {/* ── Selection toolbar ── */}
                <SelectionBar
                    count={selected.size}
                    onClear={clearSelection}
                    onRevert={openBulkSelectionDialog}
                    onSelectAll={selectAllVisible}
                    totalVisible={visibleSelectableCount}
                />

                {/* ── Loading bar (subtle, above list) ── */}
                {loading && entries.length > 0 && <LinearProgress sx={{ mb: 1 }} />}

                {/* ── Entry list ── */}
                {loading && entries.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : entries.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <IconShieldCheck size={48} style={{ opacity: 0.2 }} />
                        <Typography color="text.secondary" mt={1}>
                            {hasActiveFilters
                                ? 'Ninguna acción coincide con los filtros aplicados.'
                                : 'Aún no hay acciones registradas.'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {entries.map((entry) => (
                            <AuditEntry
                                key={entry.action_id}
                                entry={entry}
                                selected={selected.has(entry.action_id)}
                                onToggleSelect={toggleSelect}
                                onRevert={setRevertEntry}
                            />
                        ))}
                        <TablePagination
                            component="div"
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            count={total}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            labelRowsPerPage="Acciones por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        />
                    </>
                )}
            </CardContent>

            <RevertDialog
                entry={revertEntry}
                open={!!revertEntry}
                loading={reverting}
                onClose={() => !reverting && setRevertEntry(null)}
                onConfirm={handleRevertSingle}
            />

            <BulkRevertDialog
                open={bulkDialog.open}
                mode={bulkDialog.mode}
                count={bulkDialog.count}
                since={bulkDialog.since}
                loading={bulkLoading}
                results={bulkResults}
                onClose={closeBulkDialog}
                onConfirm={executeBulkRevert}
            />

            <Snackbar
                open={toast.open}
                autoHideDuration={5000}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
}
