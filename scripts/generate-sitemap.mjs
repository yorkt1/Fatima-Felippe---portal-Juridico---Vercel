// Gera public/sitemap.xml antes do build, listando as rotas estáticas do site
// e uma URL para cada artigo/reflexão/notícia cadastrado no Supabase.
//
// Roda como "prebuild" (ver package.json), então npm o executa sozinho antes
// de "vite build" — não precisa ser chamado manualmente. Se as credenciais do
// Supabase não estiverem disponíveis (ex.: build local sem .env), o script
// não falha: apenas gera o sitemap só com as rotas estáticas.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const SITE_URL = 'https://fatimafelippe.com.br';

const STATIC_ROUTES = ['/', '/artigos', '/reflexoes', '/noticias', '/sobre', '/contato', '/privacidade'];

const TYPE_TO_PREFIX = { artigos: 'artigo', reflexoes: 'reflexao', noticias: 'noticia' };

// Na Vercel as env vars VITE_* já existem no ambiente de build. Localmente,
// carrega do .env se ainda não estiverem definidas (sem precisar de dotenv).
function loadDotEnvFallback() {
    const envPath = resolve(rootDir, '.env');
    if (!existsSync(envPath)) return;
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!(key in process.env)) process.env[key] = value;
    }
}

loadDotEnvFallback();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchPublishedContent() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('[sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes — gerando sitemap só com rotas estáticas.');
        return [];
    }
    try {
        const url = `${SUPABASE_URL}/rest/v1/contents?select=id,type`;
        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });
        if (!res.ok) {
            console.warn(`[sitemap] Supabase respondeu ${res.status} — gerando sitemap só com rotas estáticas.`);
            return [];
        }
        return await res.json();
    } catch (err) {
        console.warn('[sitemap] Falha ao buscar conteúdo do Supabase — gerando sitemap só com rotas estáticas.', err);
        return [];
    }
}

function buildXml(paths) {
    const entries = paths
        .map(loc => `  <url><loc>${SITE_URL}${loc}</loc></url>`)
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main() {
    const rows = await fetchPublishedContent();
    const dynamicPaths = rows
        .filter(row => TYPE_TO_PREFIX[row.type] && row.id != null)
        .map(row => `/${TYPE_TO_PREFIX[row.type]}/${row.id}`);

    const allPaths = [...STATIC_ROUTES, ...dynamicPaths];
    const xml = buildXml(allPaths);
    const outPath = resolve(rootDir, 'public', 'sitemap.xml');
    writeFileSync(outPath, xml, 'utf-8');
    console.log(`[sitemap] public/sitemap.xml gerado com ${allPaths.length} URLs (${dynamicPaths.length} de conteúdo).`);
}

main().catch(err => {
    // Nunca derruba o build por causa do sitemap — só avisa.
    console.error('[sitemap] Erro inesperado ao gerar sitemap, seguindo sem ele:', err);
});
