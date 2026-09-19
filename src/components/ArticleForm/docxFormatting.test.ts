// Testa a importação de .docx de ponta a ponta com um arquivo de verdade
// (src/test/fixtures/rich.docx: alinhamentos, cores, tamanhos, fontes, realce,
// recuos, espaçamento, listas, tabela com sombreado, link e imagem).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize, TabIndent, Indent, LineHeight, TextIndent, CellWithBackground } from './extensions';
import { embedDocxFormatting, applyDocxFormatting } from './docxFormatting';

const require = createRequire(import.meta.url);
const mammoth = require('mammoth');

const FIXTURE = 'src/test/fixtures/rich.docx';
const toArrayBuffer = (buf: Buffer) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

// Mesmas opções do painel (ArticleForm → handleDocxImport)
const MAMMOTH_OPTIONS = {
    styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "r[style-name='Strong'] => strong",
        'u => u',
        'table => table:fresh',
    ],
};

async function importDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    const { buffer, table } = await embedDocxFormatting(arrayBuffer);
    // No navegador o painel passa { arrayBuffer }; a versão de Node do mammoth pede { buffer }.
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) }, MAMMOTH_OPTIONS);
    return applyDocxFormatting(result.value, table);
}

const makeEditor = () => new Editor({
    extensions: [
        StarterKit.configure({}),
        TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell', 'tableHeader'] }),
        TextStyle, FontSize, Color, Underline, Subscript, Superscript,
        Highlight.configure({ multicolor: true }), FontFamily, LineHeight, Indent, TextIndent,
        Link.configure({ openOnClick: false }), Image.configure({ inline: false, allowBase64: true }),
        Table.configure({ resizable: true }), TableRow, TableHeader, CellWithBackground, TabIndent,
    ],
    content: '',
});

// Elemento (do HTML final) que contém o texto, com seus atributos de estilo
function around(html: string, token: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        if (node.textContent?.includes(token)) {
            const chain: { tag: string; style: string }[] = [];
            for (let el = node.parentElement; el && el !== doc.body; el = el.parentElement) {
                chain.push({ tag: el.tagName.toLowerCase(), style: el.getAttribute('style') ?? '' });
            }
            return chain;
        }
    }
    throw new Error(`texto "${token}" não encontrado`);
}
const styleOf = (html: string, token: string, tag: string) => around(html, token).find(c => c.tag === tag)?.style ?? null;
const hasTag = (html: string, token: string, tag: string) => around(html, token).some(c => c.tag === tag);

