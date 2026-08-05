import React, { useState } from 'react';
import { Box, ButtonBase, Chip, Divider, Popover, Typography } from '@mui/material';
import { IconChevronDown, IconSchool } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import useCourseContext from '../../../../hooks/useCourseContext';
import usePeriodContext from '../../../../hooks/usePeriodContext';
import CourseFilters from './CourseFilters';
import CourseOptions from './CourseOptions';
import { courseCaption, courseLabel } from '../../../../utils/courseLabels';

/**
 * Selector del contexto de trabajo, en la cabecera del sidebar.
 * El curso seleccionado gobierna las opciones del menú y las pantallas académicas.
 */
const CourseContextSelector = () => {
    const isLoggedIn = useSelector((state) => state.account.isLoggedIn);
    const [anchorEl, setAnchorEl] = useState(null);
    const { periods, isTemporary, activePeriod } = usePeriodContext({ loadPeriods: true });
    const context = useCourseContext();
    const { activeCourse, filteredCourses, selectCourse } = context;

    if (!isLoggedIn) return null;

    const handleSelect = (course) => {
        selectCourse(course);
        setAnchorEl(null);
    };

    return (
        <Box sx={{ px: 0.5, pt: 1, pb: 1.5 }}>
            <ButtonBase
                onClick={(event) => setAnchorEl(event.currentTarget)}
                sx={{
                    width: '100%',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    bgcolor: 'primary.light',
                    px: 1.5,
                    py: 1,
                    justifyContent: 'space-between',
                    textAlign: 'left'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <IconSchool size="1.1rem" stroke={1.5} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'primary.dark' }}>
                            {activeCourse ? courseLabel(activeCourse) : 'Sin curso seleccionado'}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block', color: 'primary.dark' }}>
                            {activeCourse ? courseCaption(activeCourse) : 'Elige un curso para trabajar'}
                        </Typography>
                    </Box>
                </Box>
                <IconChevronDown size="1rem" stroke={1.5} />
            </ButtonBase>

            {isTemporary && (
                <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={`Vista temporal · volver a ${activePeriod?.name || 'periodo activo'}`}
                    onClick={() => context.changeFilterPeriod('', null)}
                    sx={{ mt: 1, width: '100%', cursor: 'pointer' }}
                />
            )}

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { width: 340, maxWidth: '90vw', borderRadius: '12px' } } }}
            >
                <CourseFilters
                    search={context.search}
                    setSearch={context.setSearch}
                    periods={periods}
                    filterPeriod={context.filterPeriod}
                    onChangePeriod={context.changeFilterPeriod}
                    programs={context.programs}
                    filterProgram={context.filterProgram}
                    setFilterProgram={context.setFilterProgram}
                    showArchived={context.showArchived}
                    setShowArchived={context.setShowArchived}
                />
                <Divider />
                <CourseOptions
                    courses={filteredCourses}
                    activeCourseId={activeCourse?.id}
                    onSelect={handleSelect}
                />
            </Popover>
        </Box>
    );
};

export default CourseContextSelector;
