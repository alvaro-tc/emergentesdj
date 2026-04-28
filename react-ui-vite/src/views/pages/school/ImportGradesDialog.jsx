import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Select,
    MenuItem,
    FormControl,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { IconUpload, IconDownload, IconFileExcel } from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import configData from '../../../config';

const ImportGradesDialog = ({ open, onClose, structure, activeCourse, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [mapping, setMapping] = useState({});
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Criterios a mapear: CI + sub-criterios y criterios especiales
    const [requiredFields, setRequiredFields] = useState([]);

    useEffect(() => {
        if (open && structure) {
            resetState();
            
            const fields = [{ id: 'ci', name: 'CI / Carnet', type: 'system' }];
            structure.forEach(group => {
                group.sub_criteria.filter(s => s.visible).forEach(sub => {
                    fields.push({ id: sub.id, name: sub.name, type: 'sub', groupName: group.name });
                });
                (group.special_criteria || []).filter(s => s.visible).forEach(spec => {
                    fields.push({ id: `special-${spec.id}`, name: spec.name, type: 'special', groupName: group.name });
                });
            });
            setRequiredFields(fields);
        }
    }, [open, structure]);

    const resetState = () => {
        setFile(null);
        setHeaders([]);
        setRows([]);
        setMapping({});
    };

    const handleDownloadTemplate = () => {
        const headersArr = ["CI", "Paterno", "Materno", "Nombres"];
        
        structure.forEach(group => {
            group.sub_criteria.filter(s => s.visible).forEach(sub => {
                headersArr.push(sub.name);
            });
            (group.special_criteria || []).filter(s => s.visible).forEach(spec => {
                headersArr.push(spec.name);
            });
        });

        const exampleRow = ["1234567", "Perez", "Gomez", "Juan"];
        // Llenar con ceros o vacíos para las notas
        for (let i = 4; i < headersArr.length; i++) {
            exampleRow.push(80); // Ejemplo de nota
        }

        const worksheet = XLSX.utils.aoa_to_sheet([headersArr, exampleRow]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
        XLSX.writeFile(workbook, `Plantilla_Notas_${activeCourse?.subject_details?.name || 'Curso'}.xlsx`);
    };

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                // header: 1 indica que devuelva un array de arrays
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                if (data.length > 0) {
                    // Encontrar la primera fila que parezca tener cabeceras (no vacía)
                    let headerRowIdx = 0;
                    for (let i = 0; i < Math.min(5, data.length); i++) {
                        if (data[i] && data[i].length > 0) {
                            headerRowIdx = i;
                            break;
                        }
                    }
                    
                    const extractedHeaders = data[headerRowIdx].map(h => String(h).trim());
                    setHeaders(extractedHeaders);
                    
                    // Resto de filas
                    const extractedRows = data.slice(headerRowIdx + 1).filter(r => r.length > 0);
                    
                    // Convertir filas de array a objeto basado en los headers
                    const mappedRows = extractedRows.map(rowArray => {
                        const rowObj = {};
                        extractedHeaders.forEach((h, idx) => {
                            rowObj[h] = rowArray[idx];
                        });
                        return rowObj;
                    });
                    
                    setRows(mappedRows);
                    autoMapColumns(extractedHeaders, requiredFields);
                }
            } catch (error) {
                console.error("Error leyendo Excel", error);
                setSnackbar({ open: true, message: 'Error leyendo el archivo Excel', severity: 'error' });
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const autoMapColumns = (excelHeaders, fields) => {
        const newMapping = {};
        const lowerHeaders = excelHeaders.map(h => h.toLowerCase());
        
        fields.forEach(field => {
            const fieldNameLower = field.name.toLowerCase();
            
            // Auto-mapeo exacto
            let matchIdx = lowerHeaders.indexOf(fieldNameLower);
            
            // Auto-mapeo para CI
            if (field.id === 'ci' && matchIdx === -1) {
                const ciAliases = ['ci', 'carnet', 'c.i.', 'c.i', 'cedula'];
                matchIdx = lowerHeaders.findIndex(h => ciAliases.includes(h));
            }

            if (matchIdx !== -1) {
                newMapping[field.id] = excelHeaders[matchIdx];
            } else {
                newMapping[field.id] = "";
            }
        });
        
        setMapping(newMapping);
    };

    const handleMappingChange = (fieldId, excelHeader) => {
        setMapping(prev => ({
            ...prev,
            [fieldId]: excelHeader
        }));
    };

    const loadAllEnrollments = async () => {
        let all = [];
        let url = `${configData.API_SERVER}enrollments/?course=${activeCourse.id}&page_size=200`;
        try {
            while (url) {
                const res = await axios.get(url);
                if (res.data && res.data.results) {
                    all = [...all, ...res.data.results];
                    url = res.data.next;
                } else {
                    // if no pagination
                    all = res.data;
                    break;
                }
            }
            return all;
        } catch (error) {
            console.error("Error fetching enrollments", error);
            throw error;
        }
    };

    const handleImport = async () => {
        if (!mapping['ci']) {
            setSnackbar({ open: true, message: 'Debe seleccionar una columna para el CI', severity: 'error' });
            return;
        }

        setLoading(true);
        try {
            // 1. Obtener todas las inscripciones del curso
            const enrollments = await loadAllEnrollments();
            
            // Crear un mapa de CI -> enrollment_id
            const ciToEnrollmentId = {};
            enrollments.forEach(enr => {
                if (enr.student_details && enr.student_details.ci_number) {
                    ciToEnrollmentId[String(enr.student_details.ci_number).trim()] = enr.id;
                }
            });

            // 2. Construir payload de actualizaciones
            const updates = [];
            const ciColumn = mapping['ci'];

            rows.forEach(row => {
                const rawCi = row[ciColumn];
                if (!rawCi) return;
                
                // Extraer solo digitos del CI por si acaso
                const ci = String(rawCi).replace(/\D/g, '');
                const enrollmentId = ciToEnrollmentId[ci];
                
                if (enrollmentId) {
                    requiredFields.forEach(field => {
                        if (field.id === 'ci') return;
                        
                        const excelCol = mapping[field.id];
                        if (excelCol && row[excelCol] !== undefined && row[excelCol] !== null && row[excelCol] !== '') {
                            updates.push({
                                enrollment_id: enrollmentId,
                                criterion_id: field.id,
                                score: parseFloat(row[excelCol]) || 0
                            });
                        }
                    });
                }
            });

            if (updates.length === 0) {
                setSnackbar({ open: true, message: 'No se encontraron notas para actualizar (revisar que los CI coincidan)', severity: 'warning' });
                setLoading(false);
                return;
            }

            // 3. Enviar a bulk_save
            const payload = { updates };
            await axios.post(`${configData.API_SERVER}criterion-scores/bulk_save/`, payload);
            
            setSnackbar({ open: true, message: 'Notas importadas exitosamente', severity: 'success' });
            
            // Esperar un momento para que se muestre el mensaje
            setTimeout(() => {
                setLoading(false);
                onSuccess();
                onClose();
            }, 1500);

        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Error al importar calificaciones', severity: 'error' });
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="md" fullWidth>
            <DialogTitle>Importar Calificaciones Excel</DialogTitle>
            <DialogContent dividers>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                        Descarga la plantilla de ejemplo o sube un archivo Excel existente.
                    </Typography>
                    <Button 
                        variant="outlined" 
                        startIcon={<IconDownload />} 
                        onClick={handleDownloadTemplate}
                    >
                        Plantilla
                    </Button>
                </Box>

                <Box mb={3} display="flex" justifyContent="center">
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<IconUpload />}
                        disabled={loading}
                    >
                        Seleccionar Archivo Excel
                        <input
                            type="file"
                            hidden
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                        />
                    </Button>
                </Box>

                {file && (
                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            <IconFileExcel size="1rem" style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                            {file.name} ({rows.length} filas detectadas)
                        </Typography>
                    </Box>
                )}

                {headers.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><strong>Campo en Sistema</strong></TableCell>
                                    <TableCell><strong>Grupo</strong></TableCell>
                                    <TableCell><strong>Columna en Excel</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requiredFields.map(field => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            {field.name}
                                            {field.id === 'ci' && <span style={{color: 'red'}}> *</span>}
                                        </TableCell>
                                        <TableCell>
                                            {field.groupName || '-'}
                                            {field.type === 'special' && <span style={{fontSize: '0.8em', color: '#e65100', marginLeft: 4}}>(Extra)</span>}
                                        </TableCell>
                                        <TableCell>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={mapping[field.id] || ""}
                                                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="">
                                                        <em>-- No importar / Ignorar --</em>
                                                    </MenuItem>
                                                    {headers.map((h, i) => (
                                                        <MenuItem key={i} value={h}>{h}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleImport}
                    disabled={headers.length === 0 || loading || !mapping['ci']}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Procesar Importación'}
                </Button>
            </DialogActions>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default ImportGradesDialog;
