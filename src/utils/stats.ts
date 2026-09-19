// O contador é automático por padrão; o número manual só vale quando foi
// escolhido explicitamente no painel administrativo.
export function resolveStatValue(mode: string, custom: string, automatic: number): number {
    if (mode !== 'custom') return automatic;
    if (custom.trim() === '') return automatic;
    const parsed = Number(custom);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : automatic;
}
