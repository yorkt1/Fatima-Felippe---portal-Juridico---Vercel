import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Article } from '../../data/content';

const mocks = vi.hoisted(() => ({
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
}));

vi.mock('../../services/supabase', () => ({
    supabase: {
        from: () => ({ insert: mocks.insert, update: mocks.update }),
        storage: { from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn() }) },
    },
}));

import ArticleForm from './index';

const EXISTING: Article = {
    id: 7,
    type: 'reflexoes',
    category: 'reflexao',
    categoryName: 'Reflexões',
    date: '2 de fevereiro de 2026',
    readTime: '3 min de leitura',
    title: 'O poder da vontade',
    excerpt: 'Uma reflexão curta.',
    image: '',
    author: 'Fátima T. Felippe',
    tags: ['Vontade'],
    content: '<p>Texto</p>',
};

function setup(props: { type?: string; initialData?: Article | null } = {}) {
    const onCancel = vi.fn();
    const onSuccess = vi.fn();
    render(<ArticleForm type={props.type ?? 'artigos'} initialData={props.initialData ?? null} onCancel={onCancel} onSuccess={onSuccess} />);
    return { onCancel, onSuccess, user: userEvent.setup() };
}

const field = (name: RegExp) => screen.getByRole('textbox', { name });

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
    await user.type(field(/^Título/), 'Meu novo artigo');
    await user.type(field(/^Resumo/), 'Resumo do artigo.');
    await user.type(field(/^Categoria/), 'Direito Civil');
}

