import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';

const TaskDialog = ({ open, onClose, onSave, subCriteria = [], specialCriteria = [], initialSubCriterion = '' }) => {
    const [name, setName] = useState('');
    const [weight, setWeight] = useState(1);
    const [selectedSub, setSelectedSub] = useState(initialSubCriterion);

    useEffect(() => {
        if (open) {
            setSelectedSub(initialSubCriterion);
            setName('');
            setWeight(1);
        }
    }, [open, initialSubCriterion]);

    const handleSave = () => {
        const showSubSelect = subCriteria.length > 0 || specialCriteria.length > 0;
        if (!selectedSub && showSubSelect) return;

        let finalName = name.trim();
        if (!finalName && selectedSub) {
            const isSpecial = String(selectedSub).startsWith('special-');
            if (isSpecial) {
                const actualId = String(selectedSub).replace('special-', '');
                const foundSpec = specialCriteria.find(s => String(s.id) === actualId);
                if (foundSpec) finalName = foundSpec.name;
            } else {
                const foundSub = subCriteria.find(s => String(s.id) === String(selectedSub));
                if (foundSub) finalName = foundSub.name;
            }
            if (!finalName) finalName = "Nueva Tarea";
        }

        onSave({ name: finalName, weight: parseInt(weight) || 1, subCriterionId: selectedSub });
    };

    const showSubSelect = subCriteria.length > 0 || specialCriteria.length > 0;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ zIndex: 9999 }}>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} style={{ marginTop: 5 }}>
                    {showSubSelect && (
                        <Grid size={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Sub-Criterio de Evaluación</InputLabel>
                                <Select
                                    value={selectedSub}
                                    onChange={(e) => setSelectedSub(e.target.value)}
                                    label="Sub-Criterio de Evaluación"
                                    MenuProps={{ style: { zIndex: 10000 } }}
                                >
                                    <MenuItem value=""><em>Seleccione...</em></MenuItem>
                                    {subCriteria.map(sc => (
                                        <MenuItem key={sc.id} value={sc.id}>
                                            {sc.parent_criterion_details?.name} - {sc.name} ({sc.percentage}%)
                                        </MenuItem>
                                    ))}
                                    {specialCriteria.map(sc => (
                                        <MenuItem key={`special-${sc.id}`} value={`special-${sc.id}`}>
                                            ⭐ {sc.parent_criterion_details?.name} - {sc.name} (+{sc.percentage} pts)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Nombre de la Tarea (Opcional)"
                            placeholder="Dejar en blanco para usar nombre del subcriterio"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Ponderación (Equivale a N tareas)"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            variant="outlined"
                            inputProps={{ min: 1 }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Cancelar</Button>
                <Button onClick={handleSave} color="secondary" variant="contained" disabled={showSubSelect && !selectedSub}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDialog;
