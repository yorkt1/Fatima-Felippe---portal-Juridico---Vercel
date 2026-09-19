// Helpers usados na importação de conteúdo vindo do Word (colar ou .docx).

// Converte uma string base64 em Blob, para poder subir a imagem ao Storage
// em vez de embuti-la como data URI gigante dentro do HTML salvo no banco.
export function base64ToBlob(base64: string, contentType: string): Blob {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
}

// Converte um comprimento CSS (pt, cm, mm, in, em, px) em px — o recuo do editor trabalha em px.
function lengthToPx(value: string): string | null {
    const m = value.trim().match(/^(-?\d*\.?\d+)\s*(pt|px|cm|mm|in|em)?$/);
    if (!m) return null;
    const factor: Record<string, number> = { pt: 96 / 72, px: 1, cm: 96 / 2.54, mm: 96 / 25.4, in: 96, em: 16 };
    return `${Math.round(parseFloat(m[1]) * factor[m[2] ?? 'px'] * 10) / 10}px`;
}

// Cores de fundo que NÃO são realce (transparente, branco, "automático"...)
const NOT_A_HIGHLIGHT = /^(transparent|none|auto|inherit|initial|windowtext|white|#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i;
// Só trechos de texto viram realce; fundo de parágrafo/célula continua como style.
const INLINE_TAGS = new Set(['SPAN', 'FONT', 'B', 'I', 'U', 'STRONG', 'EM', 'A', 'SUB', 'SUP', 'S']);

// Função que limpa HTML do Word preservando estilos visuais importantes
export function cleanWordHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Propriedades CSS que queremos PRESERVAR
    const KEEP_PROPS = new Set([
        'color', 'background-color', 'font-size', 'font-family',
        'font-weight', 'font-style', 'text-decoration', 'text-align',
        'border', 'border-top', 'border-bottom', 'border-left', 'border-right',
        'border-collapse', 'width', 'height', 'padding', 'padding-top',
        'padding-bottom', 'padding-left', 'padding-right', 'vertical-align',
        'line-height', 'margin', 'margin-top', 'margin-bottom', 'margin-left',
        'text-indent', 'white-space',
    ]);

    // Para cada elemento com style, filtra apenas propriedades úteis
    doc.querySelectorAll('[style]').forEach(el => {
        const htmlEl = el as HTMLElement;
        const raw = htmlEl.getAttribute('style') || '';
        // Separa declarações
        const decls = raw.split(';').map(s => s.trim()).filter(Boolean);
        const kept: string[] = [];

        // Realce (marca-texto): o editor só entende <mark>, então o fundo de um trecho
        // de texto vira <mark style="background-color: ...">.
        let highlight: string | null = null;
        if (INLINE_TAGS.has(htmlEl.tagName)) {
            const find = (name: string) => decls
                .map(d => [d.slice(0, d.indexOf(':')).trim().toLowerCase(), d.slice(d.indexOf(':') + 1).trim().toLowerCase()])
                .find(([k]) => k === name)?.[1];
            const candidate = find('mso-highlight') ?? find('background-color') ?? find('background')?.split(/\s+/)[0];
            if (candidate && !NOT_A_HIGHLIGHT.test(candidate)) highlight = candidate;
        }

        for (const decl of decls) {
            const colonIdx = decl.indexOf(':');
            if (colonIdx === -1) continue;
            const prop = decl.slice(0, colonIdx).trim().toLowerCase();
            const val = decl.slice(colonIdx + 1).trim().toLowerCase();
            // Ignora propriedades MSO/Office e valores vazios
            if (prop.startsWith('mso') || prop.startsWith('-aw') || !val) continue;
            // Remove text-align: left/start do Word (será aplicado justify via CSS)
            // Preserva center e right que o usuário escolheu explicitamente
            if (prop === 'text-align' && (val === 'left' || val === 'start' || val === 'justify')) continue;
            if (highlight && (prop === 'background-color' || prop === 'background')) continue;
            // O Word cola o fundo de célula/parágrafo na forma abreviada (background:#D9D9D9).
            if (prop === 'background') {
                const first = val.split(/\s+/)[0];
                if (first && !NOT_A_HIGHLIGHT.test(first)) kept.push(`background-color: ${first}`);
                continue;
            }
            if (prop === 'margin-left') {
                const px = lengthToPx(val);
                if (px) kept.push(`margin-left: ${px}`);
                continue;
            }
            if (KEEP_PROPS.has(prop)) {
                kept.push(`${prop}: ${val}`);
            }
        }
        if (kept.length > 0) {
            htmlEl.setAttribute('style', kept.join('; '));
        } else {
            htmlEl.removeAttribute('style');
        }

        if (highlight) {
            const mark = doc.createElement('mark');
            mark.setAttribute('style', `background-color: ${highlight}`);
            while (htmlEl.firstChild) mark.appendChild(htmlEl.firstChild);
            htmlEl.appendChild(mark);
        }
    });

    // Remove classes MSO
    doc.querySelectorAll('[class]').forEach(el => {
        const cls = el.getAttribute('class') || '';
        if (/Mso/i.test(cls)) el.removeAttribute('class');
    });

    // Remove comentários condicionais do Word (não acessíveis via DOM, então regex no body)
    let result = doc.body.innerHTML;
    result = result.replace(/<!--\[if[\s\S]*?\[endif\]-->/gi, '');
    result = result.replace(/<!--[^>]*-->/g, '');

    // IMPORTANTE: Converte espaços fixos do Word (&nbsp;) para espaços normais.
    // Isso é o que mais impede o text-align: justify de encostar perfeitamente nas extremidades!
    result = result.replace(/&nbsp;/g, ' ');

    return result;
}
