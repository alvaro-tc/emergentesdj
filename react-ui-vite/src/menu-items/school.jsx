import { IconUserPlus, IconPencil, IconListCheck, IconBulb, IconList, IconScale, IconPresentation } from '@tabler/icons-react';

const icons = {
    IconUserPlus,
    IconPencil,
    IconListCheck,
    IconBulb,
    IconList,
    IconScale,
    IconPresentation
};

export const school = {
    id: 'school',
    title: 'Academico',
    type: 'group',
    children: [
        {
            id: 'grades',
            title: 'Llenado de Notas',
            type: 'item',
            url: '/school/grades',
            icon: icons.IconPencil,
            breadcrumbs: false
        },
        {
            id: 'task-grading',
            title: 'Control actividades',
            type: 'item',
            url: '/extras/task-grading',
            icon: icons.IconListCheck,
            breadcrumbs: false
        },
        {
            id: 'projects',
            title: 'Proyectos',
            type: 'item',
            url: '/extras/projects',
            icon: icons.IconBulb,
            breadcrumbs: false
        },
        {
            id: 'presentations',
            title: 'Presentaciones',
            type: 'item',
            url: '/dashboard/presentations',
            icon: icons.IconPresentation,
            breadcrumbs: false
        },
        {
            id: 'weightings',
            title: 'Ponderaciones',
            type: 'item',
            url: '/school/weightings',
            icon: icons.IconScale,
            breadcrumbs: false
        },
        {
            id: 'enrollments',
            title: 'Inscripciones',
            type: 'item',
            url: '/school/enrollments',
            icon: icons.IconUserPlus,
            breadcrumbs: false
        }
    ]
};
