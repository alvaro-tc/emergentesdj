import React from 'react';

// material-ui
import { Card, CardContent, Grid, Skeleton } from '@mui/material';

// project imports
import { gridSpacing } from './../../../store/constant';

//-----------------------|| SKELETON - POPULAR CARD ||-----------------------//

const PopularCard = () => {
    // Helper to repeat a row pattern 5 times
    const rows = Array.from({ length: 5 });

    return (
        <Card>
            <CardContent>
                <Grid container spacing={gridSpacing}>
                    <Grid size={12}>
                        <Grid container alignItems="center" justifyContent="space-between" spacing={gridSpacing}>
                            <Grid size="grow">
                                <Skeleton variant="rectangular" height={20} />
                            </Grid>
                            <Grid>
                                <Skeleton variant="rectangular" height={20} width={20} />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid size={12}>
                        <Skeleton variant="rectangular" height={150} />
                    </Grid>
                    {rows.map((_, i) => (
                        <Grid key={i} size={12}>
                            <Grid container spacing={1}>
                                <Grid size={12}>
                                    <Grid container alignItems="center" spacing={gridSpacing} justifyContent="space-between">
                                        <Grid size={6}>
                                            <Skeleton variant="rectangular" height={20} />
                                        </Grid>
                                        <Grid size={6}>
                                            <Grid container alignItems="center" spacing={gridSpacing} justifyContent="space-between">
                                                <Grid size="grow">
                                                    <Skeleton variant="rectangular" height={20} />
                                                </Grid>
                                                <Grid>
                                                    <Skeleton variant="rectangular" height={16} width={16} />
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid size={6}>
                                    <Skeleton variant="rectangular" height={20} />
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
            <CardContent sx={{ display: 'flex', pt: 0, p: '10px', justifyContent: 'center' }}>
                <Skeleton variant="rectangular" height={25} width={75} />
            </CardContent>
        </Card>
    );
};

export default PopularCard;
