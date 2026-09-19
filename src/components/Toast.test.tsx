import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useToast } from './Toast';

// Formulário de mentira: re-renderiza por conta própria (como o ArticleForm faz
// a cada tecla) e dispara avisos de cada tipo.
function Harness() {
    const { showToast, ToastComponent } = useToast();
    const [renders, setRenders] = useState(0);
    return (
        <div>
            <button type="button" onClick={() => showToast('Salvo!', 'success')}>sucesso</button>
            <button type="button" onClick={() => showToast('Falhou', 'error')}>erro</button>
            <button type="button" onClick={() => setRenders(n => n + 1)}>digitar ({renders})</button>
            {ToastComponent}
        </div>
    );
}

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe('useToast', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('mostra o aviso de sucesso e o esconde depois de 4 segundos', () => {
        render(<Harness />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('sucesso'));
        expect(screen.getByRole('status')).toHaveTextContent('Salvo!');

        advance(3999);
        expect(screen.getByRole('status')).toBeInTheDocument();
        advance(1);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('erros usam role="alert" e ficam mais tempo na tela (6 segundos)', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('erro'));
        expect(screen.getByRole('alert')).toHaveTextContent('Falhou');

        advance(4000);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        advance(2000);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('re-renderizar o formulário NÃO reinicia o temporizador (o aviso sempre some)', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('sucesso'));

        advance(3000);
        // O usuário continua digitando: o componente pai renderiza de novo.
        fireEvent.click(screen.getByText(/digitar/));
        fireEvent.click(screen.getByText(/digitar/));
        advance(1000);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('o botão "Fechar aviso" dispensa na hora', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('sucesso'));
        fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('um novo aviso substitui o anterior e recomeça a contagem', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('sucesso'));
        advance(3000);

        fireEvent.click(screen.getByText('erro'));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Falhou');

        advance(5999);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        advance(1);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
