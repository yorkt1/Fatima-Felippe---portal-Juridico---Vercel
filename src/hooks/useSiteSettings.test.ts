import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ load: vi.fn(), cached: vi.fn() }));
vi.mock('../services/siteSettings', () => ({
    loadSiteSettings: mocks.load,
    readCachedSiteSettings: mocks.cached,
}));

import { useSiteSettings } from './useSiteSettings';

describe('useSiteSettings', () => {
    beforeEach(() => {
        mocks.load.mockReset();
        mocks.cached.mockReset();
        mocks.cached.mockReturnValue({});
    });

    it('usa o texto padrão do código enquanto nada foi editado', async () => {
        mocks.load.mockResolvedValue({});
        const { result } = renderHook(() => useSiteSettings());
        expect(result.current.get('home.title')).toBe('Bem-vindo ao Portal Jurídico');
    });

    it('troca pelo texto editado no painel quando o Supabase responde', async () => {
        mocks.load.mockResolvedValue({ 'home.title': 'Novo título' });
        const { result } = renderHook(() => useSiteSettings());
        await waitFor(() => expect(result.current.get('home.title')).toBe('Novo título'));
    });

    it('começa pelo último valor conhecido (cache) para não piscar', () => {
        mocks.cached.mockReturnValue({ 'home.title': 'Do cache' });
        mocks.load.mockReturnValue(new Promise(() => {})); // ainda carregando
        const { result } = renderHook(() => useSiteSettings());
        expect(result.current.get('home.title')).toBe('Do cache');
    });

    it('chave desconhecida devolve string vazia (não quebra a página)', () => {
        mocks.load.mockResolvedValue({});
        const { result } = renderHook(() => useSiteSettings());
        expect(result.current.get('nao.existe')).toBe('');
    });
});
