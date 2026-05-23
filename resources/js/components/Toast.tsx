import React, { useEffect } from 'react';

export interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function Toast({ message, type, onClose }: ToastProps & { onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3200);
        return () => clearTimeout(t);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    return (
        <div className={`fixed top-5 right-5 z-[99999] ${bgClass} text-white rounded-lg px-5 py-3 font-medium shadow-lg animate-in slide-in-from-top-4 fade-in duration-300 min-w-[220px] max-w-[340px]`}>
            {message}
        </div>
    );
}
