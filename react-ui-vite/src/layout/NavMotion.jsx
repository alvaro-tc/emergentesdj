import PropTypes from 'prop-types';
import React from 'react';

// third-party
import { motion } from 'framer-motion';

//-----------------------|| ANIMATION FOR CONTENT ||-----------------------//

const NavMotion = ({ children }) => {
    const motionVariants = {
        initial: {
            opacity: 0,
            scale: 0.99
        },
        in: {
            opacity: 1,
            scale: 1
        },
        out: {
            opacity: 0,
            scale: 1.01
        }
    };

    const motionTransition = {
        type: 'tween',
        ease: 'easeOut',
        duration: 0.18
    };

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={motionVariants} transition={motionTransition}>
            {children}
        </motion.div>
    );
};

NavMotion.propTypes = {
    children: PropTypes.node
};

export default NavMotion;
