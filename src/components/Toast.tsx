import { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: bgColor,
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out',
            maxWidth: '400px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>
                    {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
                </span>
                <span>{message}</span>
            </div>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    const ToastComponent = toast ? (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
        />
    ) : null;

    return { showToast, ToastComponent };
}
