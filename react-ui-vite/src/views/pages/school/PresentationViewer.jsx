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

        // sky (ocean) y beige (forest) y white (corporate) son temas claros
        const LIGHT_THEMES = ['ocean', 'forest', 'corporate'];
        const isLight = LIGHT_THEMES.includes(presentation.theme);
        const coverLogo = isLight
            ? (presentation.logo_oscuro || presentation.logo_url)
            : (presentation.logo_url || presentation.logo_oscuro);

        const coverLogoHtml = coverLogo
            ? `<img src="${escapeHtml(coverLogo)}" alt="logo" style="max-height:100px;border:none;background:none;box-shadow:none;display:block;" />`
            : '';

        const autorHtml = presentation.autor
            ? `<p style="margin:0;font-size:0.85em;opacity:0.7;letter-spacing:0.03em;">${escapeHtml(presentation.autor)}</p>`
            : '';

        let slidesHtml = `
            <section style="position:relative;padding:0;overflow:hidden;height:100vh;box-sizing:border-box;">
                <div style="position:absolute;top:6%;left:0;width:100%;display:flex;justify-content:center;align-items:center;">
                    ${coverLogoHtml}
                </div>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;text-align:center;">
                    <h1 style="margin:0 0 16px 0;line-height:1.15;">${escapeHtml(presentation.title)}</h1>
                    ${presentation.subtitle ? `<h3 style="opacity:0.75;margin:0;font-weight:400;">${escapeHtml(presentation.subtitle)}</h3>` : ''}
                </div>
                <div style="position:absolute;bottom:6%;left:0;width:100%;display:flex;justify-content:center;align-items:center;">
                    ${autorHtml}
                </div>
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
