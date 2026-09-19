import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

function setup(props: Partial<ComponentProps<typeof ConfirmModal>> = {}) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const utils = render(
        <ConfirmModal
            isOpen
            title="Excluir este item?"
            message="Essa ação não pode ser desfeita."
            confirmLabel="Excluir"
            onConfirm={onConfirm}
            onCancel={onCancel}
            {...props}
        />
    );
    return { onConfirm, onCancel, ...utils };
}

describe('ConfirmModal', () => {
    it('não renderiza nada quando está fechado', () => {
        setup({ isOpen: false });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('é um diálogo acessível, com título e descrição', () => {
        setup();
        const dialog = screen.getByRole('dialog', { name: 'Excluir este item?' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleDescription('Essa ação não pode ser desfeita.');
    });

    it('abre com o foco no botão seguro (cancelar), não no destrutivo', () => {
        setup();
        expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    it('Esc cancela', async () => {
        const user = userEvent.setup();
        const { onCancel, onConfirm } = setup();
        await user.keyboard('{Escape}');
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('clicar no fundo cancela, mas clicar dentro do diálogo não', () => {
        const { onCancel, container } = setup();
        fireEvent.mouseDown(screen.getByRole('dialog'));
        expect(onCancel).not.toHaveBeenCalled();

        fireEvent.mouseDown(container.querySelector('.adm-overlay') as HTMLElement);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('o botão de confirmar chama onConfirm (e só ele)', async () => {
        const user = userEvent.setup();
        const { onConfirm, onCancel } = setup();
        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('Tab não escapa do diálogo: do último botão volta ao primeiro e vice-versa', async () => {
        const user = userEvent.setup();
        setup();
        const cancel = screen.getByRole('button', { name: 'Cancelar' });
        const confirm = screen.getByRole('button', { name: 'Excluir' });

        expect(cancel).toHaveFocus();
        await user.tab();
        expect(confirm).toHaveFocus();
        await user.tab();
        expect(cancel).toHaveFocus(); // deu a volta

        await user.tab({ shift: true });
        expect(confirm).toHaveFocus(); // deu a volta no sentido contrário
    });

    it('usa os rótulos e a cor da variante informada', () => {
        setup({ variant: 'primary', confirmLabel: 'Descartar', cancelLabel: 'Continuar editando' });
        expect(screen.getByRole('button', { name: 'Continuar editando' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Descartar' })).toHaveClass('adm-btn--primary');
    });

    it('a variante padrão é destrutiva (vermelha)', () => {
        setup();
        expect(screen.getByRole('button', { name: 'Excluir' })).toHaveClass('adm-btn--danger');
    });
});
