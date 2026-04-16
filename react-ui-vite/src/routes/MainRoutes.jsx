import React, { lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from './../layout/MainLayout';
import Loadable from '../ui-component/Loadable';
import AuthGuard from './../utils/route-guard/AuthGuard';

const DashboardDefault = Loadable(lazy(() => import('../views/dashboard/Default')));
const UtilsTypography = Loadable(lazy(() => import('../views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('../views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('../views/utilities/Shadow')));
const UtilsMaterialIcons = Loadable(lazy(() => import('../views/utilities/MaterialIcons')));
const UtilsTablerIcons = Loadable(lazy(() => import('../views/utilities/TablerIcons')));
const Programs = Loadable(lazy(() => import('../views/pages/school/Programs')));
const Periods = Loadable(lazy(() => import('../views/pages/school/Periods')));
const Subjects = Loadable(lazy(() => import('../views/pages/school/Subjects')));
const CriteriaList = Loadable(lazy(() => import('../views/pages/school/CriteriaList')));
const Courses = Loadable(lazy(() => import('../views/pages/school/Courses')));
const Weightings = Loadable(lazy(() => import('../views/pages/school/Weightings')));
const Enrollments = Loadable(lazy(() => import('../views/pages/school/Enrollments')));
const Grades = Loadable(lazy(() => import('../views/pages/school/Grades')));
const TaskGrading = Loadable(lazy(() => import('../views/pages/school/TaskGrading')));
const Projects = Loadable(lazy(() => import('../views/pages/school/Projects')));
const Publications = Loadable(lazy(() => import('../views/pages/extras/Publications')));
const SocialMediaConfig = Loadable(lazy(() => import('../views/pages/extras/SocialMediaConfig')));
const LandingPageConfig = Loadable(lazy(() => import('../views/pages/extras/LandingPageConfig')));
const UsersStudents = Loadable(lazy(() => import('../views/pages/users/Students')));
const UsersTeachers = Loadable(lazy(() => import('../views/pages/users/Teachers')));
const AccountSettings = Loadable(lazy(() => import('../views/pages/account/AccountSettings')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page')));
const GroupRegistration = Loadable(lazy(() => import('../views/pages/student/GroupRegistration')));
const StudentGroups = Loadable(lazy(() => import('../views/pages/student/StudentGroups')));

const ProtectedLayout = () => (
    <MainLayout>
        <Outlet />
    </MainLayout>
);

const MainRoutes = () => (
    <Routes>
        <Route element={<AuthGuard />}>
            <Route element={<ProtectedLayout />}>
                <Route path="/dashboard/default" element={<DashboardDefault />} />
                <Route path="/utils/util-typography" element={<UtilsTypography />} />
                <Route path="/utils/util-color" element={<UtilsColor />} />
                <Route path="/utils/util-shadow" element={<UtilsShadow />} />
                <Route path="/icons/tabler-icons" element={<UtilsTablerIcons />} />
                <Route path="/icons/material-icons" element={<UtilsMaterialIcons />} />
                <Route path="/school/programs" element={<Programs />} />
                <Route path="/school/periods" element={<Periods />} />
                <Route path="/school/subjects" element={<Subjects />} />
                <Route path="/school/criteria" element={<CriteriaList />} />
                <Route path="/school/courses" element={<Courses />} />
                <Route path="/school/weightings" element={<Weightings />} />
                <Route path="/school/enrollments" element={<Enrollments />} />
                <Route path="/school/grades" element={<Grades />} />
                <Route path="/extras/task-grading" element={<TaskGrading />} />
                <Route path="/extras/projects" element={<Projects />} />
                <Route path="/extras/publications" element={<Publications />} />
                <Route path="/extras/social-media" element={<SocialMediaConfig />} />
                <Route path="/extras/landing-config" element={<LandingPageConfig />} />
                <Route path="/users/students" element={<UsersStudents />} />
                <Route path="/users/teachers" element={<UsersTeachers />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/sample-page" element={<SamplePage />} />
                <Route path="/academic/register-group" element={<GroupRegistration />} />
                <Route path="/academic/my-groups" element={<StudentGroups />} />
            </Route>
        </Route>
    </Routes>
);

export default MainRoutes;
