import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconEye } from '@tabler/icons-react';

const LETTER_SCORES = {
    'A': 100,
    'B': 80,
    'C': 60,
    'D': 40,
    'E': 10
};

const getLetterFromScore = (score) => {
    if (score === null || score === undefined) return null;
    const s = parseFloat(score);
    for (const [letter, val] of Object.entries(LETTER_SCORES)) {
        if (s === val) return letter;
    }
    return score;
};

const TaskDetailsModal = ({ open, onClose, subItem }) => {
    if (!subItem || !subItem.tasks) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Tareas de: {subItem.name}</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>Tarea</TableCell>
                                <TableCell align="center">Ponderación</TableCell>
                                <TableCell align="center">Nota Exacta</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {subItem.tasks.map((task, idx) => {
                                const letter = getLetterFromScore(task.score);
                                return (
                                    <TableRow key={idx}>
                                        <TableCell>{task.name}</TableCell>
                                        <TableCell align="center">x {task.weight}</TableCell>
                                        <TableCell align="center" style={{ fontWeight: 'bold', color: '#1565c0' }}>
                                            {letter}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {subItem.tasks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" style={{ padding: 16 }}>
                                        <Typography variant="body2" color="textSecondary">No hay tareas registradas.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
};

const Row = ({ row }) => {
    // Only clear criteria with sub-items are collapsible
    const hasSubItems = row.sub_criteria && row.sub_criteria.length > 0;
    const [open, setOpen] = React.useState(false);

    const [taskModalOpen, setTaskModalOpen] = React.useState(false);
    const [selectedSubItem, setSelectedSubItem] = React.useState(null);

    const handleOpenTaskModal = (subItem) => {
        setSelectedSubItem(subItem);
        setTaskModalOpen(true);
    };

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: row.is_special ? '#f0fdf4' : 'inherit' }}>
                <TableCell style={{ width: 50 }}>
                    {hasSubItems && (
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    )}
                </TableCell>
                <TableCell component="th" scope="row">
                    <Typography variant="subtitle1" component="span" style={{ fontWeight: 'bold' }}>
                        {row.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>
                        ({row.max_points} pts)
                    </Typography>
                    {row.is_special && (
                        <Typography variant="caption" display="block" color="success.main">
                            (Puntos Extra)
                        </Typography>
                    )}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', paddingRight: '40px' }}>{row.score} pts</TableCell>
            </TableRow>
            {hasSubItems && (
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1, ml: 6 }}>
                                <Table size="small" aria-label="purchases">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Criterio</TableCell>
                                            <TableCell align="right" sx={{ paddingRight: '40px' }}>Puntaje</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {row.sub_criteria.map((subItem) => (
                                            <TableRow key={subItem.name} sx={{ backgroundColor: subItem.is_special ? '#f0fdf4' : 'inherit' }}>
                                                <TableCell component="th" scope="row">
                                                    {subItem.name}
                                                    <span style={{ color: '#666', fontSize: '0.85em', marginLeft: 4 }}>
                                                        ({subItem.max_points} pts)
                                                    </span>
                                                    {subItem.is_special && (
                                                        <span style={{ color: 'green', fontSize: '0.75em', marginLeft: 6, fontWeight: 'bold' }}>
                                                            (+ Extra)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: subItem.is_special ? 'green' : 'inherit', fontWeight: subItem.is_special ? 'bold' : 'normal', position: 'relative', paddingRight: '40px' }}>
                                                    {subItem.score} pts
                                                    {subItem.tasks && subItem.tasks.length > 0 && (
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenTaskModal(subItem)}
                                                            title="Ver detalles de las tareas"
                                                            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: 4 }}
                                                        >
                                                            <IconEye size="1.2rem" />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}

            <TaskDetailsModal
                open={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                subItem={selectedSubItem}
            />
        </React.Fragment>
    );
};

const GradesModal = ({ open, onClose, course }) => {
    if (!course) return null;

    const criteria = course.criteria_grades || [];

    // Calculate final grade sum
    const totalMax = criteria.reduce((sum, crit) => sum + parseFloat(crit.max_points || 0), 0);
    const finalGrade = criteria.reduce((sum, crit) => sum + parseFloat(crit.score || 0), 0).toFixed(2);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h3">Mis Calificaciones</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Box mb={2}>
                    <Typography variant="h4" color="primary" gutterBottom>{course.name}</Typography>
                    <Typography variant="subtitle2" color="textSecondary">{course.teacher}</Typography>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                    <Table aria-label="collapsible table" size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell />
                                <TableCell><Typography variant="subtitle2">Criterio</Typography></TableCell>
                                <TableCell align="right" sx={{ paddingRight: '40px' }}><Typography variant="subtitle2">Puntaje</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {criteria.length > 0 ? (
                                criteria.map((crit, index) => (
                                    <Row key={index} row={crit} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                            No hay criterios de evaluación disponibles.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {/* Final Grade Row */}
                            <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                <TableCell />
                                <TableCell>
                                    <Typography variant="subtitle1" color="primary">Total</Typography>
                                    <Typography variant="caption" color="primary" style={{ marginLeft: 8 }}>
                                        ({totalMax} pts)
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ paddingRight: '40px' }}>
                                    <Typography variant="h4" color="primary">{finalGrade} pts</Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={2}>
                    <Typography variant="caption" color="textSecondary">
                        * Haz clic en la flecha para ver el detalle de cada criterio.
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default GradesModal;
