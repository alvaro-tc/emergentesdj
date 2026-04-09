import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { Divider, List, Typography } from '@mui/material';

// project imports
import NavItem from './../NavItem';
import NavCollapse from './../NavCollapse';

//-----------------------|| SIDEBAR MENU LIST GROUP ||-----------------------//

const NavGroup = ({ item }) => {
    // menu list collapse & items
    const items = item.children.map((menu) => {
        switch (menu.type) {
            case 'collapse':
                return <NavCollapse key={`${item.id}-${menu.id}`} menu={menu} level={1} />;
            case 'item':
                return <NavItem key={`${item.id}-${menu.id}`} item={menu} level={1} />;
            default:
                return (
                    <Typography key={`${item.id}-${menu.id}`} variant="h6" color="error" align="center">
                        Menu Items Error
                    </Typography>
                );
        }
    });

    return (
        <React.Fragment>
            <List
                subheader={
                    item.title && (
                        <Typography
                            variant="caption"
                            sx={(theme) => ({ ...theme.typography?.menuCaption })}
                            display="block"
                            gutterBottom
                        >
                            {item.title}
                            {item.caption && (
                                <Typography
                                    variant="caption"
                                    sx={(theme) => ({ ...theme.typography?.subMenuCaption })}
                                    display="block"
                                    gutterBottom
                                >
                                    {item.caption}
                                </Typography>
                            )}
                        </Typography>
                    )
                }
            >
                {items}
            </List>

            {/* group divider */}
            <Divider sx={{ mt: '2px', mb: '10px' }} />
        </React.Fragment>
    );
};

NavGroup.propTypes = {
    item: PropTypes.object
};

export default NavGroup;
