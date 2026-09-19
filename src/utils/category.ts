// Classe CSS do "chip" de categoria (ex.: DIREITO CIVIL).
// A cor vem da SUBCATEGORIA (categoryName), não do tipo artigo/reflexão/notícia:
//  - Direito Civil e Reflexões  → azul  (#1890ff sobre #e6f7ff)
//  - todas as outras            → padrão (#0b74da sobre #e6f2ff)
// As cores em si ficam em index.css (.category.direito-civil / .category.reflexoes).

// "Direito Civil" → "direito-civil", "Reflexão" → "reflexao", "Finanças Públicas" → "financas-publicas"
export function categorySlug(name: string): string {
    return (name || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// `isReflexao`: o item está numa listagem/página de Reflexões (sempre azul).
export function categoryClass(categoryName: string, isReflexao = false): string {
    return isReflexao ? 'reflexoes' : categorySlug(categoryName);
}
