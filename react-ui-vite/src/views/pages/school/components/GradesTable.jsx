import React, { useCallback } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import { IconEye, IconNotebook } from '@tabler/icons-react';

const PATERNO_LEFT = 0;
const MATERNO_LEFT = 140;

const ScoreCell = React.memo(({ sub, row, onScoreChange, onOpenTaskModal, projects }) => {
    const value = row.grades[sub.id];
    const displayVal = value !== undefined && value !== null ? parseFloat(value).toFixed(2) : '-';

    if (sub.has_tasks || sub.has_projects) {
        const project = sub.has_projects ? projects.find(p => p.sub_criterion === sub.id && p.members.includes(row.enrollment_id)) : null;
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>{displayVal}</Typography>
                {sub.has_tasks ? (
                    <Tooltip title="Ver Tareas">
                        <IconButton onClick={() => onOpenTaskModal(row, sub.id)} size="small" color="primary">
                            <IconEye size="1.2rem" />
                        </IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title={project ? `Gestionar: ${project.name}` : 'Sin proyecto'}>
                        <IconButton size="small" onClick={() => project && onOpenTaskModal(row, sub.id)} sx={{ color: project ? undefined : '#ccc' }}>
                            <IconNotebook size="1.2rem" />
                        </IconButton>
                    </Tooltip>
                )}
            </div>
        );
    }
    if (sub.editable) {
        return (
            <TextField
                type="number"
                value={value || ''}
                onChange={e => {
                    const v = e.target.value;
                    if (v !== '' && (parseFloat(v) > sub.percentage || parseFloat(v) < 0)) return;
                    onScoreChange(row.enrollment_id, sub.id, v);
                }}
                variant="outlined"
                size="small"
                sx={{ width: 80 }}
                inputProps={{ min: 0, max: sub.percentage, step: '0.01', style: { textAlign: 'center' } }}
            />
        );
    }
    return <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{displayVal}</Typography>;
});

