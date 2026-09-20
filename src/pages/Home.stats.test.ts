import { describe, expect, it } from 'vitest';
import { resolveStatValue } from '../utils/stats';

describe('resolveStatValue', () => {
    it('usa a contagem automática com a regra de cerca de 90% do valor real', () => {
        expect(resolveStatValue('automatic', '999', 34)).toBe(31);
        expect(resolveStatValue('automatic', '999', 85)).toBe(77);
        expect(resolveStatValue('automatic', '999', 373)).toBe(336);
        expect(resolveStatValue('', '', 340)).toBe(306);
    });

    it('aceita um valor inteiro personalizado, inclusive zero', () => {
        expect(resolveStatValue('custom', '30', 34)).toBe(30);
        expect(resolveStatValue('custom', '0', 34)).toBe(0);
    });

    it('mantém a contagem automática em 90% do valor real se o valor personalizado for inválido', () => {
        expect(resolveStatValue('custom', '', 34)).toBe(31);
        expect(resolveStatValue('custom', '-1', 34)).toBe(31);
        expect(resolveStatValue('custom', '12.5', 34)).toBe(31);
    });
});
