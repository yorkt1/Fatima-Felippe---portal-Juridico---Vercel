interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                animation: 'scaleIn 0.2s ease-out'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>{title}</h3>
                <p style={{ margin: '0 0 24px 0', color: '#666' }}>{message}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        className="btn"
                        onClick={onCancel}
                        style={{ padding: '8px 16px' }}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn primary"
                        onClick={onConfirm}
                        style={{ padding: '8px 16px', background: '#ef4444' }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
