import React from 'react';

const variantMap = {
    solid: 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 active:bg-slate-900',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700 active:bg-red-700',
};

const sizeMap = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
};

const Button = ({
    type = 'button',
    variant = 'solid',
    size = 'md',
    className = '',
    disabled = false,
    children,
    ...props
}) => {
    const classes = [
        'inline-flex items-center justify-center rounded-lg font-medium',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1',
        variantMap[variant] || variantMap.solid,
        sizeMap[size] || sizeMap.md,
        disabled ? 'opacity-60 cursor-not-allowed hover:shadow-sm' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button type={type} className={classes} disabled={disabled} {...props}>
            {children}
        </button>
    );
};

export default Button;
