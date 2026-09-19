// Preserva a formatação aplicada DIRETAMENTE no texto de um .docx.
//
// O mammoth converte a ESTRUTURA (títulos, listas, tabelas, links, imagens,
// negrito/itálico...) mas descarta alinhamento, cor, tamanho, fonte, realce,
// recuos e espaçamento. Para não perder isso:
//   1) embedDocxFormatting(): antes do mammoth, lê o word/document.xml e grava
//      marcadores de texto (caracteres de uso privado do Unicode) em cada
//      parágrafo/trecho que tenha formatação direta;
//   2) o mammoth converte normalmente — os marcadores atravessam como texto;
//   3) applyDocxFormatting(): troca os marcadores por style="..." / <span> / <mark>.
// Se qualquer passo falhar, devolve o arquivo original e o import segue como antes.
//
// Não lê formatação herdada de ESTILOS do Word (ex.: um estilo "Citação"),
// só a aplicada direto. Títulos continuam sendo h1/h2/h3 do site.
import JSZip from 'jszip';

// Marcadores: caracteres de uso privado, que não aparecem em textos reais.
const OPEN = String.fromCharCode(0xe000);
const CLOSE = String.fromCharCode(0xe001);
const END = String.fromCharCode(0xe002);

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

interface ParaFmt {
    align?: 'center' | 'right';
    marginLeftPx?: number;
    textIndentPx?: number;
    beforePt?: number;
    afterPt?: number;
    lineHeight?: number;
    cellFill?: string;
}

interface RunFmt {
    color?: string;
    sizePt?: number;
    font?: string;
    highlight?: string;
    caps?: boolean;
}

export interface FormatTable {
    paras: ParaFmt[];
    runs: RunFmt[];
}

const emptyTable = (): FormatTable => ({ paras: [], runs: [] });

// Cores nomeadas do realce (w:highlight) do Word
const HIGHLIGHTS: Record<string, string> = {
    yellow: '#FFFF00', green: '#00FF00', cyan: '#00FFFF', magenta: '#FF00FF', blue: '#0000FF',
    red: '#FF0000', darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000',
    darkMagenta: '#800080', darkRed: '#800000', darkYellow: '#808000', darkGray: '#808080',
    lightGray: '#C0C0C0', black: '#000000', white: '#FFFFFF',
};

// ── helpers de XML ────────────────────────────────────────────────────────
const kids = (el: Element, name: string): Element[] =>
    Array.from(el.children).filter(c => c.localName === name && c.namespaceURI === W_NS);
const kid = (el: Element | null | undefined, name: string): Element | undefined =>
    el ? kids(el, name)[0] : undefined;
const val = (el: Element | undefined, attr = 'val'): string | null =>
    el ? (el.getAttributeNS(W_NS, attr) ?? el.getAttribute('w:' + attr)) : null;
const flag = (el: Element | undefined): boolean =>
    !!el && !['0', 'false', 'off'].includes((val(el) ?? '').toLowerCase());
const num = (v: string | null): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
};
const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const isHex6 = (v: string | null): v is string => !!v && /^[0-9a-f]{6}$/i.test(v);

// ── leitura da formatação direta ──────────────────────────────────────────
function readPara(p: Element, cellFill?: string): ParaFmt | null {
    const fmt: ParaFmt = {};
    const pPr = kid(p, 'pPr');
    if (pPr) {
        const jc = val(kid(pPr, 'jc'));
        if (jc === 'center') fmt.align = 'center';
        else if (jc === 'right' || jc === 'end') fmt.align = 'right';
        // 'left'/'justify': o site já justifica o texto; não precisa gravar.

        const isList = !!kid(pPr, 'numPr');
        const ind = kid(pPr, 'ind');
        if (ind && !isList) {
            const left = num(val(ind, 'left') ?? val(ind, 'start'));
            const first = num(val(ind, 'firstLine'));
            const hanging = num(val(ind, 'hanging'));
            if (left) fmt.marginLeftPx = round(left / 15);          // 1 px = 15 twips
            if (first) fmt.textIndentPx = round(first / 15);
            else if (hanging) fmt.textIndentPx = -round(hanging / 15);
        }

        const spacing = kid(pPr, 'spacing');
        if (spacing) {
            const before = num(val(spacing, 'before'));
            const after = num(val(spacing, 'after'));
            const line = num(val(spacing, 'line'));
            const rule = val(spacing, 'lineRule');
            if (before !== undefined) fmt.beforePt = round(before / 20);   // 1 pt = 20 twips
            if (after !== undefined) fmt.afterPt = round(after / 20);
            if (line && (!rule || rule === 'auto')) fmt.lineHeight = round(line / 240, 2);
        }
    }
    if (cellFill) fmt.cellFill = cellFill;
    return Object.keys(fmt).length ? fmt : null;
}

