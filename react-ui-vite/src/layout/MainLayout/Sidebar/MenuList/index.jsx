import React from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { Typography } from '@mui/material';

// project imports
import NavGroup from './NavGroup';
import menuItem from './../../../../menu-items';
import { studentSettings } from './../../../../menu-items/student_settings'; // Import student settings

//-----------------------|| SIDEBAR MENU LIST ||-----------------------//

const MenuList = () => {
    const account = useSelector((state) => state.account);
    const userRole = account.user ? account.user.role : null;

    if (userRole === 'STUDENT') {
        const dashboardItem = menuItem.items.find(item => item.id === 'dashboard');
        return (
            <>
                {dashboardItem && <NavGroup key={dashboardItem.id} item={dashboardItem} />}
                <NavGroup key={studentSettings.id} item={studentSettings} />
            </>
        );
    }

    if (userRole === 'TEACHER') {
        const teacherItems = menuItem.items.filter(item => item.id === 'dashboard' || item.id === 'school');
        return teacherItems.map((item) => <NavGroup key={item.id} item={item} />);
    }

    const navItems = menuItem.items.map((item) => {
        switch (item.type) {
            case 'group':
                return <NavGroup key={item.id} item={item} />;
            default:
                return (
                    <Typography key={item.id} variant="h6" color="error" align="center">
                        Menu Items Error
                    </Typography>
                );
        }
    });

    return navItems;
};

export default MenuList;
