import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, Divider, Grid, Typography } from '@mui/material';
import MainCard from '../../../ui-component/cards/MainCard';
import SkeletonPopularCard from '../../../ui-component/cards/Skeleton/PopularCard';

// assets
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';

//-----------|| DASHBOARD - TOP STUDENTS CARD ||-----------//

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const TopStudentsCard = ({ isLoading, students, courseName }) => {
    const theme = useTheme();

    return (
        <>
            {isLoading ? (
                <SkeletonPopularCard />
            ) : (
                <MainCard
                    contentSX={{ p: '20px !important' }}
                    sx={{ flex: 1 }}
                >
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="h4">Mejores Notas</Typography>
                        <EmojiEventsOutlinedIcon sx={{ color: '#FFD700', fontSize: '1.3rem' }} />
                    </Box>
                    {courseName && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                            {courseName}
                        </Typography>
                    )}

                    {/* List */}
                    {students && students.length > 0 ? (
                        students.map((student, index) => (
                            <React.Fragment key={student.enrollment_id ?? index}>
                                <Grid
                                    container
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ py: 0.75 }}
                                    wrap="nowrap"
                                >
                                    {/* Rank badge */}
                                    <Grid>
                                        <Avatar
                                            sx={{
                                                width: 26,
                                                height: 26,
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                bgcolor: index < 3
                                                    ? MEDAL_COLORS[index]
                                                    : theme.palette.grey[200],
                                                color: index < 3 ? '#fff' : theme.palette.text.secondary,
                                            }}
                                        >
                                            {index + 1}
                                        </Avatar>
                                    </Grid>

                                    {/* Name */}
                                    <Grid sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                                            {student.name}
                                        </Typography>
                                        {student.ci && (
                                            <Typography variant="caption" color="text.secondary">
                                                CI: {student.ci}
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Grade badge */}
                                    <Grid>
                                        <Box
                                            sx={{
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1.5,
                                                bgcolor: student.grade >= 70
                                                    ? theme.palette.success.light
                                                    : student.grade >= 51
                                                    ? theme.palette.warning.light
                                                    : theme.palette.error.light,
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={700}
                                                sx={{
                                                    color: student.grade >= 70
                                                        ? theme.palette.success.dark
                                                        : student.grade >= 51
                                                        ? theme.palette.warning.dark
                                                        : theme.palette.error.dark,
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {student.grade}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {index < students.length - 1 && (
                                    <Divider />
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
                            <Typography variant="body2" color="text.secondary" align="center">
                                Aún no hay notas registradas en este paralelo.
                            </Typography>
                        </Box>
                    )}
                </MainCard>
            )}
        </>
    );
};

TopStudentsCard.propTypes = {
    isLoading: PropTypes.bool,
    students: PropTypes.arrayOf(PropTypes.shape({
        enrollment_id: PropTypes.any,
        name: PropTypes.string,
        ci: PropTypes.string,
        grade: PropTypes.number,
    })),
    courseName: PropTypes.string,
};

export default TopStudentsCard;
