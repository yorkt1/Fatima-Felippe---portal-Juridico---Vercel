import type { ReactNode } from 'react';
import { BookOpen, ExternalLink, FileText, LogOut, Newspaper, Settings } from 'lucide-react';
import '../../admin/index.css';

export type ContentType = 'artigos' | 'reflexoes' | 'noticias';

const TABS = [
    { id: 'artigos', label: 'Artigos', icon: FileText },
    { id: 'reflexoes', label: 'Reflexões', icon: BookOpen },
    { id: 'noticias', label: 'Notícias', icon: Newspaper },
] as const;

interface AdminLayoutProps {
    /** Aba ativa. */
    active: ContentType;
    /** Mostra as abas (escondidas enquanto há um formulário aberto, para não perder edições sem querer). */
    showTabs: boolean;
    counts: Partial<Record<ContentType, number>>;
    email?: string | null;
    onSelectType: (type: ContentType) => void;
    onOpenSiteSettings: () => void;
    onLogout: () => void;
    children: ReactNode;
}

// Estrutura do painel: barra superior + abas + conteúdo. Não usa o
// cabeçalho/rodapé do site público (ver App.tsx).
export default function AdminLayout({
    active, showTabs, counts, email, onSelectType, onOpenSiteSettings, onLogout, children,
}: AdminLayoutProps) {
    const initial = (email?.trim()[0] ?? 'A').toUpperCase();

    return (
        <div className="adm">
            <header className="adm-bar">
                <div className="adm-bar__inner">
                    <div className="adm-brand">
                        <div className="adm-brand__mark" aria-hidden="true">FF</div>
                        <div>
                            <div className="adm-brand__name">Painel Administrativo</div>
                            <div className="adm-brand__sub">Portal Jurídico</div>
                        </div>
                    </div>
                    <div className="adm-bar__spacer" />
                    <a className="adm-btn adm-btn--ghost adm-btn--sm" href="/" target="_blank" rel="noopener noreferrer"
                        aria-label="Ver site (abre em nova aba)" title="Ver site">
                        <ExternalLink size={15} aria-hidden="true" /> <span className="adm-hide-sm">Ver site</span>
                    </a>
                    <div className="adm-user">
                        <div className="adm-avatar" aria-hidden="true">{initial}</div>
                        {email && <span className="adm-user__email" title={email}>{email}</span>}
                        <button type="button" className="adm-btn adm-btn--sm" onClick={onLogout}>
                            <LogOut size={15} aria-hidden="true" /> Sair
                        </button>
                    </div>
                </div>
            </header>

            {showTabs && (
                <nav className="adm-tabsband" aria-label="Seções do painel">
                    <div className="adm-tabs">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                className="adm-tab"
                                aria-current={active === id ? 'page' : undefined}
                                onClick={() => onSelectType(id)}
                            >
                                <Icon size={16} aria-hidden="true" />
                                {label}
                                {counts[id] !== undefined && <span className="adm-tab__count">{counts[id]}</span>}
                            </button>
                        ))}
                        <span className="adm-tabs__spacer" />
                        <button type="button" className="adm-tab" onClick={onOpenSiteSettings}>
                            <Settings size={16} aria-hidden="true" />
                            Textos do site
                        </button>
                    </div>
                </nav>
            )}

            <main>{children}</main>
        </div>
    );
}
