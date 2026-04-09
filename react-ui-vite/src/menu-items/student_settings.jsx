// assets
import { IconSettings } from '@tabler/icons-react';

// constant
const icons = {
    IconSettings
};

//-----------------------|| STUDENT SETTINGS MENU ITEMS ||-----------------------//

export const studentSettings = {
    id: 'student-settings',
    title: 'Configuración',
    type: 'group',
    children: [
        {
            id: 'account-settings',
            title: 'Mi Cuenta',
            type: 'item',
            url: '/account-settings',
            icon: icons.IconSettings,
            breadcrumbs: false
        }
    ]
};
