// project imports
import config from './../config';
import logo from './../assets/images/logo_emergentes.png';

import { useTheme } from '@mui/material/styles';

//-----------------------|| LOGO SVG ||-----------------------//

const Logo = () => {
    const theme = useTheme();

    return (
        <div
            style={{
                width: 150,
                height: 92, // Aspcect ratio of logo might need adjustment, but 150 width is fixed.
                backgroundColor: theme.palette.secondary.main,
                maskImage: `url(${logo})`,
                WebkitMaskImage: `url(${logo})`,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskPosition: 'center',
                WebkitMaskPosition: 'center'
            }}
        />
    );
};

export default Logo;
