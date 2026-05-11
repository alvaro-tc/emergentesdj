import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Checkbox, Chip, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { IconDownload, IconUpload, IconFileSpreadsheet, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { LETTER_SCORES, LETTER_KEYS, getLetterFromScore } from '../../../../hooks/useTaskGrading';
import * as XLSX from 'xlsx';

// ── Undo Dialog ───────────────────────────────────────────────────────────────
export const UndoDialog = React.memo(({ open, onClose, onConfirm }) => (
    <Dialog sx={{ zIndex: 9999 }} open={open} onClose={onClose}>
        <DialogTitle>Deshacer Cambios</DialogTitle>
        <DialogContent><DialogContentText>¿Deshacer los cambios no guardados? Se revertirán a los valores originales.</DialogContentText></DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button onClick={onConfirm} color="error" autoFocus>Deshacer</Button>
        </DialogActions>
    </Dialog>
));

// ── Bulk Confirm Dialog ───────────────────────────────────────────────────────
export const BulkConfirmDialog = React.memo(({ open, letter, onClose, onConfirm }) => (
    <Dialog sx={{ zIndex: 9999 }} open={open} onClose={onClose}>
        <DialogTitle>Confirmar Asignación Masiva</DialogTitle>
        <DialogContent>
            <DialogContentText>
                ¿Asignar <strong>'{letter}'</strong> a todos los estudiantes? Esta acción sobrescribirá todas las notas existentes en la tarea.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button onClick={onConfirm} color="secondary" variant="contained" autoFocus>Continuar</Button>
        </DialogActions>
    </Dialog>
));

// ── Export Dialog ─────────────────────────────────────────────────────────────
export const ExportTasksDialog = React.memo(({ open, onClose, tasks, visibleTasks, onExport }) => {
    const [selected, setSelected] = useState([]);
    React.useEffect(() => { if (open) setSelected(visibleTasks.map(t => t.id)); }, [open, visibleTasks]);
    const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    return (
        <Dialog sx={{ zIndex: 9999 }} open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconFileSpreadsheet size="1.3rem" /> Exportar Notas a Excel</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>Selecciona las tareas a incluir. Se usará el CI como identificador.</DialogContentText>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Tareas disponibles:</Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tasks.map(task => (
                        <div key={task.id} onClick={() => toggle(task.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, border: `1px solid ${selected.includes(task.id) ? '#1976d2' : '#e0e0e0'}`, backgroundColor: selected.includes(task.id) ? 'rgba(25,118,210,0.06)' : 'transparent', cursor: 'pointer' }}>
                            <Checkbox checked={selected.includes(task.id)} size="small" sx={{ p: 0 }} onChange={() => {}} />
                            <Typography variant="body2" sx={{ flex: 1 }}>{task.name}</Typography>
                            <Chip label={`${task.weight}x`} size="small" variant="outlined" />
                            {!task.is_public && <Chip label="Oculta" size="small" color="warning" />}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button size="small" onClick={() => setSelected(tasks.map(t => t.id))}>Todas</Button>
                    <Button size="small" onClick={() => setSelected(visibleTasks.map(t => t.id))}>Solo visibles</Button>
                    <Button size="small" color="error" onClick={() => setSelected([])}>Ninguna</Button>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={() => { onExport(selected); onClose(); }} variant="contained" color="success" disabled={selected.length === 0} startIcon={<IconDownload size="1rem" />}>
                    Exportar ({selected.length} tareas)
                </Button>
            </DialogActions>
        </Dialog>
    );
});

// ── Import Dialog ─────────────────────────────────────────────────────────────
export const ImportTasksDialog = React.memo(({ open, onClose, tasks, rows, onImport }) => {
    const [importFile, setImportFile] = useState(null);
    const [importData, setImportData] = useState(null);
    const [importSelected, setImportSelected] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileRef = useRef(null);

    const reset = useCallback(() => { setImportFile(null); setImportData(null); setImportSelected([]); setImportErrors([]); }, []);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFile(file);
        setImportErrors([]);
        setImportData(null);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (raw.length < 2) { setImportErrors(['El archivo está vacío.']); return; }
                const headerRow = raw[0].map(h => String(h).trim());
                const ciIdx = headerRow.findIndex(h => h.toLowerCase() === 'ci');
                if (ciIdx === -1) { setImportErrors(['No se encontró la columna "CI".']); return; }
                const matched = [];
                headerRow.forEach((h, idx) => {
                    if (idx <= 3) return;
                    const task = tasks.find(t => t.name.trim().toLowerCase() === h.toLowerCase());
                    if (task) matched.push({ colIdx: idx, task, colName: h });
                });
                if (!matched.length) { setImportErrors(['Ninguna columna coincide con las tareas actuales.']); return; }
                const errors = [];
                const parsedRows = raw.slice(1).reduce((acc, row) => {
                    const ci = String(row[ciIdx] || '').trim();
                    if (!ci) return acc;
                    const dbRow = rows.find(r => String(r.ci || '').trim() === ci);
                    const scores = {};
                    matched.forEach(({ colIdx, task }) => {
                        const cell = String(row[colIdx] || '').trim().toUpperCase();
                        if (cell === '') scores[task.id] = null;
                        else if (['A','B','C','D','E'].includes(cell)) scores[task.id] = LETTER_SCORES[cell];
                        else errors.push(`CI ${ci}: valor inválido "${cell}" en "${task.name}"`);
                    });
                    acc.push({ ci, studentName: dbRow ? `${dbRow.paterno} ${dbRow.materno} ${dbRow.nombre}` : null, found: !!dbRow, enrollmentId: dbRow?.enrollment_id, scores });
                    return acc;
                }, []);
                setImportData({ rows: parsedRows, matchedTasks: matched });
                setImportSelected(matched.map(m => m.task.id));
                setImportErrors(errors);
            } catch (err) { setImportErrors([`Error leyendo archivo: ${err.message}`]); }
        };
        reader.readAsArrayBuffer(file);
    }, [tasks, rows]);

    const handleImport = useCallback(async () => {
        if (!importData) return;
        setImportLoading(true);
        const updates = [];
        importData.rows.forEach(row => {
            if (!row.found || !row.enrollmentId) return;
            Object.entries(row.scores).forEach(([taskId, score]) => {
                if (!importSelected.includes(parseInt(taskId))) return;
                updates.push({ enrollment_id: row.enrollmentId, task_id: parseInt(taskId), score });
            });
        });
        await onImport(updates);
        setImportLoading(false);
        reset();
        onClose();
    }, [importData, importSelected, onImport, onClose, reset]);

    return (
        <Dialog sx={{ zIndex: 9999 }} open={open} onClose={() => { if (!importLoading) { reset(); onClose(); } }} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconUpload size="1.3rem" /> Importar Notas desde Excel</DialogTitle>
            <DialogContent>
                <div style={{ marginBottom: 16 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>1. Seleccionar archivo Excel</Typography>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileSelect} />
                    <Button variant="outlined" startIcon={<IconFileSpreadsheet size="1rem" />} onClick={() => fileRef.current?.click()}>Elegir archivo</Button>
                    {importFile && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{importFile.name}</Typography>}
                </div>
                {importErrors.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Advertencias:</Typography>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {importErrors.slice(0, 5).map((e, i) => <li key={i}><Typography variant="caption">{e}</Typography></li>)}
                        </ul>
                    </Alert>
                )}
                {importData && (
                    <>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>2. Seleccionar tareas a importar</Typography>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                            {importData.matchedTasks.map(({ task }) => (
                                <div key={task.id} onClick={() => setImportSelected(p => p.includes(task.id) ? p.filter(x => x !== task.id) : [...p, task.id])} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, border: `1px solid ${importSelected.includes(task.id) ? '#0288d1' : '#e0e0e0'}`, cursor: 'pointer' }}>
                                    <Checkbox checked={importSelected.includes(task.id)} size="small" sx={{ p: 0 }} onChange={() => {}} />
                                    <Typography variant="body2" sx={{ flex: 1 }}>{task.name}</Typography>
                                </div>
                            ))}
                        </div>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>3. Vista previa</Typography>
                        <TableContainer sx={{ maxHeight: 240, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>CI</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Estado</TableCell>
                                        {importData.matchedTasks.filter(mt => importSelected.includes(mt.task.id)).map(mt => (
                                            <TableCell key={mt.task.id} align="center" sx={{ fontWeight: 700 }}>{mt.task.name}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {importData.rows.map((row, i) => (
                                        <TableRow key={i} sx={{ bgcolor: !row.found ? 'rgba(255,100,100,0.08)' : 'transparent' }}>
                                            <TableCell>{row.ci}</TableCell>
                                            <TableCell>{row.studentName || <em style={{ color: 'gray' }}>No encontrado</em>}</TableCell>
                                            <TableCell align="center">{row.found ? <IconCheck size="1rem" color="green" /> : <IconAlertTriangle size="1rem" color="orange" />}</TableCell>
                                            {importData.matchedTasks.filter(mt => importSelected.includes(mt.task.id)).map(mt => (
                                                <TableCell key={mt.task.id} align="center">
                                                    <span style={{ fontWeight: 'bold', color: row.scores[mt.task.id] === null ? '#bbb' : undefined }}>
                                                        {row.scores[mt.task.id] === null ? '—' : (getLetterFromScore(row.scores[mt.task.id]) || '?')}
                                                    </span>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { reset(); onClose(); }} disabled={importLoading}>Cancelar</Button>
                <Button onClick={handleImport} variant="contained" color="info" disabled={!importData || importSelected.length === 0 || importLoading} startIcon={importLoading ? <CircularProgress size={14} color="inherit" /> : <IconUpload size="1rem" />}>
                    {importLoading ? 'Importando...' : `Importar (${importSelected.length} tareas)`}
                </Button>
            </DialogActions>
        </Dialog>
    );
});
