// O contador é automático por padrão; o número manual só vale quando foi
// escolhido explicitamente no painel administrativo.
// Conforme a correção do cliente, o número automático fica em torno de 90% do
// valor real, arredondado para cima, para manter a contagem próxima de +30 quando
// há 34 itens publicados.
export function getAutomaticHeroStatValue(automatic: number): number {
    return Math.ceil(automatic * 0.9);
}

export function resolveStatValue(mode: string, custom: string, automatic: number): number {
    const automaticValue = getAutomaticHeroStatValue(automatic);

    if (mode !== 'custom') return automaticValue;
    if (custom.trim() === '') return automaticValue;
    const parsed = Number(custom);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : automaticValue;
}
