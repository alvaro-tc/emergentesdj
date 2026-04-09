import { IconBook, IconChartPie } from '@tabler/icons-react';

const icons = {
    IconBook,
    IconChartPie
};

export const academic = {
    id: 'academic',
    title: 'Gestión Académica',
    type: 'group',
    children: [
        {
            id: 'weightings',
            title: 'Ponderaciones',
            type: 'item',
            url: '/school/weightings',
            icon: icons.IconChartPie,
            breadcrumbs: false
        },
        {
            id: 'enrollments',
            title: 'Inscripciones',
            type: 'item',
            url: '/school/enrollments',
            icon: icons.IconBook,
            breadcrumbs: false
        },
        {
            id: 'grades',
            title: 'Calificaciones',
            type: 'item',
            url: '/school/grades',
            icon: icons.IconChartPie,
            breadcrumbs: false
        }
    ]
};
