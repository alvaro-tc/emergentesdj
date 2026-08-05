import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import configData from '../config';
import { setActiveCourse } from '../store/accountSlice';
import { setViewingPeriod, resetToActivePeriod } from '../store/periodSlice';

/**
 * Contexto de trabajo del panel: el curso seleccionado.
 *
 * El curso es la unidad de seguimiento (inscripciones, etapas, notas), y él
 * determina su periodo. Periodo y carrera existen aquí solo como filtros para
 * encontrar el curso, no como pasos previos obligatorios.
 */
const useCourseContext = () => {
    const dispatch = useDispatch();
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);
    const activePeriod = useSelector((state) => state.period.activePeriod);

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    // Carga de cursos + selección inicial (preferencia del perfil o primer curso vigente).
    useEffect(() => {
        if (!account.token) return;
        let cancelled = false;
        setLoading(true);
        axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
        axios
            .get(configData.API_SERVER + 'courses')
            .then(({ data }) => {
                if (cancelled) return;
                setCourses(data);
                if (activeCourse) {
                    // El curso activo se persiste en el navegador: hay que refrescarlo
                    // para que no quede con datos obsoletos del servidor.
                    const fresh = data.find((c) => c.id === activeCourse.id);
                    if (fresh) dispatch(setActiveCourse(fresh));
                } else if (data.length > 0) {
                    const preferred = account.user?.active_course
                        ? data.find((c) => c.id === account.user.active_course)
                        : null;
                    const fallback = data.find((c) => !c.subject_details?.archived) || data[0];
                    dispatch(setActiveCourse(preferred || fallback));
                }
            })
            .catch((error) => console.error('Error fetching courses', error))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account.token, account.user]);

    const programs = useMemo(
        () => [...new Map(courses.map((c) => [c.subject_details?.program_details?.id, c.subject_details?.program_details]))
            .values()].filter(Boolean),
        [courses]
    );

    const filteredCourses = useMemo(() => {
        const term = search.trim().toLowerCase();
        return courses.filter((course) => {
            const subject = course.subject_details;
            const haystack = `${subject?.name || ''} ${subject?.code || ''} ${course.parallel || ''}`.toLowerCase();
            const matchesSearch = !term || haystack.includes(term);
            const matchesPeriod = !filterPeriod || course.period === filterPeriod;
            const matchesProgram = !filterProgram || subject?.program_details?.id === filterProgram;
            const matchesArchived = showArchived || !subject?.archived;
            return matchesSearch && matchesPeriod && matchesProgram && matchesArchived;
        });
    }, [courses, search, filterPeriod, filterProgram, showArchived]);

    const selectCourse = useCallback(
        (course) => {
            dispatch(setActiveCourse(course));
            if (account.token) {
                axios
                    .patch(configData.API_SERVER + 'manage-users/profile/', { active_course: course.id })
                    .catch((error) => console.error('Error saving active course preference', error));
            }
        },
        [account.token, dispatch]
    );

    /**
     * El filtro de periodo hace las veces de revisión temporal: al elegir un periodo
     * distinto del activo, el landing se previsualiza con ese periodo (solo admins).
     */
    const changeFilterPeriod = useCallback(
        (periodId, period) => {
            setFilterPeriod(periodId);
            if (!periodId || (activePeriod && periodId === activePeriod.id)) {
                dispatch(resetToActivePeriod());
            } else {
                dispatch(setViewingPeriod(period));
            }
        },
        [activePeriod, dispatch]
    );

    return {
        activeCourse,
        courses,
        filteredCourses,
        programs,
        loading,
        search,
        setSearch,
        filterPeriod,
        changeFilterPeriod,
        filterProgram,
        setFilterProgram,
        showArchived,
        setShowArchived,
        selectCourse
    };
};

export default useCourseContext;
