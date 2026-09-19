import type { Article } from '../data/content';

// Normaliza string: minúsculas + remove acentos
export function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
}

// Divide a query em tokens não-vazios
export function tokenize(query: string): string[] {
    return query.trim().split(/\s+/).filter(Boolean);
}

// Verifica se um item passa nos filtros de todos os tokens
export function matchesAllTokens(item: Article, tokens: string[]): boolean {
    const searchable = normalize(
        [
            item.title,
            item.excerpt,
            item.author,
            ...(item.tags || []),
            item.categoryName,
            // Remove tags HTML do content antes de buscar
            (item.content || '').replace(/<[^>]*>/g, ' '),
        ].join(' ')
    );

    return tokens.every(token => searchable.includes(normalize(token)));
}
