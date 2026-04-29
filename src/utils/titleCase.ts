/**
 * Formata um título em Title Case:
 * primeira letra de cada palavra em maiúscula, resto em minúscula.
 */
export function toTitleCase(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/(?:^|\s|-)\S/g, c => c.toUpperCase());
}
