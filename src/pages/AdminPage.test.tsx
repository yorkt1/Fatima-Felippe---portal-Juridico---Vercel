import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Article } from '../data/content';

const mocks = vi.hoisted(() => ({
    rows: [] as unknown[],
    session: null as unknown,
    selectError: null as unknown,
    updateError: null as unknown,
    deleteError: null as unknown,
    updates: [] as Array<{ payload: unknown; col: string; val: unknown }>,
    deletes: [] as Array<{ col: string; val: unknown }>,
    listTypes: [] as unknown[],
    signOut: vi.fn(),
}));

// Banco de mentira: cada consulta é um objeto "encadeável" que também pode ser
// aguardado (como o query builder do supabase-js), e que resolve com { data, error }.
vi.mock('../services/supabase', () => {
    const chain = (result: () => unknown, onEq?: (col: string, val: unknown) => void) => {
        const c: Record<string, unknown> = {};
        c.eq = (col: string, val: unknown) => { onEq?.(col, val); return c; };
        c.order = () => c;
        c.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result()).then(resolve, reject);
        return c;
    };
    return {
        supabase: {
            auth: {
                getSession: () => Promise.resolve({ data: { session: mocks.session } }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
                signOut: mocks.signOut,
            },
            from: () => ({
                select: (_cols: string, opts?: { head?: boolean }) => opts?.head
                    ? chain(() => ({ count: mocks.rows.length, error: null }))
                    : chain(
                        () => ({ data: mocks.rows, error: mocks.selectError }),
                        (col, val) => { if (col === 'type') mocks.listTypes.push(val); },
                    ),
                update: (payload: unknown) => ({
                    eq: (col: string, val: unknown) => {
                        mocks.updates.push({ payload, col, val });
                        return Promise.resolve({ error: mocks.updateError });
                    },
                }),
                delete: () => ({
                    eq: (col: string, val: unknown) => {
                        mocks.deletes.push({ col, val });
                        return Promise.resolve({ error: mocks.deleteError });
                    },
                }),
            }),
        },
    };
});

// Os formulários (com o editor rico) têm testes próprios; aqui viram marcadores.
vi.mock('../components/ArticleForm', () => ({
    default: ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => (
        <div>
            <p>formulario-de-conteudo</p>
            <button type="button" onClick={onCancel}>voltar-do-formulario</button>
            <button type="button" onClick={onSuccess}>salvar-do-formulario</button>
        </div>
    ),
}));
vi.mock('../components/SiteSettingsForm', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div>
            <p>formulario-textos-do-site</p>
            <button type="button" onClick={onClose}>fechar-textos</button>
        </div>
    ),
}));

import AdminPage from './AdminPage';

const article = (id: number, extra: Partial<Article>): Article => ({
    id,
    type: 'artigos',
    category: 'artigo',
    categoryName: 'Direito Civil',
    date: '11 de janeiro de 2026',
    readTime: '5 min de leitura',
    title: `Título ${id}`,
    excerpt: `Resumo ${id}`,
    image: '',
    author: 'Redação',
    featured: false,
    position: id,
    ...extra,
});

const ROWS: Article[] = [
    article(1, { title: 'Reforma tributária em debate', categoryName: 'Direito Tributário', featured: true }),
    article(2, { title: 'Ação de indenização por danos', author: 'Fátima T. Felippe' }),
    article(3, { title: 'Prisão preventiva e seus limites', categoryName: 'Direito Penal' }),
];

const EMAIL = 'admin@fatimafelippe.com.br';

async function renderAdmin(waitForText: string | null = ROWS[0].title) {
    render(
        <MemoryRouter initialEntries={['/admin']}>
            <Routes>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin-login" element={<p>tela-de-login</p>} />
            </Routes>
        </MemoryRouter>
    );
    if (waitForText) await screen.findByText(waitForText);
    // Espera sessão e contagens das abas, para não sobrar atualização "solta" depois do teste.
    await screen.findByText(EMAIL);
    await waitFor(() => expect(screen.getByRole('button', { name: /Notícias/ })).toHaveTextContent(String(mocks.rows.length)));
}

