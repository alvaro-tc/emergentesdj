import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import config from '../../../config';
import Reveal from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown';
import 'reveal.js/reveal.css';

// Theme CSS URLs via Vite's ?url import (bundled as static assets)
import blackUrl    from 'reveal.js/theme/black.css?url';
import skyUrl      from 'reveal.js/theme/sky.css?url';
import beigeUrl    from 'reveal.js/theme/beige.css?url';
import moonUrl     from 'reveal.js/theme/moon.css?url';
import whiteUrl    from 'reveal.js/theme/white.css?url';
import draculaUrl  from 'reveal.js/theme/dracula.css?url';

const THEME_CSS = {
    default:   blackUrl,
    ocean:     skyUrl,
    forest:    beigeUrl,
    sunset:    moonUrl,
    corporate: whiteUrl,
    neon:      draculaUrl,
};

const escapeHtml = (str) => {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const PresentationViewer = () => {
    const { id } = useParams();
    const token = useSelector((state) => state.account.token);
    const deckRef = useRef(null);
    const revealInstanceRef = useRef(null);
    const [presentation, setPresentation] = useState(null);
    const [error, setError] = useState(null);

    // 1. Fetch presentation data — set auth header explicitly (nueva pestaña = axios limpio)
    useEffect(() => {
        if (!token) return;
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        axios.get(`${config.API_SERVER}presentations/${id}/`)
            .then(res => setPresentation(res.data))
            .catch(() => setError('No se pudo cargar la presentación.'));
    }, [id, token]);

    // 2. Build slides and initialize Reveal once data is ready
    useEffect(() => {
        if (!presentation || !deckRef.current) return;

        // Inject theme CSS dynamically
        const prevLink = document.getElementById('reveal-theme-dynamic');
        if (prevLink) prevLink.remove();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.id = 'reveal-theme-dynamic';
        link.href = THEME_CSS[presentation.theme] || THEME_CSS.default;
        document.head.appendChild(link);

        // Build slides HTML
        const contentSlides = (presentation.content || '')
            .split(/\n---\n|^---$/m)
            .map(s => s.trim())
            .filter(Boolean);

        const coverLogoHtml = presentation.logo_url
            ? `<img src="${escapeHtml(presentation.logo_url)}" alt="logo" style="max-height:140px;border:none;background:none;box-shadow:none;margin-bottom:16px;" /><br/>`
            : '';

        let slidesHtml = `
            <section>
                ${coverLogoHtml}
                <h1>${escapeHtml(presentation.title)}</h1>
                ${presentation.subtitle ? `<h3 style="opacity:0.75">${escapeHtml(presentation.subtitle)}</h3>` : ''}
            </section>
        `;

        contentSlides.forEach(slideContent => {
            slidesHtml += `
                <section data-markdown>
                    <textarea data-template>${slideContent}</textarea>
                </section>
            `;
        });

        // Set innerHTML on the .slides container
        const slidesEl = deckRef.current.querySelector('.slides');
        if (slidesEl) slidesEl.innerHTML = slidesHtml;

        // Destroy any previous instance before reinitializing
        if (revealInstanceRef.current) {
            try { revealInstanceRef.current.destroy(); } catch (_) {}
            revealInstanceRef.current = null;
        }

        const deck = new Reveal(deckRef.current, {
            plugins: [RevealMarkdown],
            hash: true,
            slideNumber: 'c/t',
            transition: 'slide',
            transitionSpeed: 'default',
            controls: true,
            progress: true,
            center: true,
            embedded: false,
            width: '100%',
            height: '100%',
            margin: 0.04,
        });

        deck.initialize().then(() => {
            revealInstanceRef.current = deck;
        });

        return () => {
            if (revealInstanceRef.current) {
                try { revealInstanceRef.current.destroy(); } catch (_) {}
                revealInstanceRef.current = null;
            }
            const themeLink = document.getElementById('reveal-theme-dynamic');
            if (themeLink) themeLink.remove();
        };
    }, [presentation]);

    if (error) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#1c1c1c', color: '#fff',
                fontFamily: 'sans-serif', fontSize: '1.2rem'
            }}>
                {error}
            </div>
        );
    }

    if (!presentation) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#1c1c1c', color: '#888',
                fontFamily: 'sans-serif'
            }}>
                Cargando presentación...
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
        </div>
    );
};

export default PresentationViewer;
