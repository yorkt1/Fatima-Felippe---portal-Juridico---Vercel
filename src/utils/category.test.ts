import { describe, it, expect } from 'vitest';
import { categorySlug, categoryClass } from './category';

describe('categorySlug', () => {
    it('gera o slug sem acento, em minúsculas e com hífens', () => {
        expect(categorySlug('Direito Civil')).toBe('direito-civil');
        expect(categorySlug('Finanças Públicas')).toBe('financas-publicas');
        expect(categorySlug('Previdenciário')).toBe('previdenciario');
        expect(categorySlug('Direito TRIBUTÁRIO')).toBe('direito-tributario');
    });

    it('ignora espaços e símbolos nas pontas e no meio', () => {
        expect(categorySlug('  Direito   do Trabalho! ')).toBe('direito-do-trabalho');
    });

    it('não quebra com valor vazio', () => {
        expect(categorySlug('')).toBe('');
    });
});

describe('categoryClass', () => {
    it('usa o slug da subcategoria', () => {
        expect(categoryClass('Direito Civil')).toBe('direito-civil');
        expect(categoryClass('Notícias')).toBe('noticias');
    });

    it('itens de Reflexões sempre usam a classe "reflexoes", qualquer que seja o nome', () => {
        expect(categoryClass('Reflexão', true)).toBe('reflexoes');
        expect(categoryClass('MUDANÇAS', true)).toBe('reflexoes');
    });
});
