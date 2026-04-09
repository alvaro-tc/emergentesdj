import { IconUser, IconUsers } from '@tabler/icons-react';

const icons = {
    IconUser,
    IconUsers
};

export const users = {
    id: 'users',
    title: 'Gestión Usuarios',
    type: 'group',
    children: [
        {
            id: 'students',
            title: 'Estudiantes',
            type: 'item',
            url: '/users/students',
            icon: icons.IconUser,
            breadcrumbs: false
        },
        {
            id: 'teachers',
            title: 'Docentes',
            type: 'item',
            url: '/users/teachers',
            icon: icons.IconUsers,
            breadcrumbs: false
        }
    ]
};
