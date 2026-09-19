import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useDocumentMeta } from './useDocumentMeta';

describe('useDocumentMeta', () => {
    beforeEach(() => {
        document.title = 'Título Original';
        document.head.querySelectorAll('meta[name="description"]').forEach(el => el.remove());
        cleanup();
    });

    it('atualiza document.title enquanto montado', () => {
        renderHook(() => useDocumentMeta('Artigo X — Fatima Felippe', 'resumo do artigo'));
        expect(document.title).toBe('Artigo X — Fatima Felippe');
    });

    it('restaura o título anterior ao desmontar', () => {
        const { unmount } = renderHook(() => useDocumentMeta('Artigo X — Fatima Felippe', 'resumo'));
        expect(document.title).toBe('Artigo X — Fatima Felippe');
        unmount();
        expect(document.title).toBe('Título Original');
    });

    it('cria a meta description quando ela ainda não existe', () => {
        renderHook(() => useDocumentMeta('Título', 'Descrição do artigo'));
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute('content')).toBe('Descrição do artigo');
    });

    it('restaura o content anterior da meta description ao desmontar', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        meta.setAttribute('content', 'descrição padrão do site');
        document.head.appendChild(meta);

        const { unmount } = renderHook(() => useDocumentMeta('Título', 'descrição específica do artigo'));
        expect(meta.getAttribute('content')).toBe('descrição específica do artigo');
        unmount();
        expect(meta.getAttribute('content')).toBe('descrição padrão do site');
    });

    it('não altera title/description quando title é undefined (ex.: artigo ainda carregando)', () => {
        renderHook(() => useDocumentMeta(undefined, undefined));
        expect(document.title).toBe('Título Original');
        expect(document.querySelector('meta[name="description"]')).toBeNull();
    });
});
