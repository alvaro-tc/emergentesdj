import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import config from '../../../config';
import { usePresentationDeck } from './presentation/usePresentationDeck';

const messageStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    fontSize: '1.1rem'
};

const PresentationViewer = () => {
    const { id } = useParams();
    const token = useSelector((state) => state.account.token);
    const [presentation, setPresentation] = useState(null);
    const [error, setError] = useState(null);

    const { deckRef, palette, togglePalette } = usePresentationDeck(presentation);

    // Nueva pestaña: axios arranca limpio, hay que fijar el header a mano.
    useEffect(() => {
        if (!token) return;
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        axios
            .get(`${config.API_SERVER}presentations/${id}/`)
            .then((res) => setPresentation(res.data))
            .catch(() => setError('No se pudo cargar la presentación.'));
    }, [id, token]);

    if (error) {
        return <div style={{ ...messageStyle, background: '#1c1e21', color: '#fff' }}>{error}</div>;
    }

    if (!presentation) {
        return (
            <div style={{ ...messageStyle, background: '#1c1e21', color: '#8a9199' }}>
                Cargando presentación…
            </div>
        );
    }

    return (
        <div
            ref={deckRef}
            className="reveal"
            style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
        >
            <div className="slides" />
            <button
                type="button"
                onClick={togglePalette}
                title="Alternar tema claro/oscuro (T)"
                aria-label="Alternar tema claro u oscuro"
                style={{
                    position: 'fixed',
                    top: 12,
                    right: 12,
                    zIndex: 10000,
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: '1px solid rgba(127,127,127,0.35)',
                    background: 'transparent',
                    color: 'var(--q-muted)',
                    cursor: 'pointer',
                    fontSize: 15,
                    lineHeight: 1
                }}
            >
                {palette === 'dark' ? '☀' : '☾'}
            </button>
        </div>
    );
};

export default PresentationViewer;
