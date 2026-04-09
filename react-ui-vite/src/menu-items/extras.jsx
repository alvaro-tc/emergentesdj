import { IconUserPlus, IconId } from '@tabler/icons-react';

const icons = {
    IconUserPlus,
    IconId
};

export const extras = {
    id: 'extras',
    title: 'Extras',
    type: 'group',
    children: [
        {
            id: 'project-registration',
            title: 'Inscripción Proy.',
            type: 'item',
            url: '/project-registration',
            icon: icons.IconUserPlus,
            breadcrumbs: false
        },
        {
            id: 'course-registration',
            title: 'Inscripción Est.',
            type: 'item',
            url: '/extras/course-registration',
            icon: icons.IconId,
            breadcrumbs: false
        }
    ]
};
