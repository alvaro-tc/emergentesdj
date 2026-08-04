import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import accountReducer from './accountSlice';
import customizationReducer from './customizationSlice';
import periodReducer from './periodSlice';

const reducer = combineReducers({
    account: persistReducer(
        { key: 'account', storage, keyPrefix: 'berry-' },
        accountReducer
    ),
    customization: customizationReducer,
    // Sin persistir: el cambio temporal de periodo no debe sobrevivir a una recarga.
    period: periodReducer,
});

export default reducer;
