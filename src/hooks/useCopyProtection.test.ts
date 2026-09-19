import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCopyProtection } from './useCopyProtection';

const copy = () => document.dispatchEvent(new Event('copy'));

describe('useCopyProtection', () => {
    let alertSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    });
    afterEach(() => {
        alertSpy.mockRestore();
    });

    it('por padrão avisa (citando a fonte) quando alguém copia texto', () => {
        renderHook(() => useCopyProtection());
        copy();
        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertSpy.mock.calls[0][0]).toContain('fatimafelippe.com.br');
    });

    it('desligado (painel administrativo) não avisa', () => {
        renderHook(() => useCopyProtection(false));
        copy();
        expect(alertSpy).not.toHaveBeenCalled();
    });

    it('liga e desliga junto com a rota (site → admin → site)', () => {
        const { rerender } = renderHook(({ on }) => useCopyProtection(on), { initialProps: { on: true } });
        copy();
        expect(alertSpy).toHaveBeenCalledTimes(1);

        rerender({ on: false });
        copy();
        expect(alertSpy).toHaveBeenCalledTimes(1);

        rerender({ on: true });
        copy();
        expect(alertSpy).toHaveBeenCalledTimes(2);
    });

    it('remove o ouvinte ao desmontar', () => {
        const { unmount } = renderHook(() => useCopyProtection());
        unmount();
        copy();
        expect(alertSpy).not.toHaveBeenCalled();
    });
});
