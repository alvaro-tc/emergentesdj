import { createSelector } from '@reduxjs/toolkit';

// ── Atomic selectors ─────────────────────────────────────────────────────────
// These return primitives or stable references — no memoization needed.

export const selectAccount = (state) => state.account;
export const selectToken = (state) => state.account.token;
export const selectUser = (state) => state.account.user;
export const selectActiveCourse = (state) => state.account.activeCourse;
export const selectActiveCourseId = (state) => state.account.activeCourse?.id;
export const selectIsLoggedIn = (state) => state.account.isLoggedIn;
export const selectIsInitialized = (state) => state.account.isInitialized;
export const selectUserRole = (state) => state.account.user?.role;

export const selectCustomization = (state) => state.customization;
export const selectSidebarOpen = (state) => state.customization.opened;
export const selectFontFamily = (state) => state.customization.fontFamily;
export const selectBorderRadius = (state) => state.customization.borderRadius;

// ── Derived selectors (memoized with createSelector) ─────────────────────────
// These compute derived data — memoized to prevent re-renders on unrelated updates.

export const selectIsTeacher = createSelector(
    selectUserRole,
    (role) => role === 'teacher'
);

export const selectIsStudent = createSelector(
    selectUserRole,
    (role) => role === 'student'
);

export const selectIsAdmin = createSelector(
    selectUserRole,
    (role) => role === 'admin'
);

export const selectActiveCourseTitle = createSelector(
    selectActiveCourse,
    (course) => course ? `${course.subject_details?.name ?? ''} (${course.parallel ?? ''})` : ''
);

export const selectActiveCourseSubjectName = createSelector(
    selectActiveCourse,
    (course) => course?.subject_details?.name ?? ''
);

export const selectMenuOpenIds = (state) => state.customization.isOpen;
