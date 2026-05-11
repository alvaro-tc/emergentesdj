import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import accountReducer from './accountSlice';
import customizationReducer from './customizationSlice';

const reducer = combineReducers({
    account: persistReducer(
        { key: 'account', storage, keyPrefix: 'berry-' },
        accountReducer
    ),
    customization: customizationReducer,
});

export default reducer;
