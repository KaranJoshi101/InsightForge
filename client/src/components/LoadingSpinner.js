import React from 'react';

const LoadingSpinner = ({ fullScreen = true }) => {
    const wrapperStyle = fullScreen
        ? {
            minHeight: 'calc(100vh - 60px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }
        : {
            width: '100%',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        };

    return (
        <div style={wrapperStyle}>
            <div className="loading" aria-label="Loading" role="status" />
        </div>
    );
};

export default LoadingSpinner;
