import React from 'react';
import { Box, Card, CardActionArea, Chip, Typography, TablePagination, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { IconSettings, IconDownload, IconDotsVertical } from '@tabler/icons-react';

const GradesMobileList = ({ rows, totalCount, page, pageSize, showFinalGrade, onRowClick, onPageChange, onPageSizeChange, onExport, onSettings }) => (
    <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
            {rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No hay estudiantes.
                </Typography>
            ) : (
                rows.map(row => (
                    <Card key={row.enrollment_id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <CardActionArea onClick={() => onRowClick(row)} sx={{ px: 2, py: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                        {row.paterno} {row.materno} {row.nombre}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">{row.ci}</Typography>
                                </Box>
                                {showFinalGrade && (
                                    <Chip
                                        label={row._finalGrade !== '-' ? row._finalGrade : '—'}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            minWidth: 48,
                                            ...(row._finalGrade !== '-'
                                                ? { backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }
                                                : { backgroundColor: 'transparent', color: 'text.disabled', border: '1px solid', borderColor: 'divider' }
                                            )
                                        }}
                                    />
                                )}
                            </Box>
                        </CardActionArea>
                    </Card>
                ))
            )}
        </Box>
        <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={onPageSizeChange}
            rowsPerPageOptions={[15, 30, 50, 100, 200]}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'center' } }}
        />
        <SpeedDial ariaLabel="Opciones" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }} icon={<SpeedDialIcon icon={<IconDotsVertical />} />} direction="up">
            <SpeedDialAction icon={<IconDownload size="1.2rem" />} tooltipTitle="Exportar" tooltipOpen onClick={onExport} />
            <SpeedDialAction icon={<IconSettings size="1.2rem" />} tooltipTitle="Ajustes" tooltipOpen onClick={onSettings} />
        </SpeedDial>
    </>
);

export default React.memo(GradesMobileList);
