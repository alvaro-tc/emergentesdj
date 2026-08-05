import React from 'react';
import PropTypes from 'prop-types';
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { courseCaption, courseLabel } from '../../../../utils/courseLabels';

/** Lista de cursos seleccionables como contexto de trabajo. */
const CourseOptions = ({ courses, activeCourseId, onSelect }) => {
    if (courses.length === 0) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                    Ningún curso coincide con los filtros
                </Typography>
            </Box>
        );
    }

    return (
        <List dense sx={{ maxHeight: 320, overflowY: 'auto', py: 0 }}>
            {courses.map((course) => (
                <ListItemButton
                    key={course.id}
                    selected={course.id === activeCourseId}
                    onClick={() => onSelect(course)}
                >
                    <ListItemText
                        primary={
                            <Typography variant="body2" noWrap sx={{ fontWeight: course.id === activeCourseId ? 700 : 500 }}>
                                {courseLabel(course)}
                            </Typography>
                        }
                        secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {courseCaption(course)}
                            </Typography>
                        }
                    />
                </ListItemButton>
            ))}
        </List>
    );
};

CourseOptions.propTypes = {
    courses: PropTypes.array.isRequired,
    activeCourseId: PropTypes.number,
    onSelect: PropTypes.func.isRequired
};

export default CourseOptions;
