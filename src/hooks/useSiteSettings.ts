import { useEffect, useState } from 'react';
import { SITE_DEFAULTS } from '../data/siteSettings';
import { loadSiteSettings, readCachedSiteSettings } from '../services/siteSettings';
import type { SiteOverrides } from '../services/siteSettings';

// Devolve `get(chave)` com o texto editado no painel — ou o padrão do código
// enquanto nada foi editado. Começa pelo último valor conhecido (cache local)
// para o texto não "piscar" de um valor pro outro a cada visita.
export function useSiteSettings() {
    const [overrides, setOverrides] = useState<SiteOverrides>(() => readCachedSiteSettings());

    useEffect(() => {
        let alive = true;
        loadSiteSettings().then(fresh => {
            if (alive) setOverrides(fresh);
        });
        return () => {
            alive = false;
        };
    }, []);

    const get = (key: string): string => overrides[key] ?? SITE_DEFAULTS[key] ?? '';
    return { get };
}