const titles = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);

describe('AdminPage', () => {
    beforeEach(() => {
        mocks.rows = ROWS.map(r => ({ ...r }));
        mocks.session = { user: { email: EMAIL } };
        mocks.selectError = null;
        mocks.updateError = null;
        mocks.deleteError = null;
        mocks.updates.length = 0;
        mocks.deletes.length = 0;
        mocks.listTypes.length = 0;
        mocks.signOut.mockReset().mockResolvedValue({});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('acesso e carregamento', () => {
        it('lista os itens do tipo, mostra o e-mail e a contagem em cada aba', async () => {
            await renderAdmin();

            expect(screen.getByRole('heading', { level: 1, name: 'Artigos' })).toBeInTheDocument();
            expect(titles()).toEqual(ROWS.map(r => r.title));
            expect(screen.getByRole('button', { name: /Artigos/ })).toHaveTextContent('3');
            expect(screen.getByRole('button', { name: /Reflexões/ })).toHaveTextContent('3');
            // O item em destaque é sinalizado
            expect(screen.getAllByText('Destaque')).toHaveLength(1);
        });

        it('sem sessão volta para a tela de login', async () => {
            mocks.session = null;
            render(
                <MemoryRouter initialEntries={['/admin']}>
                    <Routes>
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/admin-login" element={<p>tela-de-login</p>} />
                    </Routes>
                </MemoryRouter>
            );
            expect(await screen.findByText('tela-de-login')).toBeInTheDocument();
        });

        it('"Sair" encerra a sessão e leva ao login', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            await user.click(screen.getByRole('button', { name: 'Sair' }));
            expect(mocks.signOut).toHaveBeenCalledTimes(1);
            expect(await screen.findByText('tela-de-login')).toBeInTheDocument();
        });

        it('trocar de aba busca o tipo certo e muda o título', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            expect(mocks.listTypes.at(-1)).toBe('artigos');

            await user.click(screen.getByRole('button', { name: /Reflexões/ }));
            expect(await screen.findByRole('heading', { level: 1, name: 'Reflexões' })).toBeInTheDocument();
            expect(mocks.listTypes.at(-1)).toBe('reflexoes');
        });

        it('erro ao carregar mostra um alerta com a causa', async () => {
            mocks.rows = [];
            mocks.selectError = { message: 'boom' };
            await renderAdmin(null);
            expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao carregar conteúdo: boom');
        });

        it('tabela inexistente orienta a rodar o SQL', async () => {
            mocks.rows = [];
            mocks.selectError = { code: 'PGRST205', message: 'not found' };
            await renderAdmin(null);
            expect(await screen.findByRole('alert')).toHaveTextContent('Execute o script SQL');
        });
    });

    describe('lista vazia e navegação', () => {
        it('sem itens convida a criar o primeiro e abre o formulário (abas escondidas)', async () => {
            const user = userEvent.setup();
            mocks.rows = [];
            await renderAdmin('Nenhum artigo ainda');

            const nav = screen.getByRole('navigation', { name: 'Seções do painel' });
            expect(nav).toBeInTheDocument();

            const emptyState = screen.getByText('Nenhum artigo ainda').closest('.adm-empty') as HTMLElement;
            await user.click(within(emptyState).getByRole('button', { name: 'Novo artigo' }));

            expect(screen.getByText('formulario-de-conteudo')).toBeInTheDocument();
            expect(screen.queryByRole('navigation', { name: 'Seções do painel' })).not.toBeInTheDocument();

            await user.click(screen.getByText('voltar-do-formulario'));
            expect(screen.getByRole('heading', { level: 1, name: 'Artigos' })).toBeInTheDocument();
            expect(screen.getByRole('navigation', { name: 'Seções do painel' })).toBeInTheDocument();
        });

        it('salvar no formulário avisa, volta para a lista e recarrega', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            await user.click(screen.getByRole('button', { name: /Novo artigo/ }));
            const before = mocks.listTypes.length;

            await user.click(screen.getByText('salvar-do-formulario'));

            expect(await screen.findByText('Conteúdo criado!')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 1, name: 'Artigos' })).toBeInTheDocument();
            await waitFor(() => expect(mocks.listTypes.length).toBeGreaterThan(before));
        });

        it('"Textos do site" abre o formulário de textos e dá para fechar', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            await user.click(screen.getByRole('button', { name: /Textos do site/ }));
            expect(screen.getByText('formulario-textos-do-site')).toBeInTheDocument();

            await user.click(screen.getByText('fechar-textos'));
            expect(screen.getByRole('heading', { level: 1, name: 'Artigos' })).toBeInTheDocument();
        });
    });

    describe('busca', () => {
        it('ignora acentos e maiúsculas, e mostra "N de M"', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            const search = screen.getByRole('searchbox', { name: 'Buscar conteúdos' });

            await user.type(search, 'PRISAO');
            expect(titles()).toEqual(['Prisão preventiva e seus limites']);
            expect(screen.getByText('1 de 3')).toBeInTheDocument();

            await user.clear(search);
            await user.type(search, 'fatima'); // acha pelo autor "Fátima"
            expect(titles()).toEqual(['Ação de indenização por danos']);
        });

        it('sem resultado mostra "Nada encontrado" e "Limpar busca" restaura a lista', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            await user.type(screen.getByRole('searchbox', { name: 'Buscar conteúdos' }), 'zzzzzz');

            expect(screen.getByText('Nada encontrado')).toBeInTheDocument();
            // O botão do estado vazio (com texto) — o "x" da caixa tem só aria-label.
            await user.click(screen.getByText('Limpar busca', { selector: 'button' }));

            expect(titles()).toEqual(ROWS.map(r => r.title));
            expect(screen.getByRole('searchbox', { name: 'Buscar conteúdos' })).toHaveValue('');
        });

        it('reordenar fica desligado enquanto há busca (a lista está incompleta)', async () => {
            const user = userEvent.setup();
            await renderAdmin();
            const label = 'Posição de "Reforma tributária em debate"';
            expect(screen.getByLabelText(label)).toBeEnabled();

            await user.type(screen.getByRole('searchbox', { name: 'Buscar conteúdos' }), 'reforma');
            expect(screen.getByLabelText(label)).toBeDisabled();
        });
    });

    describe('reordenar', () => {
        it('digitar a posição move o item e grava a posição de todos', async () => {
            const user = userEvent.setup();
            await renderAdmin();

            const input = screen.getByLabelText('Posição de "Reforma tributária em debate"');
            await user.clear(input);
            await user.type(input, '3');
            await user.tab(); // sair do campo confirma

            expect(await screen.findByText('Ordem atualizada com sucesso')).toBeInTheDocument();
            expect(titles()).toEqual([
                'Ação de indenização por danos',
                'Prisão preventiva e seus limites',
                'Reforma tributária em debate',
            ]);
            expect(mocks.updates).toEqual([
                { payload: { position: 1 }, col: 'id', val: 2 },
                { payload: { position: 2 }, col: 'id', val: 3 },
                { payload: { position: 3 }, col: 'id', val: 1 },
            ]);
        });

        it('posição fora do intervalo é ajustada para o limite', async () => {
            const user = userEvent.setup();
            await renderAdmin();

            const input = screen.getByLabelText('Posição de "Reforma tributária em debate"');
            await user.clear(input);
            await user.type(input, '99');
            await user.tab();

            await screen.findByText('Ordem atualizada com sucesso');
            expect(titles().at(-1)).toBe('Reforma tributária em debate');
        });

        it('falha ao gravar avisa e recarrega a ordem do servidor', async () => {
            const user = userEvent.setup();
            mocks.updateError = { message: 'sem permissão' };
            await renderAdmin();
            const loadsBefore = mocks.listTypes.length;

            const input = screen.getByLabelText('Posição de "Reforma tributária em debate"');
            await user.clear(input);
            await user.type(input, '2');
            await user.tab();

            expect(await screen.findByText('Erro ao salvar a nova ordem')).toBeInTheDocument();
            await waitFor(() => expect(mocks.listTypes.length).toBeGreaterThan(loadsBefore));
        });
    });

    describe('destaque', () => {
        it('destacar um item desmarca os outros do mesmo tipo (2 gravações)', async () => {
            const user = userEvent.setup();
            await renderAdmin();

            await user.click(screen.getByRole('button', { name: 'Destacar "Prisão preventiva e seus limites"' }));

            expect(await screen.findByText('Destaque definido!')).toBeInTheDocument();
            expect(mocks.updates).toEqual([
                { payload: { featured: false }, col: 'type', val: 'artigos' },
                { payload: { featured: true }, col: 'id', val: 3 },
            ]);
            // Agora só o 3 está em destaque
            expect(screen.getByRole('button', { name: 'Remover destaque de "Prisão preventiva e seus limites"' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Destacar "Reforma tributária em debate"' })).toBeInTheDocument();
        });

        it('remover o destaque grava só aquele item', async () => {
            const user = userEvent.setup();
            await renderAdmin();

            await user.click(screen.getByRole('button', { name: 'Remover destaque de "Reforma tributária em debate"' }));

            expect(await screen.findByText('Destaque removido')).toBeInTheDocument();
            expect(mocks.updates).toEqual([{ payload: { featured: false }, col: 'id', val: 1 }]);
        });

        it('erro ao gravar o destaque avisa o usuário', async () => {
            const user = userEvent.setup();
            mocks.updateError = { message: 'sem permissão' };
            await renderAdmin();

            await user.click(screen.getByRole('button', { name: 'Destacar "Prisão preventiva e seus limites"' }));
            expect(await screen.findByText('Erro ao alterar destaque')).toBeInTheDocument();
        });
    });

    describe('excluir', () => {
        const deleteButton = 'Excluir "Prisão preventiva e seus limites"';

        it('pede confirmação citando o título; cancelar não apaga nada', async () => {
            const user = userEvent.setup();
            await renderAdmin();

            await user.click(screen.getByRole('button', { name: deleteButton }));
            const dialog = screen.getByRole('dialog', { name: 'Excluir este item?' });
            expect(dialog).toHaveTextContent('Prisão preventiva e seus limites');

            await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(mocks.deletes).toHaveLength(0);
            expect(titles()).toHaveLength(3);
        });

        it('confirmar apaga pelo id, tira da lista e atualiza as contagens', async () => {
            const user = userEvent.setup();
            await renderAdmin();

            await user.click(screen.getByRole('button', { name: deleteButton }));
            const dialog = screen.getByRole('dialog', { name: 'Excluir este item?' });
            mocks.rows = mocks.rows.filter(r => (r as Article).id !== 3); // o "banco" também perde o item
            await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

            expect(await screen.findByText('Item excluído com sucesso')).toBeInTheDocument();
            expect(mocks.deletes).toEqual([{ col: 'id', val: 3 }]);
            expect(titles()).toEqual(['Reforma tributária em debate', 'Ação de indenização por danos']);
            await waitFor(() => expect(screen.getByRole('button', { name: /Artigos/ })).toHaveTextContent('2'));
        });

        it('erro ao excluir mantém o item na lista e avisa', async () => {
            const user = userEvent.setup();
            mocks.deleteError = { message: 'sem permissão' };
            await renderAdmin();

            await user.click(screen.getByRole('button', { name: deleteButton }));
            await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));

            expect(await screen.findByText('Erro ao excluir item')).toBeInTheDocument();
            expect(titles()).toHaveLength(3);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});
