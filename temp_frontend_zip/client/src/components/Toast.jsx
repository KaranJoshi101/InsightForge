import React from 'react';
import ReactDOM from 'react-dom';
import { useToast } from '../context/ToastContext';

const toneClassMap = {
    success: 'border-l-2 border-l-emerald-600 bg-white text-slate-800',
    error: 'border-l-2 border-l-red-600 bg-white text-slate-800',
    warning: 'border-l-2 border-l-amber-600 bg-white text-slate-800',
    info: 'border-l-2 border-l-slate-600 bg-white text-slate-800',
};

const Toast = ({ id, message, type, onRemove }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => onRemove(id), 3000);
        return () => clearTimeout(timer);
    }, [id, onRemove]);

    return (
        <div className={[
            'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 pointer-events-auto',
            toneClassMap[type] || toneClassMap.info,
        ].join(' ')}>
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm leading-5">{message}</span>
            </div>
            <button
                className="mt-2 text-xs font-medium text-slate-500 transition-all duration-200 hover:text-slate-700 pointer-events-auto"
                onClick={() => onRemove(id)}
                aria-label="Close"
            >
                Dismiss
            </button>
        </div>
    );
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return ReactDOM.createPortal(
        <div
            className="fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-2 pointer-events-none"
            aria-live="polite"
            role="status"
        >
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onRemove={removeToast}
                />
            ))}
        </div>,
        document.body
    );
};

export default Toast;