function readRun(r: Element): RunFmt | null {
    const rPr = kid(r, 'rPr');
    if (!rPr) return null;
    const fmt: RunFmt = {};

    const color = val(kid(rPr, 'color'));
    // "auto" e preto puro = cor padrão do texto: deixa o site decidir.
    if (isHex6(color) && color.toUpperCase() !== '000000') fmt.color = '#' + color.toUpperCase();

    const size = num(val(kid(rPr, 'sz')));
    if (size) fmt.sizePt = size / 2;                                     // w:sz está em meios-pontos

    const fonts = kid(rPr, 'rFonts');
    const font = val(fonts, 'ascii') ?? val(fonts, 'hAnsi');
    if (font) fmt.font = font;

    const hl = val(kid(rPr, 'highlight'));
    const fill = val(kid(rPr, 'shd'), 'fill');
    if (hl && hl !== 'none' && HIGHLIGHTS[hl]) fmt.highlight = HIGHLIGHTS[hl];
    else if (isHex6(fill)) fmt.highlight = '#' + fill.toUpperCase();

    if (flag(kid(rPr, 'caps'))) fmt.caps = true;

    return Object.keys(fmt).length ? fmt : null;
}

const hasText = (el: Element) =>
    Array.from(el.getElementsByTagNameNS(W_NS, 't')).some(t => /\S/.test(t.textContent ?? ''));
const hasImage = (el: Element) =>
    ['drawing', 'pict', 'object'].some(n => el.getElementsByTagNameNS(W_NS, n).length > 0);

function markerRun(doc: Document, text: string): Element {
    const r = doc.createElementNS(W_NS, 'w:r');
    r.appendChild(markerText(doc, text));
    return r;
}

function markerText(doc: Document, text: string): Element {
    const t = doc.createElementNS(W_NS, 'w:t');
    t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
    t.textContent = text;
    return t;
}

