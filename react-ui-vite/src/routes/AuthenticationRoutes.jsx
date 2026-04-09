import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loadable from '../ui-component/Loadable';
import MinimalLayout from './../layout/MinimalLayout';

const AuthLogin3 = Loadable(lazy(() => import('../views/pages/authentication/authentication3/Login3')));
const AuthRegister3 = Loadable(lazy(() => import('../views/pages/authentication/authentication3/Register3')));

const AuthenticationRoutes = () => (
    <Routes>
        <Route path="/pages/login/login3" element={<MinimalLayout><AuthLogin3 /></MinimalLayout>} />
        <Route path="/pages/register/register3" element={<MinimalLayout><AuthRegister3 /></MinimalLayout>} />
    </Routes>
);

export default AuthenticationRoutes;
