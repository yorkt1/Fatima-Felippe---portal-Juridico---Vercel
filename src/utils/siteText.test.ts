import { describe, it, expect } from 'vitest';
import { parseLines, parsePairs, safeHttpUrl } from './siteText';

describe('parseLines', () => {
    it('separa por linha, tira espaços e ignora linhas vazias', () => {
        expect(parseLines('  Civil \n\n Penal\n   \nTributário')).toEqual(['Civil', 'Penal', 'Tributário']);
    });

    it('devolve lista vazia para texto vazio', () => {
        expect(parseLines('')).toEqual([]);
    });
});

describe('parsePairs', () => {
    it('separa título e descrição pelo primeiro "|"', () => {
        expect(parsePairs('Graduação em Direito | Faculdade X')).toEqual([
            { title: 'Graduação em Direito', text: 'Faculdade X' },
        ]);
    });

    it('mantém "|" extras dentro da descrição', () => {
        expect(parsePairs('Título | parte 1 | parte 2')).toEqual([
            { title: 'Título', text: 'parte 1 | parte 2' },
        ]);
    });

    it('linha sem "|" vira só título', () => {
        expect(parsePairs('Só título')).toEqual([{ title: 'Só título', text: '' }]);
    });

    it('lida com várias linhas e ignora as vazias', () => {
        expect(parsePairs('A | 1\n\nB | 2')).toEqual([
            { title: 'A', text: '1' },
            { title: 'B', text: '2' },
        ]);
    });
});

describe('safeHttpUrl', () => {
    const fallback = 'https://padrao.example';

    it('aceita http e https', () => {
        expect(safeHttpUrl('https://instagram.com/x', fallback)).toBe('https://instagram.com/x');
        expect(safeHttpUrl('http://site.com', fallback)).toBe('http://site.com');
    });

    it('rejeita javascript: e outros protocolos, usando o padrão', () => {
        expect(safeHttpUrl('javascript:alert(1)', fallback)).toBe(fallback);
        expect(safeHttpUrl('data:text/html,<b>x</b>', fallback)).toBe(fallback);
        expect(safeHttpUrl('instagram.com/x', fallback)).toBe(fallback);
        expect(safeHttpUrl('', fallback)).toBe(fallback);
    });
});
