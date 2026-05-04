import React from 'react';
import { Link } from 'react-router-dom';

const BackLink = ({ to, label = 'Go Back' }) => {
    return (
        <Link
            to={to}
            className="back-link mb-4 inline-flex items-center text-sm font-medium text-slate-600 transition-all duration-200 hover:text-slate-900"
        >
            <span aria-hidden="true" style={{ marginRight: '0.5rem' }}>←</span>
            {label}
        </Link>
    );
};

export default BackLink;
