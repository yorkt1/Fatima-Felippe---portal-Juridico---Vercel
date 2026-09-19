import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ load: vi.fn(), cached: vi.fn() }));
vi.mock('../services/siteSettings', () => ({
    loadSiteSettings: mocks.load,
    readCachedSiteSettings: mocks.cached,
}));

import ContactPage from './ContactPage';

describe('ContactPage com textos editáveis', () => {
    beforeEach(() => {
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        mocks.cached.mockReset().mockReturnValue({});
        mocks.load.mockReset().mockResolvedValue({});
    });

    it('mostra os contatos padrão quando nada foi editado', () => {
        render(<ContactPage />);
        expect(screen.getByRole('heading', { name: 'Entre em Contato' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Fatimafelippe7.adv@gmail.com' })).toHaveAttribute(
            'href',
            'mailto:Fatimafelippe7.adv@gmail.com'
        );
        expect(screen.getByText('(48) 99802-1460')).toBeInTheDocument();
    });

    it('troca e-mail, telefone e título pelos valores salvos no painel', async () => {
        mocks.load.mockResolvedValue({
            'contact.title': 'Fale conosco',
            'contact.email': 'novo@exemplo.com',
            'contact.phone': '(11) 1234-5678',
        });
        render(<ContactPage />);

        expect(await screen.findByRole('heading', { name: 'Fale conosco' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'novo@exemplo.com' })).toHaveAttribute('href', 'mailto:novo@exemplo.com');
        expect(screen.getByText('(11) 1234-5678')).toBeInTheDocument();
    });

    it('ignora link do Instagram que não seja http(s) e mantém o padrão', async () => {
        mocks.load.mockResolvedValue({ 'contact.instagram': 'javascript:alert(1)' });
        render(<ContactPage />);
        await waitFor(() => expect(mocks.load).toHaveBeenCalled());
        const link = screen.getByRole('link', { name: 'Instagram' });
        expect(link.getAttribute('href')).toMatch(/^https:\/\/www\.instagram\.com\/fatimafelippe7/);
    });

    it('aceita um link https válido do Instagram', async () => {
        mocks.load.mockResolvedValue({ 'contact.instagram': 'https://www.instagram.com/outro_perfil' });
        render(<ContactPage />);
        await waitFor(() =>
            expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/outro_perfil')
        );
    });
});
