import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { Collapse, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

// project imports
import NavItem from './../NavItem';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

//-----------------------|| SIDEBAR MENU LIST COLLAPSE ITEMS ||-----------------------//

const NavCollapse = ({ menu, level }) => {
    const customization = useSelector((state) => state.customization);

    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState(null);

    const handleClick = () => {
        setOpen(!open);
        setSelected(!selected ? menu.id : null);
    };

    // menu collapse & item
    const menus = menu.children.map((item) => {
        switch (item.type) {
            case 'collapse':
                return <NavCollapse key={item.id} menu={item} level={level + 1} />;
            case 'item':
                return <NavItem key={item.id} item={item} level={level + 1} />;
            default:
                return (
                    <Typography key={item.id} variant="h6" color="error" align="center">
                        Menu Items Error
                    </Typography>
                );
        }
    });

    const Icon = menu.icon;
    const menuIcon = menu.icon ? (
        <Icon stroke={1.5} size="1.3rem" />
    ) : (
        <FiberManualRecordIcon
            sx={{ width: selected === menu.id ? 8 : 6, height: selected === menu.id ? 8 : 6 }}
            fontSize={level > 0 ? 'inherit' : 'default'}
        />
    );

    return (
        <React.Fragment>
            <ListItemButton
                sx={{
                    borderRadius: `${customization.borderRadius}px`,
                    mb: '5px',
                    alignItems: 'flex-start',
                    backgroundColor: level > 1 ? 'transparent !important' : undefined,
                    py: level > 1 ? 1 : undefined,
                    pl: `${level * 23}px`,
                }}
                selected={selected === menu.id}
                onClick={handleClick}
            >
                <ListItemIcon
                    sx={{
                        minWidth: menu.icon ? undefined : '18px',
                        mt: 'auto',
                        mb: 'auto',
                    }}
                >
                    {menuIcon}
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Typography variant={selected === menu.id ? 'h5' : 'body1'} color="inherit">
                            {menu.title}
                        </Typography>
                    }
                    secondary={
                        menu.caption && (
                            <Typography variant="caption" display="block" gutterBottom>
                                {menu.caption}
                            </Typography>
                        )
                    }
                />
                {open ? (
                    <IconChevronUp stroke={1.5} size="1rem" />
                ) : (
                    <IconChevronDown stroke={1.5} size="1rem" />
                )}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List
                    component="div"
                    disablePadding
                    sx={{
                        position: 'relative',
                        '&:after': {
                            content: "''",
                            position: 'absolute',
                            left: '32px',
                            top: 0,
                            height: '100%',
                            width: '1px',
                            opacity: 1,
                            bgcolor: 'primary.light',
                        },
                    }}
                >
                    {menus}
                </List>
            </Collapse>
        </React.Fragment>
    );
};

NavCollapse.propTypes = {
    menu: PropTypes.object,
    level: PropTypes.number
};

export default NavCollapse;
