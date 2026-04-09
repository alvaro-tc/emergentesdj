import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import config from '../../config';

const GuestGuard = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.account);
    if (isLoggedIn) return <Navigate to={config.defaultPath} replace />;
    return children;
};

GuestGuard.propTypes = { children: PropTypes.node };
export default GuestGuard;
