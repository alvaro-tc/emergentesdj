import { useState, useCallback } from 'react';

/**
 * Standardizes client-side pagination + search state.
 * Matches the MUI TablePagination event signatures used across admin views.
 *
 * Usage:
 *   const { page, rowsPerPage, search, handleChangePage, handleChangeRowsPerPage, handleSearch } = usePaginationAndFilter();
 *   const visible = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
 */
export const usePaginationAndFilter = ({ initialPageSize = 10, initialSearch = '' } = {}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
    const [search, setSearch] = useState(initialSearch);

    const handleChangePage = useCallback((_, newPage) => setPage(newPage), []);

    const handleChangeRowsPerPage = useCallback((e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    }, []);

    const handleSearch = useCallback((e) => {
        setSearch(e.target.value);
        setPage(0);
    }, []);

    const resetPagination = useCallback(() => setPage(0), []);

    return {
        page,
        rowsPerPage,
        search,
        setSearch,
        setPage,
        handleChangePage,
        handleChangeRowsPerPage,
        handleSearch,
        resetPagination,
    };
};
