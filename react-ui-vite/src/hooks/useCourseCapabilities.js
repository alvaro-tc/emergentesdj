import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import configData from '../config';

// Caché por curso: el menú se vuelve a montar seguido y las capacidades cambian poco.
const cache = new Map();

/**
 * Capacidades del curso activo, en una sola petición, para alinear el menú.
 * Devuelve `null` mientras no hay curso o no se ha resuelto la consulta.
 */
const useCourseCapabilities = () => {
    const token = useSelector((state) => state.account.token);
    const courseId = useSelector((state) => state.account.activeCourse?.id);
    // `fetched` solo sirve para re-renderizar al llegar la respuesta; la verdad está en la caché.
    const [fetched, setFetched] = useState(null);

    useEffect(() => {
        if (!courseId || !token || cache.has(courseId)) return;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get(`${configData.API_SERVER}courses/${courseId}/capabilities/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                cache.set(courseId, data);
                if (!cancelled) setFetched(data);
            } catch {
                if (!cancelled) setFetched(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [courseId, token]);

    if (!courseId) return null;
    const cached = cache.get(courseId);
    return cached && cached.id === courseId ? cached : (fetched?.id === courseId ? fetched : null);
};

export default useCourseCapabilities;
