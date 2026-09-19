import { describe, expect, it } from 'vitest';
import { resolveStatValue } from '../utils/stats';

describe('resolveStatValue', () => {
    it('usa a contagem automática enquanto o modo não for personalizado', () => {
        expect(resolveStatValue('automatic', '999', 34)).toBe(34);
        expect(resolveStatValue('', '', 340)).toBe(340);
    });

    it('aceita um valor inteiro personalizado, inclusive zero', () => {
        expect(resolveStatValue('custom', '30', 34)).toBe(30);
        expect(resolveStatValue('custom', '0', 34)).toBe(0);
    });

    it('mantém a contagem automática se o valor personalizado for inválido', () => {
        expect(resolveStatValue('custom', '', 34)).toBe(34);
        expect(resolveStatValue('custom', '-1', 34)).toBe(34);
        expect(resolveStatValue('custom', '12.5', 34)).toBe(34);
    });
});
