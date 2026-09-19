import { describe, it, expect } from 'vitest';
import { toTitleCase } from './titleCase';

describe('toTitleCase', () => {
    it('capitaliza a primeira letra de cada palavra', () => {
        expect(toTitleCase('direito civil')).toBe('Direito Civil');
    });

    it('deixa o resto da palavra em minúsculo, mesmo vindo em caixa alta', () => {
        expect(toTitleCase('DIREITO CONSTITUCIONAL')).toBe('Direito Constitucional');
    });

    it('capitaliza depois de hífen', () => {
        expect(toTitleCase('guarda-chuva jurídico')).toBe('Guarda-Chuva Jurídico');
    });

    it('retorna string vazia para entrada vazia ou nula', () => {
        expect(toTitleCase('')).toBe('');
        // @ts-expect-error — testa o guard de runtime contra valores nulos/undefined
        expect(toTitleCase(null)).toBe('');
    });

    it('preserva espaçamento múltiplo entre palavras', () => {
        expect(toTitleCase('direito  civil')).toBe('Direito  Civil');
    });
});
