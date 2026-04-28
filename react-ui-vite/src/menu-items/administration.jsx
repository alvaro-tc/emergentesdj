import { IconHistory, IconCertificate, IconBook, IconLayoutGrid, IconBriefcase, IconUserCheck, IconList, IconShieldCheck } from '@tabler/icons-react';

const icons = {
    IconHistory,
    IconCertificate,
    IconBook,
    IconLayoutGrid,
    IconBriefcase,
    IconUserCheck,
    IconList,
    IconShieldCheck
};

export const administration = {
    id: 'administration',
    title: 'Administracion',
    type: 'group',
    children: [
        {
            id: 'periods',
            title: 'Periodos',
            type: 'item',
            url: '/school/periods',
            icon: icons.IconHistory,
            breadcrumbs: false
        },
        {
            id: 'programs',
            title: 'Carreras',
            type: 'item',
            url: '/school/programs',
            icon: icons.IconCertificate,
            breadcrumbs: false
        },
        {
            id: 'subjects',
            title: 'Materias',
            type: 'item',
            url: '/school/subjects',
            icon: icons.IconBook,
            breadcrumbs: false
        },
        {
            id: 'courses',
            title: 'Paralelos',
            type: 'item',
            url: '/school/courses',
            icon: icons.IconLayoutGrid,
            breadcrumbs: false
        },
        {
            id: 'teachers',
            title: 'Docentes',
            type: 'item',
            url: '/users/teachers',
            icon: icons.IconBriefcase,
            breadcrumbs: false
        },
        {
            id: 'students',
            title: 'Estudiantes',
            type: 'item',
            url: '/users/students',
            icon: icons.IconUserCheck,
            breadcrumbs: false
        },
        {
            id: 'criteria',
            title: 'Etapas',
            type: 'item',
            url: '/school/criteria',
            icon: icons.IconList,
            breadcrumbs: false
        },
        {
            id: 'audit-log',
            title: 'Auditoría',
            type: 'item',
            url: '/admin/audit-log',
            icon: icons.IconShieldCheck,
            breadcrumbs: false
        }
    ]
};
