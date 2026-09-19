import type { ReactNode } from 'react';

interface FieldProps {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: ReactNode;
    className?: string;
    children: ReactNode;
}

// Campo com rótulo SEMPRE acima, dica opcional abaixo.
export function Field({ label, htmlFor, required, hint, className, children }: FieldProps) {
    return (
        <div className={`adm-field${className ? ` ${className}` : ''}`}>
            <label className="adm-label" htmlFor={htmlFor}>
                {label}
                {required && <span className="adm-label__req" aria-hidden="true">*</span>}
            </label>
            {children}
            {hint && <p className="adm-hint">{hint}</p>}
        </div>
    );
}

interface SectionProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    className?: string;
    children: ReactNode;
}

// Cartão com título — agrupa campos relacionados.
export function Section({ icon, title, description, className, children }: SectionProps) {
    return (
        <section className={`adm-card${className ? ` ${className}` : ''}`}>
            <div className="adm-card__head">
                {icon && <div className="adm-card__icon" aria-hidden="true">{icon}</div>}
                <div>
                    <h2 className="adm-card__title">{title}</h2>
                    {description && <p className="adm-card__desc">{description}</p>}
                </div>
            </div>
            <div className="adm-card__body">{children}</div>
        </section>
    );
}

interface ActionBarProps {
    status?: ReactNode;
    children: ReactNode;
}

// Barra fixa no rodapé da tela com as ações principais do formulário.
export function ActionBar({ status, children }: ActionBarProps) {
    return (
        <div className="adm-actionbar" role="region" aria-label="Ações do formulário">
            <div className="adm-actionbar__inner">
                <div className="adm-actionbar__status">{status}</div>
                <div className="adm-actionbar__buttons">{children}</div>
            </div>
        </div>
    );
}
