/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState } from 'react';
import { CircleCheck, CircleX, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const ICONS = { success: CircleCheck, error: CircleX, info: Info } as const;

export default function Toast({ message, type, onClose }: ToastProps) {
    // Erros ficam um pouco mais na tela para dar tempo de ler.
    useEffect(() => {
        const timer = setTimeout(onClose, type === 'error' ? 6000 : 4000);
        return () => clearTimeout(timer);
    }, [onClose, type, message]);

    const Icon = ICONS[type];

    return (
        <div className="adm-toasts">
            <div className={`adm-toast adm-toast--${type}`} role={type === 'error' ? 'alert' : 'status'}>
                <Icon size={18} className="adm-toast__icon" aria-hidden="true" />
                <span className="adm-toast__msg">{message}</span>
                <button type="button" className="adm-toast__close" onClick={onClose} aria-label="Fechar aviso">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Funções estáveis: antes o "onClose" mudava a cada renderização do formulário
    // e o temporizador reiniciava sempre — o aviso podia nunca sumir.
    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    }, []);
    const close = useCallback(() => setToast(null), []);

    const ToastComponent = toast ? <Toast message={toast.message} type={toast.type} onClose={close} /> : null;

    return { showToast, ToastComponent };
}
