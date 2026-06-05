import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAccount, selectActiveCourse, selectUserRole } from '../../../../store/selectors';
import { Typography } from '@mui/material';
import axios from 'axios';

import NavGroup from './NavGroup';
import menuItem from './../../../../menu-items';
import { studentSettings } from './../../../../menu-items/student_settings';
import configData from '../../../../config';

import { IconUsers, IconUsersGroup } from '@tabler/icons-react';

// Dynamic academic section for students — checks open projects per active course
const StudentAcademicMenu = () => {
    const account = useSelector(selectAccount);
    const activeCourse = useSelector(selectActiveCourse);
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

// Injects dynamic unread count chip into the "messages" menu item
const useUnreadCount = (token) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        const fetch = async () => {
            try {
                const { data } = await axios.get(`${configData.API_SERVER}contact-messages/unread-count/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!cancelled) setCount(data.count ?? 0);
            } catch { /* silently ignore */ }
        };
        fetch();
        const interval = setInterval(fetch, 60000); // refresh every minute
        return () => { cancelled = true; clearInterval(interval); };
    }, [token]);

    return count;
};

//-----------------------|| SIDEBAR MENU LIST ||-----------------------//

const MenuList = () => {
    const account = useSelector(selectAccount);
    const userRole = useSelector(selectUserRole);
    const unreadCount = useUnreadCount(account.token);

    // Inject unread chip into administration group's "messages" item
    const enrichedItems = menuItem.items.map((group) => {
        if (group.id !== 'administration') return group;
        return {
            ...group,
            children: group.children.map((item) => {
                if (item.id !== 'messages' || unreadCount === 0) return item;
                return {
                    ...item,
                    chip: { color: 'error', variant: 'filled', size: 'small', label: String(unreadCount) },
                };
            }),
        };
    });

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

    return enrichedItems.map((item) => {
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

export default React.memo(MenuList);
