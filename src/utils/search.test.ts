import { describe, it, expect } from 'vitest';
import { normalize, tokenize, matchesAllTokens } from './search';
import type { Article } from '../data/content';

describe('normalize', () => {
    it('coloca em minúsculas', () => {
        expect(normalize('DIREITO')).toBe('direito');
    });

    it('remove acentos', () => {
        expect(normalize('Constituição')).toBe('constituicao');
        expect(normalize('Ação')).toBe('acao');
    });
});

describe('tokenize', () => {
    it('divide a query em palavras, ignorando espaços extras', () => {
        expect(tokenize('  direito   civil  ')).toEqual(['direito', 'civil']);
    });

    it('retorna array vazio para query vazia', () => {
        expect(tokenize('')).toEqual([]);
        expect(tokenize('   ')).toEqual([]);
    });
});

describe('matchesAllTokens', () => {
    const baseArticle: Article = {
        id: 1,
        category: 'civil',
        categoryName: 'Direito Civil',
        date: '01 de janeiro de 2025',
        readTime: '5 min',
        title: 'Curatela e Proteção da Pessoa Idosa',
        excerpt: 'Um resumo sobre curatela no direito brasileiro',
        image: 'https://example.com/img.jpg',
        author: 'Redação',
        tags: ['Curatela', 'Proteção'],
        content: '<p>Conteúdo <strong>completo</strong> sobre o tema</p>',
    };

    it('casa quando todos os tokens aparecem em algum campo (título, resumo, tags, conteúdo)', () => {
        expect(matchesAllTokens(baseArticle, ['curatela'])).toBe(true);
        expect(matchesAllTokens(baseArticle, ['proteção'])).toBe(true);
        expect(matchesAllTokens(baseArticle, ['completo'])).toBe(true);
    });

    it('ignora acentuação ao comparar', () => {
        expect(matchesAllTokens(baseArticle, ['protecao'])).toBe(true);
    });

    it('exige que TODOS os tokens estejam presentes (AND, não OR)', () => {
        expect(matchesAllTokens(baseArticle, ['curatela', 'idosa'])).toBe(true);
        expect(matchesAllTokens(baseArticle, ['curatela', 'trabalhista'])).toBe(false);
    });

    it('ignora tags HTML do conteúdo ao buscar', () => {
        expect(matchesAllTokens(baseArticle, ['strong'])).toBe(false);
    });

    it('não quebra quando content está ausente (ex.: vindo de uma listagem com select enxuto)', () => {
        const withoutContent: Article = { ...baseArticle, content: undefined };
        expect(matchesAllTokens(withoutContent, ['curatela'])).toBe(true);
        expect(matchesAllTokens(withoutContent, ['completo'])).toBe(false);
    });
});
