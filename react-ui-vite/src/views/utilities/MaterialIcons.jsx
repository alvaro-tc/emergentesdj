import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card } from '@mui/material';

// project imports
import MainCard from './../../ui-component/cards/MainCard';
import SecondaryAction from './../../ui-component/cards/CardSecondaryAction';


//============================|| MATERIAL ICONS ||============================//

const MaterialIcons = () => {
    const theme = useTheme();

    return (
        <MainCard title="Material Icons" secondary={<SecondaryAction link="https://material-ui.com/components/material-icons/" />}>
            <Card sx={{ overflow: 'hidden' }}>
                <iframe
                    title="Material Icon"
                    style={{ height: 'calc(100vh - 210px)', border: `1px solid ${theme.palette.primary.light}` }}
                    width="100%"
                    src="https://material-ui.com/components/material-icons/"
                />
            </Card>
        </MainCard>
    );
};

export default MaterialIcons;
