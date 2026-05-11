import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import configData from '../config';

export const useGradesheet = (activeCourse, token) => {
    const [structure, setStructure] = useState([]);
    const [rows, setRows] = useState([]);
    const [allEnrollments, setAllEnrollments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(30);
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [criterionGradeVisibility, setCriterionGradeVisibility] = useState({});
    const debounceRef = useRef(null);

    const fetchGradesheet = useCallback((currentPage, currentPageSize, currentSearch) => {
        if (!activeCourse) return;
        const p = currentPage !== undefined ? currentPage : page;
        const ps = currentPageSize !== undefined ? currentPageSize : pageSize;
        const s = currentSearch !== undefined ? currentSearch : searchQuery;
        setLoading(true);
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        const params = new URLSearchParams({ course_id: activeCourse.id, page: p + 1, page_size: ps });
        if (s) params.set('search', s);
        axios.get(`${configData.API_SERVER}criterion-scores/gradesheet/?${params}`)
            .then(response => {
                const newStructure = response.data.structure || [];
                setStructure(newStructure);
                setRows(response.data.rows || []);
                setTotalCount(response.data.pagination?.total_count ?? 0);
                setCriterionGradeVisibility(prev => {
                    const next = { ...prev };
                    newStructure.forEach(g => { if (next[g.id] === undefined) next[g.id] = true; });
                    return next;
                });
            })
            .catch(err => { throw err; })
            .finally(() => setLoading(false));
    }, [activeCourse, token, page, pageSize, searchQuery]);

    const loadProjects = useCallback(() => {
        if (!activeCourse) return;
        axios.get(`${configData.API_SERVER}projects/?course=${activeCourse.id}`)
            .then(res => setProjects(res.data))
            .catch(err => console.error(err));
    }, [activeCourse]);

    const loadAllEnrollments = useCallback(() => {
        if (!activeCourse) return;
        axios.get(`${configData.API_SERVER}enrollments/?course=${activeCourse.id}`)
            .then(res => setAllEnrollments(res.data.results || res.data || []))
            .catch(err => console.error(err));
    }, [activeCourse]);

    const handleSearchChange = useCallback((e) => {
        const val = e.target.value;
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
            setSearchQuery(val);
        }, 400);
    }, []);

    const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);
    const handlePageSizeChange = useCallback((e) => {
        setPageSize(parseInt(e.target.value, 10));
        setPage(0);
    }, []);

    useEffect(() => {
        if (activeCourse) {
            setPage(0);
            setSearch('');
            setSearchQuery('');
            loadProjects();
            loadAllEnrollments();
        }
    }, [activeCourse?.id]);

    useEffect(() => {
        if (activeCourse) fetchGradesheet(page, pageSize, searchQuery);
    }, [activeCourse?.id, page, pageSize, searchQuery]);

    return {
        structure, rows, allEnrollments, projects,
        loading, totalCount, page, pageSize, search,
        criterionGradeVisibility, setCriterionGradeVisibility,
        fetchGradesheet, loadProjects,
        handleSearchChange, handlePageChange, handlePageSizeChange,
        setRows,
    };
};
