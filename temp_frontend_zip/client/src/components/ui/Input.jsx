import React from 'react';

const Input = React.forwardRef(({ className = '', ...props }, ref) => {
    const classes = [
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400',
        'transition-all duration-200',
        className,
    ].filter(Boolean).join(' ');

    return <input ref={ref} className={classes} {...props} />;
});

Input.displayName = 'Input';

export default Input;
