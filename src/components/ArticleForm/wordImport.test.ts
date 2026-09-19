import { describe, it, expect } from 'vitest';
import { cleanWordHtml, base64ToBlob } from './wordImport';

describe('cleanWordHtml', () => {
    it('preserva propriedades de estilo úteis (cor, negrito, alinhamento)', () => {
        const html = '<p style="color: red; font-weight: bold;">texto</p>';
        expect(cleanWordHtml(html)).toContain('color: red');
        expect(cleanWordHtml(html)).toContain('font-weight: bold');
    });

    it('remove propriedades MSO/Office do Word', () => {
        const html = '<p style="mso-list: l0 level1; color: blue;">texto</p>';
        const result = cleanWordHtml(html);
        expect(result).not.toContain('mso-list');
        expect(result).toContain('color: blue');
    });

    it('remove classes MSO', () => {
        const html = '<p class="MsoNormal">texto</p>';
        expect(cleanWordHtml(html)).not.toContain('MsoNormal');
    });

    it('remove text-align: left/start (deixa o justify do CSS do site assumir)', () => {
        const html = '<p style="text-align: left;">texto</p>';
        expect(cleanWordHtml(html)).not.toContain('text-align');
    });

    it('preserva text-align: center e right, escolhidos explicitamente', () => {
        expect(cleanWordHtml('<p style="text-align: center;">x</p>')).toContain('text-align: center');
        expect(cleanWordHtml('<p style="text-align: right;">x</p>')).toContain('text-align: right');
    });

    it('remove comentários condicionais do Word', () => {
        const html = '<!--[if gte mso 9]><xml>lixo</xml><![endif]--><p>texto</p>';
        const result = cleanWordHtml(html);
        expect(result).not.toContain('[if gte mso');
        expect(result).toContain('<p>texto</p>');
    });

    it('converte &nbsp; em espaço normal', () => {
        expect(cleanWordHtml('<p>a&nbsp;b</p>')).toBe('<p>a b</p>');
    });

    it('remove o atributo style por completo quando nada sobra pra manter', () => {
        const html = '<p style="mso-list: l0 level1;">texto</p>';
        expect(cleanWordHtml(html)).not.toContain('style=');
    });
});

describe('base64ToBlob', () => {
    it('gera um Blob com o content-type informado', () => {
        // "olá" em base64 (UTF-8)
        const base64 = btoa('ola');
        const blob = base64ToBlob(base64, 'image/png');
        expect(blob.type).toBe('image/png');
        expect(blob.size).toBe('ola'.length);
    });

    it('preserva o conteúdo binário original', async () => {
        const original = 'conteudo-de-teste';
        const base64 = btoa(original);
        const blob = base64ToBlob(base64, 'application/octet-stream');
        const text = await blob.text();
        expect(text).toBe(original);
    });
});
