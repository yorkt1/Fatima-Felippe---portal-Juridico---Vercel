import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useDocumentMeta } from './useDocumentMeta';

describe('useDocumentMeta', () => {
    beforeEach(() => {
        document.title = 'Título Original';
        document.head.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name="robots"], link[rel="canonical"], script[data-seo-jsonld]').forEach(el => el.remove());
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

    it('define o canonical e o og:url a partir de path, e remove ao desmontar', () => {
        const { unmount } = renderHook(() => useDocumentMeta('Artigo X', 'resumo', { path: '/artigo/12' }));
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://fatimafelippe.com.br/artigo/12');
        expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://fatimafelippe.com.br/artigo/12');
        unmount();
        expect(document.querySelector('link[rel="canonical"]')).toBeNull();
        expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    });

    it('restaura o canonical anterior (não remove) quando ele já existia antes de montar', () => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', 'https://fatimafelippe.com.br/');
        document.head.appendChild(link);

        const { unmount } = renderHook(() => useDocumentMeta('Artigo X', 'resumo', { path: '/artigo/12' }));
        expect(link.getAttribute('href')).toBe('https://fatimafelippe.com.br/artigo/12');
        unmount();
        expect(link.getAttribute('href')).toBe('https://fatimafelippe.com.br/');
    });

    it('define og:title, og:description e og:image', () => {
        renderHook(() => useDocumentMeta('Artigo X', 'resumo', { image: 'https://x/img.jpg' }));
        expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Artigo X');
        expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('resumo');
        expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://x/img.jpg');
    });

    it('usa index, follow por padrão e noindex, follow quando noindex: true', () => {
        const { rerender, unmount } = renderHook(
            ({ noindex }: { noindex: boolean }) => useDocumentMeta('Página', 'desc', { noindex }),
            { initialProps: { noindex: false } }
        );
        expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
        rerender({ noindex: true });
        expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow');
        unmount();
    });

    it('injeta e remove o JSON-LD passado em structuredData', () => {
        const data = { '@context': 'https://schema.org', '@type': 'Article', headline: 'Artigo X' };
        const { unmount } = renderHook(() => useDocumentMeta('Artigo X', 'resumo', { structuredData: data }));
        const script = document.querySelector('script[data-seo-jsonld]');
        expect(script).not.toBeNull();
        expect(JSON.parse(script!.textContent || '{}')).toEqual(data);
        unmount();
        expect(document.querySelector('script[data-seo-jsonld]')).toBeNull();
    });
});
