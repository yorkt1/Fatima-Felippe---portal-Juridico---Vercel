import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock('./supabase', () => ({
    supabase: { from: () => ({ select: mocks.select }) },
}));

import { loadSiteSettings, readCachedSiteSettings } from './siteSettings';

describe('loadSiteSettings', () => {
    beforeEach(() => {
        mocks.select.mockReset();
        localStorage.clear();
    });

    it('devolve só os valores preenchidos (vazio = usar padrão)', async () => {
        mocks.select.mockResolvedValue({
            data: [
                { key: 'home.title', value: 'Novo título' },
                { key: 'home.p1', value: '   ' },
            ],
            error: null,
        });
        expect(await loadSiteSettings(true)).toEqual({ 'home.title': 'Novo título' });
    });

    it('se o Supabase der erro (ex.: tabela inexistente), devolve vazio e o site usa os padrões', async () => {
        mocks.select.mockResolvedValue({ data: null, error: { message: 'relation does not exist' } });
        expect(await loadSiteSettings(true)).toEqual({});
    });

    it('se a requisição falhar de vez (rede), também devolve vazio', async () => {
        mocks.select.mockRejectedValue(new Error('sem rede'));
        expect(await loadSiteSettings(true)).toEqual({});
    });

    it('guarda o resultado no cache local para a próxima visita não piscar', async () => {
        mocks.select.mockResolvedValue({ data: [{ key: 'header.name', value: 'Outro Nome' }], error: null });
        await loadSiteSettings(true);
        expect(readCachedSiteSettings()).toEqual({ 'header.name': 'Outro Nome' });
    });

    it('reaproveita a mesma requisição quando chamado várias vezes', async () => {
        mocks.select.mockResolvedValue({ data: [], error: null });
        await loadSiteSettings(true);
        await loadSiteSettings();
        await loadSiteSettings();
        expect(mocks.select).toHaveBeenCalledTimes(1);
    });
});

describe('readCachedSiteSettings', () => {
    beforeEach(() => localStorage.clear());

    it('devolve vazio quando não há cache', () => {
        expect(readCachedSiteSettings()).toEqual({});
    });

    it('tolera cache corrompido', () => {
        localStorage.setItem('siteSettingsCache', '{quebrado');
        expect(readCachedSiteSettings()).toEqual({});
    });
});
