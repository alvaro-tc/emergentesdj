import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MinimalLayout from './../layout/MinimalLayout';
import Loadable from '../ui-component/Loadable';

const LandingPage = Loadable(lazy(() => import('../views/pages/landing/LandingPage')));
const PublicCourses = Loadable(lazy(() => import('../views/pages/landing/PublicCourses')));
const AboutPage = Loadable(lazy(() => import('../views/pages/landing/AboutPage')));
const PublicPublications = Loadable(lazy(() => import('../views/pages/landing/PublicPublications')));
const PublicProjects = Loadable(lazy(() => import('../views/pages/landing/PublicProjects')));
const StudentCourseRegistration = Loadable(lazy(() => import('../views/pages/school/StudentCourseRegistration')));
const StudentProjectRegistration = Loadable(lazy(() => import('../views/pages/school/StudentProjectRegistration')));

const LandingRoutes = () => (
    <Routes>
        <Route path="/" element={<MinimalLayout><LandingPage /></MinimalLayout>} />
        <Route path="/courses" element={<MinimalLayout><PublicCourses /></MinimalLayout>} />
        <Route path="/about" element={<MinimalLayout><AboutPage /></MinimalLayout>} />
        <Route path="/publications" element={<MinimalLayout><PublicPublications /></MinimalLayout>} />
        <Route path="/projects" element={<MinimalLayout><PublicProjects /></MinimalLayout>} />
        <Route path="/extras/course-registration" element={<MinimalLayout><StudentCourseRegistration /></MinimalLayout>} />
        <Route path="/project-registration" element={<MinimalLayout><StudentProjectRegistration /></MinimalLayout>} />
    </Routes>
);

export default LandingRoutes;
