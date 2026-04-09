import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { Box, Collapse, Fade, Grow, Slide, Zoom } from '@mui/material';

//-----------------------|| TRANSITIONS ||-----------------------//

const Transitions = React.forwardRef(({ children, position = 'top-left', type = 'grow', direction = 'up', ...others }, ref) => {
    let positionSX = {
        transformOrigin: '0 0 0'
    };

    switch (position) {
        case 'top-right':
            positionSX = {
                transformOrigin: 'top right'
            };
            break;
        case 'top':
            positionSX = {
                transformOrigin: 'top'
            };
            break;
        case 'bottom-left':
            positionSX = {
                transformOrigin: 'bottom left'
            };
            break;
        case 'bottom-right':
            positionSX = {
                transformOrigin: 'bottom right'
            };
            break;
        case 'bottom':
            positionSX = {
                transformOrigin: 'bottom'
            };
            break;
        case 'top-left':
        default:
            positionSX = {
                transformOrigin: '0 0 0'
            };
            break;
    }

    if (type === 'grow') {
        return (
            <Grow {...others}>
                <Box ref={ref} sx={positionSX}>{children}</Box>
            </Grow>
        );
    }
    if (type === 'collapse') {
        return (
            <Collapse {...others}>
                <Box ref={ref} sx={positionSX}>{children}</Box>
            </Collapse>
        );
    }
    if (type === 'fade') {
        return (
            <Fade
                {...others}
                timeout={{
                    appear: 500,
                    enter: 600,
                    exit: 400
                }}
            >
                <Box ref={ref} sx={positionSX}>{children}</Box>
            </Fade>
        );
    }
    if (type === 'slide') {
        return (
            <Slide
                {...others}
                timeout={{
                    appear: 0,
                    enter: 400,
                    exit: 200
                }}
                direction={direction}
            >
                <Box ref={ref} sx={positionSX}>{children}</Box>
            </Slide>
        );
    }
    // default: zoom
    return (
        <Zoom {...others}>
            <Box ref={ref} sx={positionSX}>{children}</Box>
        </Zoom>
    );
});

Transitions.propTypes = {
    children: PropTypes.node,
    type: PropTypes.oneOf(['grow', 'fade', 'collapse', 'slide', 'zoom']),
    position: PropTypes.oneOf(['top-left', 'top-right', 'top', 'bottom-left', 'bottom-right', 'bottom']),
    direction: PropTypes.oneOf(['up', 'down', 'left', 'right'])
};


export default Transitions;
