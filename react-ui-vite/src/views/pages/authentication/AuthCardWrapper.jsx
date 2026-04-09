import PropTypes from 'prop-types';
import React from 'react';

// project import
import MainCard from './../../../ui-component/cards/MainCard';

//-----------------------|| AUTHENTICATION CARD WRAPPER ||-----------------------//

const AuthCardWrapper = ({ children, ...other }) => {
    return (
        <MainCard
            border={false}
            sx={{
                maxWidth: '475px',
                '& > *': {
                    flexGrow: 1,
                    flexBasis: '50%',
                },
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
                borderRadius: '16px',
                '@media (max-width: 600px)': {
                    margin: '20px',
                },
                '@media (max-width: 1280px)': {
                    maxWidth: '400px',
                },
            }}
            contentSX={{
                p: { xs: 3, sm: 4, xl: 4 },
                pb: { xs: 3, sm: 4, xl: 4 }
            }}
            {...other}
        >
            {children}
        </MainCard>
    );
};

AuthCardWrapper.propTypes = {
    children: PropTypes.node,
};

export default AuthCardWrapper;
