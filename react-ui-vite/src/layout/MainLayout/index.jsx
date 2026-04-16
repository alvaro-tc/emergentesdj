import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import { useTheme } from '@mui/material/styles';
import { AppBar, Box, CssBaseline, Toolbar, useMediaQuery } from '@mui/material';

// third-party
import clsx from 'clsx';

// project imports
import Breadcrumbs from './../../ui-component/extended/Breadcrumbs';
import Header from './Header';
import Sidebar from './Sidebar';
import navigation from './../../menu-items';
import { drawerWidth } from '../../store/constant';
import { SET_MENU } from './../../store/actions';

// assets
import { IconChevronRight } from '@tabler/icons-react';

//-----------------------|| MAIN LAYOUT ||-----------------------//

const MainLayout = ({ children }) => {
    const theme = useTheme();
    const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

    // Handle left drawer
    const leftDrawerOpened = useSelector((state) => state.customization.opened);
    const dispatch = useDispatch();
    const handleLeftDrawerToggle = () => {
        dispatch({ type: SET_MENU, opened: !leftDrawerOpened });
    };

    React.useEffect(() => {
        dispatch({ type: SET_MENU, opened: !matchDownMd });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchDownMd]);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {/* header */}
            <AppBar
                enableColorOnDark
                position="fixed"
                color="inherit"
                elevation={0}
                sx={{
                    bgcolor: 'background.default',
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    zIndex: { xs: theme.zIndex.appBar, md: theme.zIndex.drawer + 1 },
                }}
            >
                <Toolbar sx={{ minHeight: '40px', py: '4px' }}>
                    <Header handleLeftDrawerToggle={handleLeftDrawerToggle} />
                </Toolbar>
            </AppBar>

            {/* drawer */}
            <Sidebar drawerOpen={leftDrawerOpened} drawerToggle={handleLeftDrawerToggle} />

            {/* main content */}
            <Box
                component="main"
                sx={{
                    ...theme.typography.mainContent,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    paddingTop: '48px',
                    transition: leftDrawerOpened
                        ? theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.easeOut,
                            duration: theme.transitions.duration.enteringScreen,
                        })
                        : theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    [theme.breakpoints.up('md')]: {
                        marginLeft: leftDrawerOpened ? `${drawerWidth}px` : '20px',
                        width: leftDrawerOpened
                            ? `calc(100% - ${drawerWidth}px)`
                            : 'calc(100% - 40px)',
                    },
                    [theme.breakpoints.down('md')]: {
                        marginTop: '48px',
                        marginLeft: '20px',
                        marginRight: '20px',
                        width: 'calc(100% - 40px)',
                        padding: '16px',
                    },
                    [theme.breakpoints.down('sm')]: {
                        marginTop: '48px',
                        marginLeft: '10px',
                        marginRight: '10px',
                        width: 'calc(100% - 20px)',
                        padding: '12px',
                    },
                }}
            >
                {/* breadcrumb */}
                <Breadcrumbs separator={IconChevronRight} navigation={navigation} icon title rightAlign />
                <Box>{children}</Box>
            </Box>
        </Box>
    );
};

MainLayout.propTypes = {
    children: PropTypes.node
};

export default MainLayout;
