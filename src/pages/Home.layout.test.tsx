// Trava as decisões de layout da Home que a deixam igual ao site original
// (fatimafelippe.com.br). Se algum destes testes quebrar, a Home mudou de visual.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({ rows: {} as Record<string, Row[]> }));

// Cliente Supabase falso: devolve as linhas do tipo pedido em .eq('type', ...)
vi.mock('../services/supabase', () => ({
    supabase: {
        from: () => {
            let type = '';
            const chain = {
                select: () => chain,
                eq: (_col: string, value: string) => { type = value; return chain; },
                order: () => chain,
                then: (resolve: (v: { data: Row[]; error: null }) => void) => resolve({ data: mocks.rows[type] ?? [], error: null }),
            };
            return chain;
        },
    },
}));

import Header from '../components/Header';
import Footer from '../components/Footer';
import Home from './Home';

const make = (i: number, extra: Row = {}): Row => ({
    id: i, category: 'artigo', categoryName: 'Direito do Trabalho', date: '01 de janeiro de 2026',
    readTime: '10 min de leitura', title: `Título ${i}`, excerpt: `Resumo ${i}`, image: `https://x/${i}.jpg`,
    image_position: '50% 50%', author: 'Redação', tags: [`tag${i}`], featured: false, ...extra,
});

function setup() {
    mocks.rows = {
        // 24 artigos: o 1º é o destaque (Direito Civil); demais em "Direito do Trabalho"
        artigos: Array.from({ length: 24 }, (_, k) => make(k + 1, k === 0 ? { featured: true, categoryName: 'Direito Civil' } : {})),
        reflexoes: Array.from({ length: 7 }, (_, k) => make(100 + k, { categoryName: 'Reflexão' })),
        noticias: Array.from({ length: 3 }, (_, k) => make(200 + k, { categoryName: 'Notícias' })),
    };
    return render(
        <MemoryRouter>
            <Header />
            <Home />
            <Footer />
        </MemoryRouter>
    );
}

describe('Home — layout igual ao original', () => {
    it('header: sem position sticky e logo "FF" como quadrado de texto', async () => {
        const { container } = setup();
        await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        const header = container.querySelector('header') as HTMLElement;
        expect(header.style.position).not.toBe('sticky');
        const logo = header.querySelector('.brand .logo') as HTMLElement;
        expect(logo.tagName).toBe('DIV');
        expect(logo).toHaveTextContent('FF');
        expect(header.querySelector('.brand img')).toBeNull();
    });

    it('header: título com peso 1000 e botão "Ir" sem padding próprio (usa o .btn)', async () => {
        const { container } = setup();
        await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        const title = screen.getByText('Fatima Felippe');
        expect(title.style.fontWeight).toBe('1000');
        const ir = container.querySelector('.search .btn') as HTMLElement;
        expect(ir).toHaveTextContent('Ir');
        expect(ir.getAttribute('style')).toBeNull();
    });

    it('destaque: título é <h1> e o resumo usa a classe .excerpt', async () => {
        const { container } = setup();
        const h1 = await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        expect(within(container.querySelector('.lead-article') as HTMLElement).getByRole('heading', { level: 1 })).toBe(h1);
        expect(container.querySelector('.lead-article p.excerpt')).toHaveTextContent('Resumo 1');
    });

    it('cards laterais: título h4 sem font-size próprio (16px padrão)', async () => {
        const { container } = setup();
        await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        const h4 = container.querySelector('.card-small h4') as HTMLElement;
        expect(h4.style.fontSize).toBe('');
    });

    it('chips: só Direito Civil e Reflexões ganham classe azul; as demais usam o padrão', async () => {
        const { container } = setup();
        await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        const chips = [...container.querySelectorAll('.category')];
        const lead = container.querySelector('.lead-article .category') as HTMLElement;
        expect(lead.className).toContain('direito-civil');
        expect(chips.some(c => c.className.includes('direito-do-trabalho'))).toBe(true);
        const reflexaoChips = chips.filter(c => c.textContent === 'Reflexão');
        expect(reflexaoChips.length).toBeGreaterThan(0);
        for (const c of reflexaoChips) expect(c.className).toContain('reflexoes');
    });

    it('paginação: lista todas as páginas (23 artigos fora o destaque = 6 páginas) e aparece mesmo com 1 página só', async () => {
        const { container } = setup();
        await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        await waitFor(() => expect(container.querySelectorAll('.pagination').length).toBe(3));
        const [artigos, reflexoes, noticias] = [...container.querySelectorAll('.pagination')].map(p => [...p.querySelectorAll('button')].map(b => b.textContent));
        expect(artigos).toEqual(['« Anterior', '1', '2', '3', '4', '5', '6', 'Próxima »']);
        expect(reflexoes).toEqual(['« Anterior', '1', '2', 'Próxima »']);
        expect(noticias).toEqual(['« Anterior', '1', 'Próxima »']);
    });

    it('rodapé: sem o botão "Área de desenvolvimento" e com o link de privacidade', async () => {
        setup();
        await screen.findByRole('heading', { name: 'Título 1', level: 1 });
        expect(screen.queryByText('Área de desenvolvimento')).toBeNull();
        expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toBeInTheDocument();
    });

    it('contadores do hero seguem a fórmula do original (34 itens → +30 artigos)', async () => {
        // No jsdom o relógio do requestAnimationFrame não bate com o performance.now();
        // aqui a animação é "adiantada" para o valor final, só para testar a conta.
        const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
            cb => window.setTimeout(() => cb(performance.now() + 5000), 0)
        );
        try {
            const { container } = setup();
            await screen.findByRole('heading', { name: 'Título 1', level: 1 });
            // 24 + 7 + 3 = 34 → floor(34 × 0,9) = 30 ; tópicos = tags únicas dos artigos = 24 ;
            // minutos: 34 × 10 = 340 → floor(340 × 0,9) = 306
            await waitFor(() => {
                const nums = [...container.querySelectorAll('.stat-number')].map(n => n.textContent);
                expect(nums).toEqual(['+30', '+24', '+306']);
            }, { timeout: 3000 });
        } finally {
            raf.mockRestore();
        }
    });
});
