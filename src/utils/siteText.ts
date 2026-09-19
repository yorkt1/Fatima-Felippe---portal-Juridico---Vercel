// Converte os campos de "lista" do painel (uma linha = um item) em dados
// prontos pra renderizar.

// Uma linha por item, ignorando linhas vazias.
export function parseLines(value: string): string[] {
    return value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
}

export interface TitleText {
    title: string;
    text: string;
}

// Cada linha no formato "Título | Descrição". Sem "|" vira só título.
export function parsePairs(value: string): TitleText[] {
    return parseLines(value).map(line => {
        const idx = line.indexOf('|');
        if (idx === -1) return { title: line, text: '' };
        return { title: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() };
    });
}

// Links vindos do painel: só aceita http(s); qualquer outra coisa
// (ex.: "javascript:...") cai no link padrão.
export function safeHttpUrl(value: string, fallback: string): string {
    return /^https?:\/\//i.test(value.trim()) ? value.trim() : fallback;
}
