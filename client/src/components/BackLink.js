import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BackLink = ({ to, label = 'Go Back' }) => {
    return (
        <Link
            to={to}
            style={{
                color: '#003594',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '8px 0',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
            }}
        >
            <FaArrowLeft size={12} aria-hidden="true" />
            {label}
        </Link>
    );
};

export default BackLink;