// ── passo 1: grava os marcadores no .docx ─────────────────────────────────
export async function embedDocxFormatting(source: ArrayBuffer): Promise<{ buffer: ArrayBuffer; table: FormatTable }> {
    try {
        const zip = await JSZip.loadAsync(source);
        const file = zip.file('word/document.xml');
        if (!file) return { buffer: source, table: emptyTable() };

        const doc = new DOMParser().parseFromString(await file.async('string'), 'application/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) return { buffer: source, table: emptyTable() };

        const table = emptyTable();

        // Sombreado de célula: vale para o primeiro parágrafo da célula.
        const cellFills = new Map<Element, string>();
        for (const tc of Array.from(doc.getElementsByTagNameNS(W_NS, 'tc'))) {
            const fill = val(kid(kid(tc, 'tcPr'), 'shd'), 'fill');
            const firstP = kids(tc, 'p')[0];
            if (isHex6(fill) && firstP) cellFills.set(firstP, '#' + fill.toUpperCase());
        }

        for (const p of Array.from(doc.getElementsByTagNameNS(W_NS, 'p'))) {
            // Runs primeiro (os marcadores do parágrafo entram depois, como 1º filho).
            for (const r of kids(p, 'r')) {
                const run = readRun(r);
                if (!run || !hasText(r)) continue;
                const id = table.runs.push(run) - 1;
                const rPr = kid(r, 'rPr');
                const open = markerText(doc, `${OPEN}R${id}${CLOSE}`);
                if (rPr) rPr.after(open); else r.prepend(open);
                r.appendChild(markerText(doc, END));
            }

            const fill = cellFills.get(p);
            const para = readPara(p, fill);
            // Parágrafo vazio continua vazio (o mammoth o descarta), exceto célula sombreada.
            if (!para || (!hasText(p) && !hasImage(p) && !fill)) continue;
            const id = table.paras.push(para) - 1;
            const marker = markerRun(doc, `${OPEN}P${id}${CLOSE}`);
            const pPr = kid(p, 'pPr');
            if (pPr) pPr.after(marker); else p.prepend(marker);
        }

        if (table.paras.length === 0 && table.runs.length === 0) return { buffer: source, table };

        zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
        return { buffer: await zip.generateAsync({ type: 'arraybuffer' }), table };
    } catch (error) {
        console.warn('Formatação do .docx não pôde ser lida; importando só a estrutura.', error);
        return { buffer: source, table: emptyTable() };
    }
}

// ── passo 2: troca os marcadores por estilos no HTML do mammoth ───────────
function paraStyle(f: ParaFmt): string {
    const s: string[] = [];
    if (f.align) s.push(`text-align: ${f.align}`);
    if (f.marginLeftPx !== undefined) s.push(`margin-left: ${f.marginLeftPx}px`);
    if (f.textIndentPx !== undefined) s.push(`text-indent: ${f.textIndentPx}px`);
    if (f.beforePt !== undefined) s.push(`margin-top: ${f.beforePt}pt`);
    if (f.afterPt !== undefined) s.push(`margin-bottom: ${f.afterPt}pt`);
    if (f.lineHeight !== undefined) s.push(`line-height: ${f.lineHeight}`);
    return s.join('; ');
}

function runHtml(f: RunFmt, inner: string): string {
    let out = inner;
    if (f.caps) out = out.replace(/(^|>)([^<]+)/g, (_m, pre: string, text: string) => pre + text.toLocaleUpperCase('pt-BR'));
    if (f.highlight) out = `<mark style="background-color: ${f.highlight}">${out}</mark>`;
    const s: string[] = [];
    if (f.color) s.push(`color: ${f.color}`);
    if (f.sizePt) s.push(`font-size: ${f.sizePt}pt`);
    if (f.font) s.push(`font-family: '${f.font.replace(/'/g, '')}'`);
    return s.length ? `<span style="${s.join('; ')}">${out}</span>` : out;
}

export function applyDocxFormatting(html: string, table: FormatTable): string {
    let out = html;

    // Parágrafos (e a cor de fundo da célula, quando o parágrafo abre uma célula)
    const paraRe = new RegExp(`(<t[dh]\\b[^>]*>)?<(p|h[1-6]|li|blockquote|pre)\\b([^>]*)>${OPEN}P(\\d+)${CLOSE}`, 'g');
    out = out.replace(paraRe, (_all, cell: string | undefined, tag: string, attrs: string, id: string) => {
        const f = table.paras[Number(id)];
        let openCell = cell ?? '';
        if (openCell && f?.cellFill) openCell = openCell.replace(/>$/, ` style="background-color: ${f.cellFill}">`);
        const style = f && /^(p|h[1-6])$/.test(tag) ? paraStyle(f) : '';
        return `${openCell}<${tag}${attrs}${style ? ` style="${style}"` : ''}>`;
    });

    // Trechos com cor / tamanho / fonte / realce
    const runRe = new RegExp(`${OPEN}R(\\d+)${CLOSE}([\\s\\S]*?)${END}`, 'g');
    out = out.replace(runRe, (_all, id: string, inner: string) => {
        const f = table.runs[Number(id)];
        return f ? runHtml(f, inner) : inner;
    });

    // Rede de segurança: nenhum marcador pode sobrar no texto salvo.
    return out.replace(new RegExp(`${OPEN}[A-Z]\\d+${CLOSE}|${END}`, 'g'), '');
}
