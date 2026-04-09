import { useState, useCallback, useEffect } from 'react';

// ─── Theme palettes ──────────────────────────────────────────────────────────
export const DARK = {
    bg:          '#070c18',
    surface:     '#0c1020',
    card:        '#0f1428',
    cardHover:   '#131830',
    border:      '#1e1a3a',
    borderLight: '#2a2250',
    purple:      '#8b5cf6',
    purpleLight: '#c4b5fd',
    purpleDim:   '#8b5cf618',
    text:        '#e2dff0',
    textMuted:   '#6b6888',
    green:       '#00d46a',
    greenDim:    '#00d46a18',
    windowBar:   '#16122a',
    windowBody:  '#ffffff',
    windowText:  '#9d94c4',
    frameShadow: 'rgba(0,0,0,0.55)',
};

export const LIGHT = {
    bg:          '#f7f5ff',
    surface:     '#ffffff',
    card:        '#faf9ff',
    cardHover:   '#f3eeff',
    border:      '#e0daf4',
    borderLight: '#cec6ee',
    purple:      '#6d28d9',
    purpleLight: '#8b5cf6',
    purpleDim:   '#6d28d918',
    text:        '#1c1033',
    textMuted:   '#7566a0',
    green:       '#16a34a',
    greenDim:    '#16a34a18',
    windowBar:   '#ede8ff',
    windowBody:  '#ffffff',
    windowText:  '#9d94c4',
    frameShadow: 'rgba(109,40,217,0.12)',
};

// ─── Dot-grid backgrounds ────────────────────────────────────────────────────
export const DOT_DARK  = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='1' cy='1' r='1.2' fill='%23ffffff' fill-opacity='0.045'/%3E%3C/svg%3E")`;
export const DOT_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='1' cy='1' r='1.2' fill='%236d28d9' fill-opacity='0.06'/%3E%3C/svg%3E")`;

// ─── CSS Keyframes ────────────────────────────────────────────────────────────
export const KEYFRAMES = `
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes lp-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
`;

export const fadeUp = (delay = 0) => ({
    animation: `lp-fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
});

// ─── Custom Hook for theme ──────────────────────────────────────────────────
export const useLandingTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('landing-theme');
        if (saved !== null) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleTheme = useCallback(() => {
        setIsDark(prev => {
            const next = !prev;
            localStorage.setItem('landing-theme', next ? 'dark' : 'light');
            return next;
        });
    }, []);

    // Listen for OS preference changes if no manual preference stored
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            if (localStorage.getItem('landing-theme') === null) {
                setIsDark(e.matches);
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return {
        isDark,
        toggleTheme,
        C: isDark ? DARK : LIGHT,
        DOT: isDark ? DOT_DARK : DOT_LIGHT
    };
};