describe('ArticleForm — alterações, descarte e salvamento', () => {
    beforeEach(() => {
        mocks.insert.mockReset().mockResolvedValue({ error: null });
        mocks.eq.mockReset().mockResolvedValue({ error: null });
        mocks.update.mockReset().mockReturnValue({ eq: mocks.eq });
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('descartar alterações', () => {
        it('sem mexer em nada, "Cancelar" sai na hora, sem perguntar', async () => {
            const { user, onCancel } = setup();
            expect(screen.getByText(/Nada foi salvo ainda/)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Cancelar' }));
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('com alterações mostra o selo e pede confirmação antes de sair', async () => {
            const { user, onCancel } = setup();
            await user.type(field(/^Título/), 'Rascunho');
            expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Cancelar' }));
            const dialog = screen.getByRole('dialog', { name: 'Descartar alterações?' });
            expect(onCancel).not.toHaveBeenCalled();

            // "Continuar editando" fecha o aviso e mantém o que foi digitado
            await user.click(within(dialog).getByRole('button', { name: 'Continuar editando' }));
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(onCancel).not.toHaveBeenCalled();
            expect(field(/^Título/)).toHaveValue('Rascunho');

            // "Descartar" sai de verdade
            await user.click(screen.getByRole('button', { name: 'Cancelar' }));
            await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descartar' }));
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        it('o link "Voltar" do topo também respeita as alterações pendentes', async () => {
            const { user, onCancel } = setup();
            await user.type(field(/^Título/), 'Rascunho');
            await user.click(screen.getByRole('button', { name: /Voltar para Artigos/ }));

            expect(screen.getByRole('dialog', { name: 'Descartar alterações?' })).toBeInTheDocument();
            expect(onCancel).not.toHaveBeenCalled();
        });

        it('voltar ao valor original desfaz o "não salvo"', async () => {
            const { user } = setup({ initialData: EXISTING });
            expect(screen.getByText(/Nenhuma alteração pendente/)).toBeInTheDocument();

            const title = field(/^Título/);
            await user.type(title, '!');
            expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();
            await user.type(title, '{Backspace}');
            expect(screen.queryByText('Alterações não salvas')).not.toBeInTheDocument();
        });

        it('fechar a aba só é bloqueado pelo navegador quando há alterações', async () => {
            const { user } = setup();
            const clean = new Event('beforeunload', { cancelable: true });
            window.dispatchEvent(clean);
            expect(clean.defaultPrevented).toBe(false);

            await user.type(field(/^Título/), 'Rascunho');
            const dirty = new Event('beforeunload', { cancelable: true });
            window.dispatchEvent(dirty);
            expect(dirty.defaultPrevented).toBe(true);
        });
    });

    describe('salvar', () => {
        it('cria o conteúdo: categoria vem do tipo e tags vazias são descartadas', async () => {
            const { user, onSuccess } = setup({ type: 'reflexoes' });
            await fillRequired(user);
            fireEvent.change(field(/^Tags/), { target: { value: 'Direito Civil, , Emendas,' } });

            await user.click(screen.getByRole('button', { name: /Salvar/ }));

            await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
            expect(mocks.insert).toHaveBeenCalledTimes(1);
            const [rows] = mocks.insert.mock.calls[0];
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({
                type: 'reflexoes',
                category: 'reflexao',
                categoryName: 'Direito Civil',
                title: 'Meu novo artigo',
                excerpt: 'Resumo do artigo.',
                author: 'Fátima T. Felippe',
                tags: ['Direito Civil', 'Emendas'],
            });
            expect(mocks.update).not.toHaveBeenCalled();
        });

        it('sem os campos obrigatórios não grava nada', async () => {
            const { user, onSuccess } = setup();
            await user.type(field(/^Título/), 'Só o título');
            await user.click(screen.getByRole('button', { name: /Salvar/ }));

            expect(mocks.insert).not.toHaveBeenCalled();
            expect(onSuccess).not.toHaveBeenCalled();
        });

        it('Ctrl+S salva, passando pela mesma validação', async () => {
            const { user, onSuccess } = setup();

            // Formulário incompleto: o atalho não grava
            await user.type(field(/^Título/), 'Incompleto');
            await user.keyboard('{Control>}s{/Control}');
            expect(mocks.insert).not.toHaveBeenCalled();

            // Completo: o atalho grava
            await user.type(field(/^Resumo/), 'Resumo do artigo.');
            await user.type(field(/^Categoria/), 'Direito Civil');
            await user.keyboard('{Control>}s{/Control}');
            await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
            expect(mocks.insert).toHaveBeenCalledTimes(1);
        });

        it('editando um item existente atualiza pelo id, sem inserir outro', async () => {
            const { user, onSuccess } = setup({ type: 'reflexoes', initialData: EXISTING });
            await user.type(field(/^Título/), ' (revisado)');
            await user.click(screen.getByRole('button', { name: /Salvar/ }));

            await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
            expect(mocks.insert).not.toHaveBeenCalled();
            expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'O poder da vontade (revisado)', type: 'reflexoes' }));
            expect(mocks.eq).toHaveBeenCalledWith('id', 7);
        });

        it('erro do banco avisa o usuário e não conclui', async () => {
            mocks.insert.mockResolvedValue({ error: { message: 'sem permissão' } });
            const { user, onSuccess } = setup();
            await fillRequired(user);
            await user.click(screen.getByRole('button', { name: /Salvar/ }));

            expect(await screen.findByText(/Erro ao salvar conteúdo/)).toBeInTheDocument();
            expect(onSuccess).not.toHaveBeenCalled();
            // O botão volta a ficar disponível para tentar de novo
            expect(screen.getByRole('button', { name: /Salvar/ })).toBeEnabled();
        });
    });

    describe('mudança de tipo', () => {
        it('avisa que o link antigo deixa de funcionar ao mover o item de tipo', async () => {
            const { user } = setup({ type: 'reflexoes', initialData: EXISTING });
            expect(screen.queryByText(/o link antigo/)).not.toBeInTheDocument();

            await user.selectOptions(screen.getByLabelText(/^Tipo de conteúdo/), 'noticias');
            expect(screen.getByText(/o link antigo \(reflexao\/7\)/)).toBeInTheDocument();
        });
    });
});
