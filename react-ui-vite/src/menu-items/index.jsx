import { dashboard } from './dashboard';
import { utilities } from './utilities';
import { other } from './other';
import { school } from './school';
// import { academic } from './academic'; // Unused now
// import { users } from './users'; // Unused now
import { extras } from './extras';
import { portal } from './portal';
import { administration } from './administration';

//-----------------------|| MENU ITEMS ||-----------------------//

const menuItems = {
    items: [dashboard, school, portal, administration, extras, utilities, other]
};

export default menuItems;
