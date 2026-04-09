import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import GuestGuard from './../utils/route-guard/GuestGuard';
import MinimalLayout from './../layout/MinimalLayout';
import NavMotion from './../layout/NavMotion';
import Loadable from '../ui-component/Loadable';

const AuthLogin = Loadable(lazy(() => import('../views/pages/authentication/login')));
const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));

const LoginRoutes = () => (
    <Routes>
        <Route path="/login" element={<MinimalLayout><NavMotion><GuestGuard><AuthLogin /></GuestGuard></NavMotion></MinimalLayout>} />
        <Route path="/register" element={<MinimalLayout><NavMotion><GuestGuard><AuthRegister /></GuestGuard></NavMotion></MinimalLayout>} />
    </Routes>
);

export default LoginRoutes;
