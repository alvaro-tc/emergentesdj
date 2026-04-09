import { IconFileText, IconShare, IconNews } from '@tabler/icons-react';

const icons = {
    IconFileText,
    IconShare,
    IconNews
};

export const portal = {
    id: 'portal',
    title: 'Portal',
    type: 'group',
    children: [
        {
            id: 'blog',
            title: 'Blog',
            type: 'item',
            url: '/extras/blog',
            icon: icons.IconNews,
            breadcrumbs: false
        },
        {
            id: 'publications',
            title: 'Publicaciones',
            type: 'item',
            url: '/extras/publications',
            icon: icons.IconFileText,
            breadcrumbs: false
        },
        {
            id: 'social-media',
            title: 'Redes Sociales',
            type: 'item',
            url: '/extras/social-media',
            icon: icons.IconShare,
            breadcrumbs: false
        },
        {
            id: 'landing-config',
            title: 'Página Principal',
            type: 'item',
            url: '/extras/landing-config',
            icon: icons.IconFileText,
            breadcrumbs: false
        }
    ]
};
