import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, StyledEngineProvider } from '@mui/material';

// routing
import Routes from './routes';

// defaultTheme
import theme from './themes';

// project imports
import NavigationScroll from './layout/NavigationScroll';
import { setupAxiosInterceptors } from './utils/axiosSetup';
import ErrorBoundary from './ui-component/ErrorBoundary';

//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);

    // Set up axios interceptor to handle 401 (token expired) globally
    useEffect(() => {
        setupAxiosInterceptors();
    }, []);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(customization)}>
                <CssBaseline />
                <ErrorBoundary>
                    <NavigationScroll>
                        <Routes />
                    </NavigationScroll>
                </ErrorBoundary>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
