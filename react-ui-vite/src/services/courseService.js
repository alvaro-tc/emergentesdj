import axios from 'axios';
import configData from '../config';

const API = configData.API_SERVER;

// ── Courses ───────────────────────────────────────────────────────────────────

export const getCourses = (params, signal) =>
    axios.get(`${API}courses/`, { params, signal }).then(r => r.data);

export const getCourse = (id, signal) =>
    axios.get(`${API}courses/${id}/`, { signal }).then(r => r.data);

export const createCourse = (data) =>
    axios.post(`${API}courses/`, data).then(r => r.data);

export const updateCourse = (id, data) =>
    axios.put(`${API}courses/${id}/`, data).then(r => r.data);

export const patchCourse = (id, data) =>
    axios.patch(`${API}courses/${id}/`, data).then(r => r.data);

export const deleteCourse = (id) =>
    axios.delete(`${API}courses/${id}/`);

export const getCoursePreference = (courseId, signal) =>
    axios.get(`${API}courses/${courseId}/preference/`, { signal }).then(r => r.data);

export const setCoursePreference = (courseId, data) =>
    axios.post(`${API}courses/${courseId}/set_preference/`, data).then(r => r.data);

// ── Enrollments ───────────────────────────────────────────────────────────────

export const getEnrollments = (params, signal) =>
    axios.get(`${API}enrollments/`, { params, signal }).then(r => r.data);

export const createEnrollment = (data) =>
    axios.post(`${API}enrollments/`, data).then(r => r.data);

export const deleteEnrollment = (id) =>
    axios.delete(`${API}enrollments/${id}/`);

export const bulkDeleteEnrollments = (ids) =>
    axios.post(`${API}enrollments/bulk_delete/`, { ids }).then(r => r.data);

// ── Subjects ──────────────────────────────────────────────────────────────────

export const getSubjects = (params, signal) =>
    axios.get(`${API}subjects/`, { params, signal }).then(r => r.data);

export const createSubject = (data) =>
    axios.post(`${API}subjects/`, data).then(r => r.data);

export const updateSubject = (id, data) =>
    axios.put(`${API}subjects/${id}/`, data).then(r => r.data);

export const deleteSubject = (id) =>
    axios.delete(`${API}subjects/${id}/`);

// ── Periods ───────────────────────────────────────────────────────────────────

export const getPeriods = (signal) =>
    axios.get(`${API}periods/`, { signal }).then(r => r.data);

export const createPeriod = (data) =>
    axios.post(`${API}periods/`, data).then(r => r.data);

export const updatePeriod = (id, data) =>
    axios.put(`${API}periods/${id}/`, data).then(r => r.data);

export const deletePeriod = (id) =>
    axios.delete(`${API}periods/${id}/`);

// ── Users ─────────────────────────────────────────────────────────────────────

export const getProfile = (signal) =>
    axios.get(`${API}manage-users/profile/`, { signal }).then(r => r.data);

export const updateProfile = (data) =>
    axios.patch(`${API}manage-users/profile/`, data).then(r => r.data);

export const getUsers = (params, signal) =>
    axios.get(`${API}manage-users/`, { params, signal }).then(r => r.data);

// ── Task Scores ───────────────────────────────────────────────────────────────

export const getTaskSheet = (courseId, subCriterionId, signal) =>
    axios.get(`${API}task-scores/task_sheet/`, {
        params: { course_id: courseId, sub_criterion_id: subCriterionId },
        signal,
    }).then(r => r.data);

export const bulkSaveTaskScores = (updates) =>
    axios.post(`${API}task-scores/bulk_save/`, { updates }).then(r => r.data);
