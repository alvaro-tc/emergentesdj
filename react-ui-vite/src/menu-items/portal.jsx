import { IconFileText, IconShare, IconNews, IconMailbox } from '@tabler/icons-react';

const icons = {
    IconFileText,
    IconShare,
    IconNews,
    IconMailbox,
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
        },
        {
            id: 'messages',
            title: 'Mensajes',
            type: 'item',
            url: '/dashboard/messages',
            icon: icons.IconMailbox,
            breadcrumbs: false,
        }
    ]
};
