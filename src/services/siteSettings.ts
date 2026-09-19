import { supabase } from './supabase';

const CACHE_KEY = 'siteSettingsCache';

export type SiteOverrides = Record<string, string>;

// Busca crua — quem chama decide o que fazer com `error` (ex.: o painel avisa
// que a tabela ainda não foi criada; o site público simplesmente ignora).
export async function fetchSiteSettingsRaw() {
    return supabase.from('site_settings').select('key, value');
}

// Só guarda valores realmente preenchidos; vazio = "usar o texto padrão".
function toOverrides(rows: { key: string; value: string }[] | null): SiteOverrides {
    const result: SiteOverrides = {};
    for (const row of rows ?? []) {
        if (typeof row.value === 'string' && row.value.trim() !== '') result[row.key] = row.value;
    }
    return result;
}

export function readCachedSiteSettings(): SiteOverrides {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? (JSON.parse(raw) as SiteOverrides) : {};
    } catch {
        return {};
    }
}

function writeCachedSiteSettings(value: SiteOverrides) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    } catch {
        // storage bloqueado (aba privada etc.) — só perde o cache, o site segue igual
    }
}

let inflight: Promise<SiteOverrides> | null = null;

// Uma única requisição por carregamento de página, compartilhada por
// Header/Footer/Home/etc. Em caso de erro (ex.: tabela ainda inexistente)
// devolve {} e o site usa os textos padrão.
export function loadSiteSettings(force = false): Promise<SiteOverrides> {
    if (!inflight || force) {
        inflight = (async () => {
            try {
                const { data, error } = await fetchSiteSettingsRaw();
                if (error) return {};
                const overrides = toOverrides(data);
                writeCachedSiteSettings(overrides);
                return overrides;
            } catch {
                return {};
            }
        })();
    }
    return inflight;
}
