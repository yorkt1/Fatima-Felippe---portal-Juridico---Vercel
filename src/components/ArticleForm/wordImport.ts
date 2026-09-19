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
        'line-height', 'margin', 'margin-top', 'margin-bottom',
        'text-indent', 'white-space',
    ]);

    // Para cada elemento com style, filtra apenas propriedades úteis
    doc.querySelectorAll('[style]').forEach(el => {
        const htmlEl = el as HTMLElement;
        const raw = htmlEl.getAttribute('style') || '';
        // Separa declarações
        const decls = raw.split(';').map(s => s.trim()).filter(Boolean);
        const kept: string[] = [];
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
            if (KEEP_PROPS.has(prop)) {
                kept.push(`${prop}: ${val}`);
            }
        }
        if (kept.length > 0) {
            htmlEl.setAttribute('style', kept.join('; '));
        } else {
            htmlEl.removeAttribute('style');
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
