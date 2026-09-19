import { describe, it, expect } from 'vitest';
import { SITE_SETTING_FIELDS, SITE_DEFAULTS } from './siteSettings';
import { parsePairs } from '../utils/siteText';

// Lê o código-fonte das páginas/componentes para conferir as chaves usadas.
const sources = import.meta.glob(['../pages/*.tsx', '../components/*.tsx'], {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

const KEY_PATTERN = /\bget\('((?:header|home|about|contact|footer|sidebar)\.[A-Za-z0-9_.]+)'\)/g;

function keysUsedInCode(): Set<string> {
    const used = new Set<string>();
    for (const [file, code] of Object.entries(sources)) {
        if (file.includes('.test.')) continue;
        for (const match of code.matchAll(KEY_PATTERN)) used.add(match[1]);
    }
    return used;
}

describe('campos editáveis do site', () => {
    it('não repete chaves', () => {
        const keys = SITE_SETTING_FIELDS.map(f => f.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('todo campo tem padrão preenchido (o site nunca fica em branco)', () => {
        for (const f of SITE_SETTING_FIELDS) {
            expect(f.default.trim(), `padrão vazio em ${f.key}`).not.toBe('');
        }
    });

    it('SITE_DEFAULTS reflete todos os campos', () => {
        expect(Object.keys(SITE_DEFAULTS).sort()).toEqual(SITE_SETTING_FIELDS.map(f => f.key).sort());
    });

    it('campos de "pares" têm padrão no formato Título | Descrição', () => {
        for (const f of SITE_SETTING_FIELDS.filter(f => f.kind === 'pairs')) {
            for (const pair of parsePairs(f.default)) {
                expect(pair.title, `título vazio em ${f.key}`).not.toBe('');
                expect(pair.text, `descrição vazia em ${f.key}`).not.toBe('');
            }
        }
    });

    it('toda chave usada nas páginas existe no painel (evita erro de digitação)', () => {
        const defined = new Set(SITE_SETTING_FIELDS.map(f => f.key));
        for (const key of keysUsedInCode()) {
            expect(defined.has(key), `chave "${key}" usada no código não existe em siteSettings.ts`).toBe(true);
        }
    });

    it('todo campo do painel é realmente usado em alguma página (sem campo morto)', () => {
        const used = keysUsedInCode();
        for (const f of SITE_SETTING_FIELDS) {
            expect(used.has(f.key), `campo "${f.key}" aparece no painel mas nenhuma página o usa`).toBe(true);
        }
    });
});
