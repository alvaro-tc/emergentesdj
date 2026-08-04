import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import configData from '../config';
import {
    setActivePeriod,
    setViewingPeriod,
    resetToActivePeriod,
    setPeriodLoading
} from '../store/periodSlice';

/** Lista de periodos; requiere sesión iniciada. */
const requestPeriods = async (token) => {
    if (!token) return null;
    try {
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        const { data } = await axios.get(`${configData.API_SERVER}periods`);
        return data;
    } catch (error) {
        console.error('Error fetching periods', error);
        return null;
    }
};

/**
 * Parámetros de periodo para las peticiones (solo lectura del store).
 * Devuelve `{ period_id }` únicamente cuando un administrador está revisando
 * temporalmente un periodo distinto al activo; en cualquier otro caso `{}`,
 * de modo que la respuesta corresponde al periodo activo.
 */
export const usePeriodParams = () => {
    const viewingPeriodId = useSelector((state) => state.period.viewingPeriod?.id);
    return useMemo(() => (viewingPeriodId ? { period_id: viewingPeriodId } : {}), [viewingPeriodId]);
};

/**
 * Contexto de periodo del panel de administración.
 *
 * - `activePeriod`: periodo activo del sistema; es el único que ve el landing page.
 * - `contextPeriod`: periodo con el que se está trabajando (temporal o activo).
 * - `periodParams`: parámetros a enviar al backend; incluye `period_id` solo cuando
 *   se está revisando temporalmente otro periodo.
 */
const usePeriodContext = ({ loadPeriods = false } = {}) => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.account.token);
    const activePeriod = useSelector((state) => state.period.activePeriod);
    const viewingPeriod = useSelector((state) => state.period.viewingPeriod);
    const loading = useSelector((state) => state.period.loading);
    const [periods, setPeriods] = useState([]);

    const fetchActivePeriod = useCallback(async () => {
        dispatch(setPeriodLoading(true));
        try {
            const { data } = await axios.get(`${configData.API_SERVER}periods/current/`);
            dispatch(setActivePeriod(data || null));
            return data || null;
        } catch (error) {
            console.error('Error fetching active period', error);
            dispatch(setPeriodLoading(false));
            return null;
        }
    }, [dispatch]);

    const fetchPeriods = useCallback(async () => {
        const data = await requestPeriods(token);
        if (data) setPeriods(data);
    }, [token]);

    useEffect(() => {
        fetchActivePeriod();
    }, [fetchActivePeriod]);

    useEffect(() => {
        if (!loadPeriods) return;
        let cancelled = false;
        (async () => {
            const data = await requestPeriods(token);
            if (!cancelled && data) setPeriods(data);
        })();
        return () => {
            cancelled = true;
        };
    }, [loadPeriods, token]);

    const contextPeriod = viewingPeriod || activePeriod;

    const periodParams = useMemo(
        () => (viewingPeriod ? { period_id: viewingPeriod.id } : {}),
        [viewingPeriod]
    );

    const changeViewingPeriod = useCallback(
        (period) => dispatch(setViewingPeriod(period || null)),
        [dispatch]
    );

    const backToActivePeriod = useCallback(() => dispatch(resetToActivePeriod()), [dispatch]);

    return {
        activePeriod,
        viewingPeriod,
        contextPeriod,
        isTemporary: Boolean(viewingPeriod),
        periods,
        loading,
        periodParams,
        changeViewingPeriod,
        backToActivePeriod,
        refreshActivePeriod: fetchActivePeriod,
        refreshPeriods: fetchPeriods
    };
};

export default usePeriodContext;
