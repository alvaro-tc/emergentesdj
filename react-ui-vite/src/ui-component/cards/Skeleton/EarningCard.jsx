import React from 'react';

// material-ui
import { Card, CardContent, Grid, Skeleton } from '@mui/material';

//-----------------------|| SKELETON EARNING CARD ||-----------------------//

const EarningCard = () => {
    return (
        <Card>
            <CardContent>
                <Grid container direction="column">
                    <Grid>
                        <Grid container justifyContent="space-between">
                            <Grid>
                                <Skeleton variant="rectangular" width={44} height={44} />
                            </Grid>
                            <Grid>
                                <Skeleton variant="rectangular" width={34} height={34} />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid>
                        <Skeleton variant="rectangular" sx={{ mr: 1, mt: '18px', mb: '14px' }} height={40} />
                    </Grid>
                    <Grid>
                        <Skeleton variant="rectangular" height={30} />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default EarningCard;
