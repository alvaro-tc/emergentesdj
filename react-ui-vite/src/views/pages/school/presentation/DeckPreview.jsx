/**
 * Vista previa del deck dentro del editor.
 *
 * Es el mismo Reveal y el mismo tema que la exposición, en versión embebida:
 * la única forma de ver de verdad cómo cae el tema sobre el código, los
 * callouts y las columnas. Una miniatura de la portada no lo enseña.
 *
 * El contenido se refresca con retardo: reconstruir el deck en cada tecla
 * costaría un montaje de Reveal por pulsación.
 */
import React, { useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { IconMoon, IconSun } from '@tabler/icons-react';

import { usePresentationDeck } from './usePresentationDeck';
import { PALETTE_LABELS } from './themes';

const REFRESH_DELAY = 400;

const DeckPreview = ({ presentation }) => {
    // Instantánea con retardo del formulario, para no remontar en cada tecla.
    const [snapshot, setSnapshot] = useState(presentation);

    useEffect(() => {
        const timer = setTimeout(
            // Sin título la portada saldría en blanco y parecería un fallo.
            () => setSnapshot({ ...presentation, title: presentation.title || 'Título de la presentación' }),
            REFRESH_DELAY
        );
        return () => clearTimeout(timer);
    }, [presentation]);

    const { deckRef, palette, togglePalette } = usePresentationDeck(snapshot, { embedded: true });

    return (
        <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="textSecondary">
                    Vista previa · {PALETTE_LABELS[palette]}
                </Typography>
                <Tooltip title="Alternar claro/oscuro (solo en la vista previa)">
                    <IconButton size="small" onClick={togglePalette}>
                        {palette === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Box
                ref={deckRef}
                className="reveal"
                sx={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    // A pantalla completa los topes van en vh, que aquí medirían
                    // contra la ventana y no contra la diapositiva escalada.
                    '--q-code-max-height': '380px',
                    '--q-media-max-height': '380px'
                }}
            >
                <div className="slides" />
            </Box>
        </Box>
    );
};

export default DeckPreview;
