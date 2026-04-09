// material-ui
import { styled } from '@mui/material/styles';

//-----------------------|| AUTHENTICATION 1 WRAPPER ||-----------------------//

const AuthWrapper1 = styled('div')(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, #ffffff 100%)`,
    minHeight: '100vh'
}));

export default AuthWrapper1;