describe('importação de .docx — formatação aplicada no texto', async () => {
    const source = toArrayBuffer(fs.readFileSync(FIXTURE));
    const html = await importDocx(source);

    it('não deixa nenhum marcador interno no texto salvo', () => {
        // caracteres de uso privado do Unicode (U+E000 a U+F8FF)
        expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0xe000)}-${String.fromCharCode(0xf8ff)}]`));
    });

    it('alinhamento: centralizado e à direita são mantidos', () => {
        expect(styleOf(html, 'ALIGN-CENTER', 'p')).toContain('text-align: center');
        expect(styleOf(html, 'ALIGN-RIGHT', 'p')).toContain('text-align: right');
    });

    it('sublinhado, negrito, itálico, tachado, sobrescrito e subscrito', () => {
        expect(hasTag(html, 'SUBLINHADO', 'u')).toBe(true);
        expect(hasTag(html, 'NEGRITO', 'strong')).toBe(true);
        expect(hasTag(html, 'ITALICO', 'em')).toBe(true);
        expect(hasTag(html, 'TACHADO', 's')).toBe(true);
        expect(hasTag(html, 'SOBRESCRITO', 'sup')).toBe(true);
        expect(hasTag(html, 'SUBSCRITO', 'sub')).toBe(true);
    });

    it('fonte, tamanho e cor do texto', () => {
        expect(styleOf(html, 'FONTE-ARIAL', 'span')).toContain("font-family: 'Arial'");
        expect(styleOf(html, 'FONTE-ARIAL', 'span')).toContain('font-size: 14pt');
        expect(styleOf(html, 'FONTE-COURIER', 'span')).toContain("font-family: 'Courier New'");
        expect(styleOf(html, 'TAMANHO-20', 'span')).toContain('font-size: 20pt');
        expect(styleOf(html, 'COR-VERMELHA', 'span')).toContain('color: #FF0000');
    });

    it('realce (marca-texto) e sombreado do texto viram <mark> com a cor', () => {
        expect(styleOf(html, 'REALCE-AMARELO', 'mark')).toContain('background-color: #FFFF00');
        expect(styleOf(html, 'FUNDO-SOMBREADO', 'mark')).toContain('background-color: #CCFFCC');
    });

    it('caixa alta é aplicada ao texto', () => {
        expect(html).toContain('CAIXAALTA');
    });

    it('recuo à esquerda e de primeira linha', () => {
        expect(styleOf(html, 'RECUO-ESQUERDA', 'p')).toContain('margin-left: 37.8px');     // 1 cm
        expect(styleOf(html, 'RECUO-PRIMEIRA', 'p')).toContain('text-indent: 48px');       // 1,27 cm
    });

    it('espaçamento entre linhas e antes/depois do parágrafo', () => {
        const style = styleOf(html, 'ESPACO-DUPLO', 'p') ?? '';
        expect(style).toContain('line-height: 2');
        expect(style).toContain('margin-top: 12pt');
        expect(style).toContain('margin-bottom: 12pt');
    });

    it('listas numerada, com marcadores e aninhada', () => {
        expect(hasTag(html, 'LISTA-NUM item 1', 'ol')).toBe(true);
        expect(hasTag(html, 'LISTA-MARC item A', 'ul')).toBe(true);
        expect(html).toMatch(/<ul>[\s\S]*<ul>[\s\S]*sub-item A1/);
    });

    it('link, imagem e tabela (com célula mesclada e cor de fundo da célula)', () => {
        expect(html).toContain('<a href="https://exemplo.com.br">clique aqui</a>');
        expect(html).toMatch(/<img [^>]*src="data:image\/png;base64,/);
        expect(html).toContain('colspan="2"');
        expect(styleOf(html, 'TAB-CABECALHO-1', 'td')).toContain('background-color: #D9D9D9');
        expect(styleOf(html, 'TAB-CABECALHO-2', 'td')).toContain('background-color: #D9D9D9');
        expect(styleOf(html, 'TAB-CELULA-A', 'td')).toBe('');      // célula sem sombreado continua sem estilo
    });

    it('não cria parágrafos vazios a mais (parágrafo vazio continua descartado)', () => {
        expect(html).not.toMatch(/<p>\s*<\/p>/);
    });

    describe('depois de passar pelo editor (o que realmente é salvo no banco)', () => {
        const editor = makeEditor();
        editor.commands.setContent(html);
        const saved = editor.getHTML();

        it('mantém alinhamento, recuos, espaçamento, fonte, tamanho, cor, realce, sublinhado e fundo de célula', () => {
            expect(styleOf(saved, 'ALIGN-CENTER', 'p')).toContain('text-align: center');
            expect(styleOf(saved, 'ALIGN-RIGHT', 'p')).toContain('text-align: right');
            expect(hasTag(saved, 'SUBLINHADO', 'u')).toBe(true);
            expect(styleOf(saved, 'FONTE-ARIAL', 'span')).toContain('font-size: 14pt');
            expect(styleOf(saved, 'COR-VERMELHA', 'span')).toMatch(/color: (#FF0000|rgb\(255, 0, 0\))/i);
            expect(styleOf(saved, 'REALCE-AMARELO', 'mark')).toMatch(/background-color: (#FFFF00|rgb\(255, 255, 0\))/i);
            expect(styleOf(saved, 'RECUO-ESQUERDA', 'p')).toContain('margin-left');
            expect(styleOf(saved, 'RECUO-PRIMEIRA', 'p')).toContain('text-indent: 48px');
            expect(styleOf(saved, 'ESPACO-DUPLO', 'p')).toContain('line-height: 2');
            expect(styleOf(saved, 'TAB-CABECALHO-1', 'td')).toMatch(/background-color: (#D9D9D9|rgb\(217, 217, 217\))/i);
        });
    });
});

describe('página pública (sanitização)', async () => {
    it('o que é salvo continua com a formatação depois do DOMPurify que a página usa para exibir', async () => {
        const { default: DOMPurify } = await import('dompurify');
        const html = await importDocx(toArrayBuffer(fs.readFileSync(FIXTURE)));
        const editor = makeEditor();
        editor.commands.setContent(html);
        const shown = DOMPurify.sanitize(editor.getHTML());
        expect(styleOf(shown, 'ALIGN-CENTER', 'p')).toContain('text-align: center');
        expect(styleOf(shown, 'COR-VERMELHA', 'span')).toContain('color');
        expect(hasTag(shown, 'REALCE-AMARELO', 'mark')).toBe(true);
        expect(styleOf(shown, 'RECUO-PRIMEIRA', 'p')).toContain('text-indent');
        expect(styleOf(shown, 'TAB-CABECALHO-1', 'td')).toContain('background-color');
    });
});

describe('embedDocxFormatting — segurança', () => {
    it('arquivo que não é .docx: devolve o original e não quebra a importação', async () => {
        const bogus = new TextEncoder().encode('isto não é um zip').buffer as ArrayBuffer;
        const { buffer, table } = await embedDocxFormatting(bogus);
        expect(buffer).toBe(bogus);
        expect(table.paras).toHaveLength(0);
        expect(table.runs).toHaveLength(0);
    });

    it('applyDocxFormatting sem marcadores devolve o HTML igual', () => {
        const html = '<p>texto simples</p>';
        expect(applyDocxFormatting(html, { paras: [], runs: [] })).toBe(html);
    });
});
