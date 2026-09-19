import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Páginas e peças pesadas viram "marcadores": aqui só interessa o que o
// AppShell mostra ou esconde em cada rota.
vi.mock('./components/Header', () => ({ default: () => <header>cabecalho-do-site</header> }));
vi.mock('./components/Footer', () => ({ default: () => <footer>rodape-do-site</footer> }));
vi.mock('./components/CookieConsent', () => ({ default: () => <div>aviso-de-cookies</div> }));
vi.mock('./pages/Home', () => ({ default: () => <p>pagina-inicial</p> }));
vi.mock('./pages/ArtigosPage', () => ({ default: () => <p>pagina-artigos</p> }));
vi.mock('./pages/ReflexoesPage', () => ({ default: () => <p>pagina-reflexoes</p> }));
vi.mock('./pages/NoticiasPage', () => ({ default: () => <p>pagina-noticias</p> }));
vi.mock('./pages/ArticlePage', () => ({ default: () => <p>pagina-artigo</p> }));
vi.mock('./pages/ReflexaoPage', () => ({ default: () => <p>pagina-reflexao</p> }));
vi.mock('./pages/NoticiaPage', () => ({ default: () => <p>pagina-noticia</p> }));
vi.mock('./pages/SearchPage', () => ({ default: () => <p>pagina-busca</p> }));
vi.mock('./pages/ContactPage', () => ({ default: () => <p>pagina-contato</p> }));
vi.mock('./pages/AboutPage', () => ({ default: () => <p>pagina-sobre</p> }));
vi.mock('./pages/PrivacyPage', () => ({ default: () => <p>pagina-privacidade</p> }));
vi.mock('./pages/AdminPage', () => ({ default: () => <p>painel-admin</p> }));
vi.mock('./pages/AdminLoginPage', () => ({ default: () => <p>login-admin</p> }));

import App from './App';

const copy = () => document.dispatchEvent(new Event('copy'));

describe('App — estrutura por rota', () => {
    let alertSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    });
    afterEach(() => {
        alertSpy.mockRestore();
        window.history.pushState({}, '', '/');
    });

    it('no site público mostra cabeçalho, rodapé e aviso de cookies', async () => {
        window.history.pushState({}, '', '/');
        const { container } = render(<App />);

        expect(await screen.findByText('pagina-inicial')).toBeInTheDocument();
        expect(screen.getByText('cabecalho-do-site')).toBeInTheDocument();
        expect(screen.getByText('rodape-do-site')).toBeInTheDocument();
        expect(screen.getByText('aviso-de-cookies')).toBeInTheDocument();
        expect(container.querySelector('.app')).not.toBeNull();
    });

    it('no /admin o painel usa layout próprio: sem cabeçalho, rodapé nem cookies do site', async () => {
        window.history.pushState({}, '', '/admin');
        const { container } = render(<App />);

        expect(await screen.findByText('painel-admin')).toBeInTheDocument();
        expect(screen.queryByText('cabecalho-do-site')).not.toBeInTheDocument();
        expect(screen.queryByText('rodape-do-site')).not.toBeInTheDocument();
        expect(screen.queryByText('aviso-de-cookies')).not.toBeInTheDocument();
        expect(container.querySelector('.app')).toBeNull();
    });

    it('a tela de login do admin também fica sem o cabeçalho/rodapé do site', async () => {
        window.history.pushState({}, '', '/admin-login');
        render(<App />);

        expect(await screen.findByText('login-admin')).toBeInTheDocument();
        expect(screen.queryByText('cabecalho-do-site')).not.toBeInTheDocument();
        expect(screen.queryByText('rodape-do-site')).not.toBeInTheDocument();
    });

    it('copiar texto avisa no site público, mas não no painel', async () => {
        window.history.pushState({}, '', '/');
        const site = render(<App />);
        await screen.findByText('pagina-inicial');
        copy();
        expect(alertSpy).toHaveBeenCalledTimes(1);
        site.unmount();

        window.history.pushState({}, '', '/admin');
        render(<App />);
        await screen.findByText('painel-admin');
        copy();
        expect(alertSpy).toHaveBeenCalledTimes(1); // continua 1: o painel não avisa
    });
});
