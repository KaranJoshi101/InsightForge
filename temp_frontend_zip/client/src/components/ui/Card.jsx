import React from 'react';

const Card = ({ className = '', children }) => {
    const classes = [
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        'transition-all duration-200 hover:shadow-md',
        className,
    ].filter(Boolean).join(' ');

    return <div className={classes}>{children}</div>;
};

export const CardHeader = ({ className = '', children }) => (
    <div className={['border-b border-slate-200 px-5 py-4', className].filter(Boolean).join(' ')}>
        {children}
    </div>
);

export const CardBody = ({ className = '', children }) => (
    <div className={['px-5 py-4', className].filter(Boolean).join(' ')}>{children}</div>
);

export const CardFooter = ({ className = '', children }) => (
    <div className={['border-t border-slate-200 px-5 py-4', className].filter(Boolean).join(' ')}>
        {children}
    </div>
);

export default Card;
