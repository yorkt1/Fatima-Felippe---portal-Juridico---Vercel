import type { ReactNode } from 'react';

// Linha "fantasma" mostrada enquanto a lista carrega (mesmo formato de ContentRow).
export function RowSkeleton() {
    return (
        <li className="adm-skelrow" aria-hidden="true">
            <div className="adm-skel" style={{ height: 34, width: 74 }} />
            <div className="adm-skel" style={{ height: 72, width: 112, borderRadius: 8 }} />
            <div>
                <div className="adm-skel" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                <div className="adm-skel" style={{ height: 12, width: '92%', marginBottom: 12 }} />
                <div className="adm-skel" style={{ height: 12, width: '45%' }} />
            </div>
            <div className="adm-skel" style={{ height: 30, width: 110 }} />
        </li>
    );
}

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    text: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, text, action }: EmptyStateProps) {
    return (
        <div className="adm-empty">
            <div className="adm-empty__icon" aria-hidden="true">{icon}</div>
            <h2>{title}</h2>
            <p>{text}</p>
            {action}
        </div>
    );
}
