import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
    upsert: vi.fn(),
    del: vi.fn(),
    inFn: vi.fn(),
    fetchRaw: vi.fn(),
    load: vi.fn(),
}));

vi.mock('../services/supabase', () => ({
    supabase: {
        from: () => ({ upsert: mocks.upsert, delete: mocks.del }),
        storage: { from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn() }) },
    },
}));
vi.mock('../services/siteSettings', () => ({
    fetchSiteSettingsRaw: mocks.fetchRaw,
    loadSiteSettings: mocks.load,
}));

import SiteSettingsForm from './SiteSettingsForm';

describe('SiteSettingsForm', () => {
    beforeEach(() => {
        mocks.upsert.mockReset().mockResolvedValue({ error: null });
        mocks.inFn.mockReset().mockResolvedValue({ error: null });
        mocks.del.mockReset().mockReturnValue({ in: mocks.inFn });
        mocks.fetchRaw.mockReset().mockResolvedValue({ data: [], error: null });
        mocks.load.mockReset().mockResolvedValue({});
    });

    it('mostra os textos padrão do site quando nada foi editado', async () => {
        render(<SiteSettingsForm onClose={vi.fn()} />);
        const title = await screen.findByLabelText(/Título de boas-vindas/);
        expect(title).toHaveValue('Bem-vindo ao Portal Jurídico');
    });

    it('salva só o campo que foi alterado', async () => {
        const user = userEvent.setup();
        mocks.load.mockResolvedValue({ 'home.title': 'Novo título' });
        render(<SiteSettingsForm onClose={vi.fn()} />);

        const title = await screen.findByLabelText(/Título de boas-vindas/);
        await user.clear(title);
        await user.type(title, 'Novo título');
        await user.click(screen.getByRole('button', { name: /Salvar alterações/ }));

        await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(1));
        expect(mocks.upsert).toHaveBeenCalledWith(
            [{ key: 'home.title', value: 'Novo título', updated_at: expect.any(String) }],
            { onConflict: 'key' }
        );
        expect(mocks.del).not.toHaveBeenCalled();
    });

    it('"Restaurar padrão" apaga a linha do banco em vez de gravar o texto original', async () => {
        const user = userEvent.setup();
        mocks.fetchRaw.mockResolvedValue({ data: [{ key: 'home.title', value: 'Editado antes' }], error: null });
        render(<SiteSettingsForm onClose={vi.fn()} />);

        const title = await screen.findByLabelText(/Título de boas-vindas/);
        expect(title).toHaveValue('Editado antes');

        await user.click(screen.getByRole('button', { name: /Restaurar padrão/ }));
        expect(title).toHaveValue('Bem-vindo ao Portal Jurídico');
        await user.click(screen.getByRole('button', { name: /Salvar alterações/ }));

        await waitFor(() => expect(mocks.inFn).toHaveBeenCalledWith('key', ['home.title']));
        expect(mocks.upsert).not.toHaveBeenCalled();
    });

    it('sem alterações não chama o banco', async () => {
        const user = userEvent.setup();
        render(<SiteSettingsForm onClose={vi.fn()} />);
        await screen.findByLabelText(/Título de boas-vindas/);

        await user.click(screen.getByRole('button', { name: /Salvar alterações/ }));

        expect(await screen.findByText('Nenhuma alteração para salvar.')).toBeInTheDocument();
        expect(mocks.upsert).not.toHaveBeenCalled();
        expect(mocks.del).not.toHaveBeenCalled();
    });

    it('avisa para rodar o SQL quando a tabela ainda não existe', async () => {
        mocks.fetchRaw.mockResolvedValue({ data: null, error: { message: 'relation "site_settings" does not exist' } });
        render(<SiteSettingsForm onClose={vi.fn()} />);
        expect(await screen.findByText(/supabase_site_settings\.sql/)).toBeInTheDocument();
    });

    it('mostra erro se o Supabase recusar o salvamento', async () => {
        const user = userEvent.setup();
        mocks.upsert.mockResolvedValue({ error: { message: 'permission denied' } });
        render(<SiteSettingsForm onClose={vi.fn()} />);

        const title = await screen.findByLabelText(/Título de boas-vindas/);
        await user.type(title, ' extra');
        await user.click(screen.getByRole('button', { name: /Salvar alterações/ }));

        expect(await screen.findByText(/Erro ao salvar/)).toBeInTheDocument();
    });

    it('deixa os contadores no modo automático inicialmente e aceita um valor personalizado', async () => {
        const user = userEvent.setup();
        render(<SiteSettingsForm onClose={vi.fn()} />);

        await screen.findByLabelText(/Título de boas-vindas/);
        await user.click(screen.getByText('Página inicial'));

        const mode = screen.getByLabelText('Artigos publicados');
        expect(mode).toHaveValue('automatic');
        expect(screen.queryByLabelText('Número personalizado de artigos publicados')).not.toBeInTheDocument();

        await user.selectOptions(mode, 'custom');
        const value = screen.getByLabelText('Número personalizado de artigos publicados');
        await user.clear(value);
        await user.type(value, '30');
        await user.click(screen.getByRole('button', { name: /Salvar alterações/ }));

        await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(
            [
                { key: 'home.stats.published.mode', value: 'custom', updated_at: expect.any(String) },
                { key: 'home.stats.published.value', value: '30', updated_at: expect.any(String) },
            ],
            { onConflict: 'key' }
        ));
    });
});
