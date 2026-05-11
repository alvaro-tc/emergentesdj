import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    token: '',
    isLoggedIn: false,
    isInitialized: false,
    user: null,
    activeCourse: null,
};

const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        accountInitialize: (state, action) => {
            const { isLoggedIn, user, token } = action.payload;
            state.isLoggedIn = isLoggedIn;
            state.isInitialized = true;
            state.token = token;
            state.user = user;
        },
        login: (state, action) => {
            state.isLoggedIn = true;
            state.user = action.payload.user;
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.token = '';
            state.user = null;
            state.activeCourse = null;
        },
        setActiveCourse: (state, action) => {
            state.activeCourse = action.payload;
        },
    },
});

export const { accountInitialize, login, logout, setActiveCourse } = accountSlice.actions;
export default accountSlice.reducer;
