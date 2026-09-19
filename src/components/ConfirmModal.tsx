import { useEffect, useRef } from 'react';
import { Info, TriangleAlert } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    /** "danger" (vermelho, ações destrutivas) ou "primary" (azul). */
    variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
    isOpen, title, message, onConfirm, onCancel,
    confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'danger',
}: ConfirmModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const onCancelRef = useRef(onCancel);

    useEffect(() => {
        onCancelRef.current = onCancel;
    });

    // Ao abrir: foco no botão seguro, Esc fecha e Tab não escapa do diálogo.
    useEffect(() => {
        if (!isOpen) return;
        cancelRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancelRef.current();
            } else if (e.key === 'Tab' && dialogRef.current) {
                const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>('button'));
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen]);

    if (!isOpen) return null;

    const Icon = variant === 'danger' ? TriangleAlert : Info;

    return (
        <div
            className="adm-overlay"
            onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div ref={dialogRef} className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" aria-describedby="adm-modal-desc">
                <div className={`adm-modal__icon${variant === 'primary' ? ' adm-modal__icon--primary' : ''}`}>
                    <Icon size={22} aria-hidden="true" />
                </div>
                <h2 id="adm-modal-title">{title}</h2>
                <p id="adm-modal-desc">{message}</p>
                <div className="adm-modal__actions">
                    <button ref={cancelRef} type="button" className="adm-btn" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button type="button" className={`adm-btn ${variant === 'danger' ? 'adm-btn--danger' : 'adm-btn--primary'}`} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
