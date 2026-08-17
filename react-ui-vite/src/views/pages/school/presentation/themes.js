/**
 * Catálogo de temas de presentación.
 *
 * Cada tema trae dos paletas (clara y oscura) porque un mismo tono no funciona
 * sobre los dos fondos. La paleta guardada en la presentación es solo la de
 * apertura: el expositor alterna en vivo con la tecla `T`.
 *
 * Los colores viven por duplicado, aquí y en `quartoTheme.scss`. El SCSS es
 * quien pinta el deck; este módulo es para lo que el navegador no resuelve con
 * CSS: los chips del listado, la miniatura del selector y el export a PDF.
 * **Cambiar un color obliga a cambiarlo en los dos sitios.**
 *
 * `id` debe coincidir con `Presentation.THEME_CHOICES` del backend.
 */

export const PALETTE_LABELS = { light: 'Claro', dark: 'Oscuro' };

export const THEMES = {
    quarto: {
        label: 'Quarto',
        description: 'Neutro y sobrio, sin tipografía de autor.',
        palettes: {
            light: { bg: '#fdfdfd', main: '#222222', heading: '#1a1a1a', subheading: '#5a6570', muted: '#6b7280', accent: '#2a76dd' },
            dark: { bg: '#1c1e21', main: '#e6e8ea', heading: '#f4f6f8', subheading: '#9aa5b1', muted: '#9aa5b1', accent: '#6ea8fe' }
        }
    },
    serif: {
        label: 'Serif',
        description: 'Papel cálido y serifas; para clases de lectura y teoría.',
        palettes: {
            light: { bg: '#fbf8f1', main: '#2e2a24', heading: '#1f1b16', subheading: '#6b6154', muted: '#7d7264', accent: '#a8551f' },
            dark: { bg: '#221e1a', main: '#ece5da', heading: '#f7f1e6', subheading: '#b3a693', muted: '#a8998a', accent: '#d9a05b' }
        }
    },
    ocean: {
        label: 'Océano',
        description: 'Azules y turquesa; contrasta bien con bloques de código.',
        palettes: {
            light: { bg: '#f5f9fc', main: '#1c2b36', heading: '#0d3b52', subheading: '#4a7189', muted: '#5d7d90', accent: '#0e7490' },
            dark: { bg: '#0f1c26', main: '#d7e3ea', heading: '#e8f4fa', subheading: '#8aa9bc', muted: '#7b98aa', accent: '#4cc9d9' }
        }
    },
    contrast: {
        label: 'Alto contraste',
        description: 'Blanco y negro con letra mayor; para aulas grandes o proyectores pobres.',
        palettes: {
            light: { bg: '#ffffff', main: '#000000', heading: '#000000', subheading: '#333333', muted: '#444444', accent: '#0033cc' },
            dark: { bg: '#000000', main: '#ffffff', heading: '#ffffff', subheading: '#d0d0d0', muted: '#c0c0c0', accent: '#66b3ff' }
        }
    }
};

export const DEFAULT_THEME = 'quarto';
export const DEFAULT_PALETTE = 'dark';

export const THEME_LIST = Object.entries(THEMES).map(([id, theme]) => ({ id, ...theme }));

/** Colores de un tema y paleta, tolerante a valores desconocidos o vacíos. */
export const getThemeColors = (theme, palette) =>
    (THEMES[theme] || THEMES[DEFAULT_THEME]).palettes[palette] ||
    (THEMES[theme] || THEMES[DEFAULT_THEME]).palettes[DEFAULT_PALETTE];

/** `#rrggbb` → `[r, g, b]`, que es lo que consume jsPDF. */
export const hexToRgb = (hex) => {
    const value = String(hex || '').replace('#', '');
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
    const n = parseInt(full, 16);
    return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Logo que toca según la paleta: sobre fondo claro manda el logo oscuro, y al
 * revés. Si solo hay uno, se usa ese.
 */
export const pickLogo = (presentation, palette) =>
    palette === 'light'
        ? presentation?.logo_oscuro || presentation?.logo_url
        : presentation?.logo_url || presentation?.logo_oscuro;
