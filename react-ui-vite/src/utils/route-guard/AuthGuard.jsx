import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AuthGuard = () => {
    const { isLoggedIn } = useSelector((state) => state.account);
    return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AuthGuard;
