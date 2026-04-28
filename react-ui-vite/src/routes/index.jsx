import React, { lazy } from 'react';
import { useRoutes, Navigate, Outlet } from 'react-router-dom';

// guards & layouts
import AuthGuard from '../utils/route-guard/AuthGuard';
import GuestGuard from '../utils/route-guard/GuestGuard';
import MainLayout from '../layout/MainLayout';
import MinimalLayout from '../layout/MinimalLayout';
import LandingLayout from '../layout/LandingLayout';
import NavMotion from '../layout/NavMotion';
import Loadable from '../ui-component/Loadable';

// ── Landing ──────────────────────────────────────────────────────────────────
const LandingPage                = Loadable(lazy(() => import('../views/pages/landing/LandingPage')));
const PublicCourses              = Loadable(lazy(() => import('../views/pages/landing/PublicCourses')));
const AboutPage                  = Loadable(lazy(() => import('../views/pages/landing/AboutPage')));
const PublicPublications         = Loadable(lazy(() => import('../views/pages/landing/PublicPublications')));
const PublicProjects             = Loadable(lazy(() => import('../views/pages/landing/PublicProjects')));
const PublicBlog                 = Loadable(lazy(() => import('../views/pages/landing/PublicBlog')));
const PublicBlogPost             = Loadable(lazy(() => import('../views/pages/landing/PublicBlogPost')));
const StudentCourseRegistration  = Loadable(lazy(() => import('../views/pages/school/StudentCourseRegistration')));
const StudentProjectRegistration = Loadable(lazy(() => import('../views/pages/school/StudentProjectRegistration')));

// ── Auth pages (no guard) ─────────────────────────────────────────────────────
const AuthLogin3    = Loadable(lazy(() => import('../views/pages/authentication/authentication3/Login3')));
const AuthRegister3 = Loadable(lazy(() => import('../views/pages/authentication/authentication3/Register3')));

// ── Login / Register (guest guard) ───────────────────────────────────────────
const AuthLogin    = Loadable(lazy(() => import('../views/pages/authentication/login')));
const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));

// ── Protected pages ───────────────────────────────────────────────────────────
const DashboardDefault  = Loadable(lazy(() => import('../views/dashboard/Default')));
const UtilsTypography   = Loadable(lazy(() => import('../views/utilities/Typography')));
const UtilsColor        = Loadable(lazy(() => import('../views/utilities/Color')));
const UtilsShadow       = Loadable(lazy(() => import('../views/utilities/Shadow')));
const UtilsMaterialIcons = Loadable(lazy(() => import('../views/utilities/MaterialIcons')));
const UtilsTablerIcons  = Loadable(lazy(() => import('../views/utilities/TablerIcons')));
const Programs          = Loadable(lazy(() => import('../views/pages/school/Programs')));
const Periods           = Loadable(lazy(() => import('../views/pages/school/Periods')));
const Subjects          = Loadable(lazy(() => import('../views/pages/school/Subjects')));
const CriteriaList      = Loadable(lazy(() => import('../views/pages/school/CriteriaList')));
const Courses           = Loadable(lazy(() => import('../views/pages/school/Courses')));
const Weightings        = Loadable(lazy(() => import('../views/pages/school/Weightings')));
const Enrollments       = Loadable(lazy(() => import('../views/pages/school/Enrollments')));
const Grades            = Loadable(lazy(() => import('../views/pages/school/Grades')));
const TaskGrading       = Loadable(lazy(() => import('../views/pages/school/TaskGrading')));
const Projects          = Loadable(lazy(() => import('../views/pages/school/Projects')));
const Publications      = Loadable(lazy(() => import('../views/pages/extras/Publications')));
const SocialMediaConfig = Loadable(lazy(() => import('../views/pages/extras/SocialMediaConfig')));
const LandingPageConfig = Loadable(lazy(() => import('../views/pages/extras/LandingPageConfig')));
const BlogManagement    = Loadable(lazy(() => import('../views/pages/extras/BlogManagement')));
const UsersStudents     = Loadable(lazy(() => import('../views/pages/users/Students')));
const UsersTeachers     = Loadable(lazy(() => import('../views/pages/users/Teachers')));
const AccountSettings   = Loadable(lazy(() => import('../views/pages/account/AccountSettings')));
const SamplePage        = Loadable(lazy(() => import('../views/sample-page')));
const GroupRegistration      = Loadable(lazy(() => import('../views/pages/student/GroupRegistration')));
const StudentGroups          = Loadable(lazy(() => import('../views/pages/student/StudentGroups')));
const Presentations          = Loadable(lazy(() => import('../views/pages/school/Presentations')));
const PresentationForm       = Loadable(lazy(() => import('../views/pages/school/PresentationForm')));
const PresentationViewer     = Loadable(lazy(() => import('../views/pages/school/PresentationViewer')));
const AuditLogPanel          = Loadable(lazy(() => import('../views/pages/audit/AuditLogPanel')));

