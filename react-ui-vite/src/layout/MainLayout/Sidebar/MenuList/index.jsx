import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import axios from 'axios';

import NavGroup from './NavGroup';
import menuItem from './../../../../menu-items';
import { studentSettings } from './../../../../menu-items/student_settings';
import configData from '../../../../config';

import { IconUsers, IconUsersGroup } from '@tabler/icons-react';

// Dynamic academic section for students — checks open projects per active course
const StudentAcademicMenu = () => {
    const account = useSelector((s) => s.account);
    const activeCourse = useSelector((s) => s.account.activeCourse);
    const [canRegister, setCanRegister] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            if (!activeCourse?.id || !account.token) {
                setCanRegister(false);
                return;
            }
            try {
                const { data } = await axios.get(
                    `${configData.API_SERVER}project-registration/available_projects/?course_id=${activeCourse.id}`,
                    { headers: { Authorization: `Bearer ${account.token}` } }
                );
                if (!cancelled) {
                    const openUnregistered = data.filter((p) => p.is_active_time && !p.already_registered);
                    setCanRegister(openUnregistered.length > 0);
                }
            } catch {
                if (!cancelled) setCanRegister(false);
            }
        };

        check();
        return () => { cancelled = true; };
    }, [activeCourse?.id, account.token]);

    const children = [];

    if (canRegister) {
        children.push({
            id: 'register-group',
            title: 'Registro Grupo',
            type: 'item',
            url: '/academic/register-group',
            icon: IconUsers,
            breadcrumbs: false,
        });
    }

    children.push({
        id: 'my-groups',
        title: 'Grupos',
        type: 'item',
        url: '/academic/my-groups',
        icon: IconUsersGroup,
        breadcrumbs: false,
    });

    const academicGroup = {
        id: 'academic',
        title: 'Académico',
        type: 'group',
        children,
    };

    return <NavGroup key="academic" item={academicGroup} />;
};

//-----------------------|| SIDEBAR MENU LIST ||-----------------------//

const MenuList = () => {
    const account = useSelector((state) => state.account);
    const userRole = account.user ? account.user.role : null;

    if (userRole === 'STUDENT') {
        const dashboardItem = menuItem.items.find((item) => item.id === 'dashboard');
        return (
            <>
                {dashboardItem && <NavGroup key={dashboardItem.id} item={dashboardItem} />}
                <StudentAcademicMenu />
                <NavGroup key={studentSettings.id} item={studentSettings} />
            </>
        );
    }

    if (userRole === 'TEACHER') {
        const teacherItems = menuItem.items.filter(
            (item) => item.id === 'dashboard' || item.id === 'school'
        );
        return teacherItems.map((item) => <NavGroup key={item.id} item={item} />);
    }

    return menuItem.items.map((item) => {
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
};

export default MenuList;
