import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Divider, Grid, Typography } from '@mui/material';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';

// project imports
import config from './../../config';
import { gridSpacing } from './../../store/constant';

// assets
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import HomeIcon from '@mui/icons-material/Home';
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone';

//-----------------------|| BREADCRUMBS ||-----------------------//

const Breadcrumbs = ({ card, divider, icon, icons, maxItems, navigation, rightAlign, separator, title, titleBottom, ...others }) => {
    const theme = useTheme();

    const [main, setMain] = useState([]);
    const [item, setItem] = useState([]);

    useEffect(() => {
        navigation.items.map((item, index) => {
            if (item.type && item.type === 'group') {
                getCollapse(item, index);
            }
            return false;
        });
    });

    // set active item state
    const getCollapse = (item) => {
        if (item.children) {
            item.children.filter((collapse) => {
                if (collapse.type && collapse.type === 'collapse') {
                    getCollapse(collapse);
                } else if (collapse.type && collapse.type === 'item') {
                    if (document.location.pathname === config.basename + collapse.url) {
                        setMain(item);
                        setItem(collapse);
                    }
                }
                return false;
            });
        }
    };

    // item separator
    const SeparatorIcon = separator;
    const separatorIcon = separator ? <SeparatorIcon stroke={1.5} size="1rem" /> : '/';

    let mainContent, itemContent;
    let breadcrumbContent = '';
    let itemTitle = '';
    let CollapseIcon;
    let ItemIcon;

    // collapse item
    if (main && main.type === 'collapse') {
        CollapseIcon = main.icon ? main.icon : AccountTreeTwoToneIcon;
        mainContent = (
            <Typography
                component={Link}
                to="#"
                variant="subtitle1"
                sx={{
                    display: 'flex',
                    color: theme.palette.grey[900],
                    textDecoration: 'none',
                    alignContent: 'center',
                    alignItems: 'center',
                }}
            >
                {icons && <CollapseIcon sx={{ mr: 0.75, mt: '-2px', width: '1rem', height: '1rem', color: 'secondary.main' }} />}
                {main.title}
            </Typography>
        );
    }

    // items
    if (item && item.type === 'item') {
        itemTitle = item.title;

        ItemIcon = item.icon ? item.icon : AccountTreeTwoToneIcon;
        itemContent = (
            <Typography
                variant="subtitle1"
                sx={{
                    display: 'flex',
                    textDecoration: 'none',
                    alignContent: 'center',
                    alignItems: 'center',
                    color: theme.palette.grey[500],
                }}
            >
                {icons && <ItemIcon sx={{ mr: 0.75, mt: '-2px', width: '1rem', height: '1rem', color: 'secondary.main' }} />}
                {itemTitle}
            </Typography>
        );

        // main
        if (item.breadcrumbs !== false) {
            breadcrumbContent = (
                <Card
                    sx={
                        card !== false
                            ? {
                                  mb: gridSpacing,
                                  border: '1px solid',
                                  borderColor: (theme.palette.primary[200] || theme.palette.primary.light) + '75',
                              }
                            : {
                                  background: 'transparent',
                                  boxShadow: 'none',
                                  border: 'none',
                              }
                    }
                    {...others}
                >
                    <CardContent
                        sx={
                            card !== false
                                ? { padding: '16px !important' }
                                : { padding: '16px !important', paddingLeft: '0 !important' }
                        }
                    >
                        <Grid
                            container
                            direction={rightAlign ? 'row' : 'column'}
                            justifyContent={rightAlign ? 'space-between' : 'flex-start'}
                            alignItems={rightAlign ? 'center' : 'flex-start'}
                            spacing={1}
                        >
                            {title && !titleBottom && (
                                <Grid>
                                    <Typography variant="h3" sx={{ fontWeight: 500 }}>
                                        {' '}
                                        {item.title}{' '}
                                    </Typography>
                                </Grid>
                            )}
                            <Grid>
                                <MuiBreadcrumbs aria-label="breadcrumb" maxItems={maxItems ? maxItems : 8} separator={separatorIcon}>
                                    <Typography
                                        component={Link}
                                        to="/"
                                        color="inherit"
                                        variant="subtitle1"
                                        sx={{
                                            display: 'flex',
                                            color: theme.palette.grey[900],
                                            textDecoration: 'none',
                                            alignContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {icons && <HomeTwoToneIcon sx={{ mr: 0.75, mt: '-2px', width: '1rem', height: '1rem', color: 'secondary.main' }} />}
                                        {icon && <HomeIcon sx={{ mt: '-2px', width: '1rem', height: '1rem', color: 'secondary.main', mr: 0 }} />}
                                        {!icon && 'Dashboard'}
                                    </Typography>
                                    {mainContent}
                                    {itemContent}
                                </MuiBreadcrumbs>
                            </Grid>
                            {title && titleBottom && (
                                <Grid>
                                    <Typography variant="h3" sx={{ fontWeight: 500 }}>
                                        {' '}
                                        {item.title}{' '}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                    {card === false && divider !== false && (
                        <Divider
                            sx={{
                                borderColor: 'primary.main',
                                mb: gridSpacing,
                            }}
                        />
                    )}
                </Card>
            );
        }
    }

    return breadcrumbContent;
};

Breadcrumbs.propTypes = {
    card: PropTypes.bool,
    divider: PropTypes.bool,
    icon: PropTypes.bool,
    icons: PropTypes.bool,
    maxItems: PropTypes.number,
    navigation: PropTypes.object,
    rightAlign: PropTypes.bool,
    separator: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    title: PropTypes.bool,
    titleBottom: PropTypes.bool,
};

export default Breadcrumbs;