const GradesTable = ({ rows, structure, totalCount, page, pageSize, visibleColumns, showFinalGrade, isCriterionGradeVisible, projects, onScoreChange, onOpenTaskModal, onOpenDetailModal, onPageChange, onPageSizeChange }) => {
    const matLeft = visibleColumns.paterno ? MATERNO_LEFT : 0;

    return (
        <>
            <TableContainer>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {visibleColumns.ci && <TableCell rowSpan={2} sx={{ bgcolor: '#fff', zIndex: 10, minWidth: 80 }}>CI</TableCell>}
                            {visibleColumns.paterno && <TableCell rowSpan={2} sx={{ bgcolor: '#fff', zIndex: 11, position: 'sticky', left: PATERNO_LEFT, minWidth: 140 }}>Paterno</TableCell>}
                            {visibleColumns.materno && <TableCell rowSpan={2} sx={{ bgcolor: '#fff', zIndex: 11, position: 'sticky', left: matLeft, minWidth: 140 }}>Materno</TableCell>}
                            {visibleColumns.nombre && <TableCell rowSpan={2} sx={{ bgcolor: '#fff', zIndex: 10, minWidth: 140 }}>Nombres</TableCell>}
                            {structure.map((group, idx) => {
                                const vSubs = group.sub_criteria.filter(s => s.visible).length;
                                const vSpec = (group.special_criteria || []).filter(s => s.visible).length;
                                const showNote = isCriterionGradeVisible(group.id);
                                if (vSubs + vSpec === 0 && !showNote) return null;
                                const bg = idx % 2 === 0 ? '#e3f2fd' : '#f3e5f5';
                                return (
                                    <React.Fragment key={group.id}>
                                        {(vSubs + vSpec) > 0 && <TableCell colSpan={vSubs + vSpec} align="center" sx={{ bgcolor: bg, borderLeft: '2px solid #aaa', borderTop: '2px solid #aaa', fontWeight: 'bold' }}>{group.name} <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>({group.weight} Pts)</span></TableCell>}
                                        {showNote && <TableCell rowSpan={2} align="center" sx={{ bgcolor: bg, fontWeight: 'bold', borderRight: '2px solid #aaa', borderTop: '2px solid #aaa', borderLeft: vSubs + vSpec === 0 ? '2px solid #aaa' : '1px solid #666', minWidth: 80 }}>Nota<br />{group.name}</TableCell>}
                                    </React.Fragment>
                                );
                            })}
                            {showFinalGrade && <TableCell rowSpan={2} align="center" sx={{ bgcolor: '#c8e6c9', fontWeight: 'bold', borderLeft: '3px solid #4caf50', color: '#2e7d32' }}>Nota Final</TableCell>}
                        </TableRow>
                        <TableRow>
                            {structure.map(group => {
                                const vSubs = group.sub_criteria.filter(s => s.visible);
                                const vSpec = (group.special_criteria || []).filter(s => s.visible);
                                if (vSubs.length + vSpec.length === 0 && !isCriterionGradeVisible(group.id)) return null;
                                return (
                                    <React.Fragment key={group.id}>
                                        {vSubs.map((sub, si) => (
                                            <TableCell key={sub.id} align="center" sx={{ minWidth: 100, borderRight: (si === vSubs.length - 1 && vSpec.length === 0 && !isCriterionGradeVisible(group.id)) ? '2px solid #aaa' : '1px solid #ddd', bgcolor: '#fafafa' }}>
                                                {sub.name}<Typography variant="caption" display="block" color="text.secondary">{sub.percentage} Pts</Typography>
                                            </TableCell>
                                        ))}
                                        {vSpec.map((spec, si) => (
                                            <TableCell key={spec.id} align="center" sx={{ minWidth: 100, borderRight: (si === vSpec.length - 1 && !isCriterionGradeVisible(group.id)) ? '2px solid #aaa' : '1px solid #ddd', bgcolor: '#fff3e0' }}>
                                                ⭐ {spec.name}<Typography variant="caption" display="block" sx={{ color: '#e65100' }}>+{spec.percentage} pts</Typography>
                                            </TableCell>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow><TableCell colSpan={10} align="center">No hay estudiantes.</TableCell></TableRow>
                        ) : rows.map(row => (
                            <TableRow key={row.enrollment_id} hover>
                                {visibleColumns.ci && (
                                    <TableCell sx={{ bgcolor: '#fff', zIndex: 5 }}>
                                        <Typography variant="body2" component="span" onClick={() => onOpenDetailModal(row)} sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 'bold', textDecoration: 'underline', '&:hover': { color: 'primary.dark' } }}>
                                            {row.ci}
                                        </Typography>
                                    </TableCell>
                                )}
                                {visibleColumns.paterno && <TableCell sx={{ bgcolor: '#fff', position: 'sticky', left: PATERNO_LEFT, zIndex: 6, fontWeight: 'bold' }}>{row.paterno}</TableCell>}
                                {visibleColumns.materno && <TableCell sx={{ bgcolor: '#fff', position: 'sticky', left: matLeft, zIndex: 6, fontWeight: 'bold' }}>{row.materno}</TableCell>}
                                {visibleColumns.nombre && <TableCell sx={{ bgcolor: '#fff', borderRight: '2px solid #ddd' }}>{row.nombre}</TableCell>}
                                {structure.map((group, gi) => {
                                    const vSubs = group.sub_criteria.filter(s => s.visible);
                                    const vSpec = (group.special_criteria || []).filter(s => s.visible);
                                    const showNote = isCriterionGradeVisible(group.id);
                                    if (vSubs.length + vSpec.length === 0 && !showNote) return null;
                                    const bg = gi % 2 === 0 ? '#bbdefb' : '#e1bee7';
                                    const cd = row._criterionGrades[group.id] || { formatted: '-', grade: 0 };
                                    return (
                                        <React.Fragment key={group.id}>
                                            {vSubs.map((sub, si) => (
                                                <TableCell key={sub.id} align="center" sx={{ borderRight: (si === vSubs.length - 1 && vSpec.length === 0 && !showNote) ? '2px solid #aaa' : '1px solid #ddd', bgcolor: sub.editable ? 'inherit' : '#f5f5f5' }}>
                                                    <ScoreCell sub={sub} row={row} onScoreChange={onScoreChange} onOpenTaskModal={onOpenTaskModal} projects={projects} />
                                                </TableCell>
                                            ))}
                                            {vSpec.map((spec, si) => (
                                                <TableCell key={spec.id} align="center" sx={{ borderRight: (si === vSpec.length - 1 && !showNote) ? '2px solid #aaa' : '1px solid #ddd', bgcolor: '#fff3e0' }}>
                                                    {spec.has_tasks ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Typography variant="body2" sx={{ mr: 1, color: '#e65100', fontWeight: 'bold' }}>{row.grades[spec.id] !== undefined && row.grades[spec.id] !== null ? `+${parseFloat(row.grades[spec.id]).toFixed(2)}` : '-'}</Typography>
                                                            <Tooltip title="Ver Tareas Extra"><IconButton onClick={() => onOpenTaskModal(row, `special-${spec.id}`)} size="small" sx={{ color: '#e65100' }}><IconEye size="1.2rem" /></IconButton></Tooltip>
                                                        </div>
                                                    ) : (
                                                        <TextField type="number" value={row.grades[spec.id] || ''} onChange={e => { const v = e.target.value; if (v !== '' && (parseFloat(v) > spec.percentage || parseFloat(v) < 0)) return; onScoreChange(row.enrollment_id, spec.id, v); }} variant="outlined" size="small" sx={{ width: 80 }} inputProps={{ min: 0, max: spec.percentage, step: '0.01', style: { textAlign: 'center', color: '#e65100' } }} />
                                                    )}
                                                </TableCell>
                                            ))}
                                            {showNote && <TableCell align="center" sx={{ bgcolor: bg, fontWeight: 'bold', borderRight: '2px solid #aaa' }}><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{cd.formatted}</Typography></TableCell>}
                                        </React.Fragment>
                                    );
                                })}
                                {showFinalGrade && <TableCell align="center" sx={{ bgcolor: '#c8e6c9', fontWeight: 'bold', borderLeft: '3px solid #4caf50', color: '#2e7d32' }}>{row._finalGrade}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination component="div" count={totalCount} page={page} onPageChange={onPageChange} rowsPerPage={pageSize} onRowsPerPageChange={onPageSizeChange} rowsPerPageOptions={[15, 30, 50, 100, 200]} labelRowsPerPage="Estudiantes por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} />
        </>
    );
};

export default React.memo(GradesTable);
