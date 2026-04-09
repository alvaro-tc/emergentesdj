import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card } from '@mui/material';

// project imports
import MainCard from './../../ui-component/cards/MainCard';
import SecondaryAction from './../../ui-component/cards/CardSecondaryAction';


//=============================|| TABLER ICONS ||=============================//

const TablerIcons = () => {
    const theme = useTheme();

    return (
        <MainCard title="Tabler Icons" secondary={<SecondaryAction link="https://tablericons.com/" />}>
            <Card sx={{ overflow: 'hidden' }}>
                <iframe
                    title="Tabler Icons"
                    sx={{ height: 'calc(100vh - 210px)', border: '1px solid', borderColor: 'primary.light' }}
                    style={{ height: 'calc(100vh - 210px)', border: `1px solid ${theme.palette.primary.light}` }}
                    width="100%"
                    src="https://tablericons.com/"
                />
            </Card>
        </MainCard>
    );
};

export default TablerIcons;