// Layout wrappers
const ProtectedLayout = () => (
    <MainLayout>
        <Outlet />
    </MainLayout>
);

const GuestLayout = () => (
    <MinimalLayout>
        <NavMotion>
            <GuestGuard>
                <Outlet />
            </GuestGuard>
        </NavMotion>
    </MinimalLayout>
);

//-----------------------|| ROUTING RENDER ||-----------------------//

const Routes = () =>
    useRoutes([
        // ── Public / Landing (shared layout: header+footer persist across navigation)
        {
            element: <LandingLayout />,
            children: [
                { path: '/',              element: <LandingPage /> },
                { path: '/courses',       element: <PublicCourses /> },
                { path: '/about',         element: <AboutPage /> },
                { path: '/publications',  element: <PublicPublications /> },
                { path: '/projects',      element: <PublicProjects /> },
                { path: '/blog',          element: <PublicBlog /> },
                { path: '/blog/:slug',    element: <PublicBlogPost /> },
                { path: '/extras/course-registration', element: <StudentCourseRegistration /> },
                { path: '/project-registration',       element: <StudentProjectRegistration /> },
            ],
        },

        // ── Auth pages (no guard needed) ─────────────────────────────────────
        { path: '/pages/login/login3',       element: <MinimalLayout><AuthLogin3 /></MinimalLayout> },
        { path: '/pages/register/register3', element: <MinimalLayout><AuthRegister3 /></MinimalLayout> },

        // ── Guest-guarded (redirect to dashboard if already logged in) ────────
        {
            element: <GuestLayout />,
            children: [
                { path: '/login',    element: <AuthLogin /> },
                { path: '/register', element: <AuthRegister /> },
            ],
        },

        // ── Protected (redirect to /login if not authenticated) ───────────────
        {
            element: <AuthGuard />,
            children: [
                // Fullscreen viewer — auth required but no dashboard layout
                { path: '/present/:id', element: <PresentationViewer /> },
            {
                element: <ProtectedLayout />,
                children: [
                    { path: '/dashboard/default',     element: <DashboardDefault /> },
                    { path: '/utils/util-typography', element: <UtilsTypography /> },
                    { path: '/utils/util-color',      element: <UtilsColor /> },
                    { path: '/utils/util-shadow',     element: <UtilsShadow /> },
                    { path: '/icons/tabler-icons',    element: <UtilsTablerIcons /> },
                    { path: '/icons/material-icons',  element: <UtilsMaterialIcons /> },
                    { path: '/school/programs',       element: <Programs /> },
                    { path: '/school/periods',        element: <Periods /> },
                    { path: '/school/subjects',       element: <Subjects /> },
                    { path: '/school/criteria',       element: <CriteriaList /> },
                    { path: '/school/courses',        element: <Courses /> },
                    { path: '/school/weightings',     element: <Weightings /> },
                    { path: '/school/enrollments',    element: <Enrollments /> },
                    { path: '/school/grades',         element: <Grades /> },
                    { path: '/extras/task-grading',   element: <TaskGrading /> },
                    { path: '/extras/projects',       element: <Projects /> },
                    { path: '/extras/publications',   element: <Publications /> },
                    { path: '/extras/social-media',   element: <SocialMediaConfig /> },
                    { path: '/extras/landing-config', element: <LandingPageConfig /> },
                    { path: '/extras/blog',           element: <BlogManagement /> },
                    { path: '/users/students',        element: <UsersStudents /> },
                    { path: '/users/teachers',        element: <UsersTeachers /> },
                    { path: '/account-settings',      element: <AccountSettings /> },
                    { path: '/sample-page',           element: <SamplePage /> },
                    { path: '/academic/register-group',          element: <GroupRegistration /> },
                    { path: '/academic/my-groups',               element: <StudentGroups /> },
                    { path: '/dashboard/presentations',          element: <Presentations /> },
                    { path: '/dashboard/presentations/new',      element: <PresentationForm /> },
                    { path: '/dashboard/presentations/:id/edit', element: <PresentationForm /> },
                    { path: '/admin/audit-log',                  element: <AuditLogPanel /> },
                ],
            }],
        },

        // ── Catch-all ─────────────────────────────────────────────────────────
        { path: '*', element: <Navigate to="/" replace /> },
    ]);

export default Routes;
