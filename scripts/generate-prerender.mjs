// Gera um dist/<rota>/index.html por página, com <title>, meta description,
// canonical, Open Graph e JSON-LD próprios já no HTML — sem isso, o Google
// recebe o MESMO dist/index.html (canonical fixo em "/") para toda rota e
// trata artigo/reflexão/notícia como cópia da home (ver useDocumentMeta.ts).
//
// Roda como "postbuild" (ver package.json), depois que o vite já gerou
// dist/index.html com os nomes de arquivo (hash) finais dos assets — por
// isso não pode rodar no "prebuild" como o generate-sitemap.mjs.
//
// O app monta com createRoot(...).render() (não hydrateRoot), então o React
// simplesmente substitui o conteúdo pré-renderizado de #root ao carregar —
// não há risco de erro de hidratação por injetar HTML ali.
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

const SITE_URL = 'https://fatimafelippe.com.br';
const SITE_NAME = 'Portal Jurídico Fatima Felippe';

// Localmente, carrega do .env se as env vars ainda não estiverem definidas
// (mesmo mecanismo do generate-sitemap.mjs — na Vercel elas já existem).
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

const ABOUT_SUBTITLE_DEFAULT = 'Conheça a trajetória, formação e objetivos da advogada por trás do Portal Jurídico';

// Espelha os títulos/descrições fixos de cada página (ver src/pages/*.tsx).
const STATIC_PAGES = [
    { path: '/artigos', title: 'Artigos — Fatima Felippe | Portal Jurídico', description: 'Todos os artigos jurídicos publicados por Fatima Felippe: Direito Civil, Trabalhista e outras áreas do Direito.' },
    { path: '/reflexoes', title: 'Reflexões — Fatima Felippe | Portal Jurídico', description: 'Reflexões sobre Direito e o cotidiano, com novas perspectivas para além do âmbito estritamente jurídico.' },
    { path: '/noticias', title: 'Notícias — Fatima Felippe | Portal Jurídico', description: 'Notícias jurídicas selecionadas por Fatima Felippe para manter você informado sobre o mundo do Direito.' },
    { path: '/sobre', title: 'Sobre — Fátima Felippe | Portal Jurídico', description: null }, // description resolvida via site_settings (about.subtitle)
    { path: '/contato', title: 'Contato — Portal Jurídico Fátima Felippe', description: 'Entre em contato com Fatima Felippe: e-mail, telefone e redes sociais do Portal Jurídico.' },
    { path: '/privacidade', title: 'Política de Privacidade — Portal Jurídico Fátima Felippe', description: 'Política de Privacidade do Portal Jurídico Fatima Felippe: como coletamos, usamos e protegemos os dados dos visitantes.' },
];

const TYPE_CONFIG = {
    artigos: { prefix: 'artigo', listPath: '/artigos', schemaType: 'Article' },
    reflexoes: { prefix: 'reflexao', listPath: '/reflexoes', schemaType: 'Article' },
    noticias: { prefix: 'noticia', listPath: '/noticias', schemaType: 'NewsArticle' },
};

async function supabaseGet(path) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    try {
        const res = await fetch(`${SUPABASE_URL}${path}`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        if (!res.ok) {
            console.warn(`[prerender] Supabase respondeu ${res.status} em ${path}.`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.warn(`[prerender] Falha ao buscar ${path} no Supabase.`, err);
        return null;
    }
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

// Evita que "</script>" dentro dos dados feche a tag <script> prematuramente.
function escapeJsonForScript(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function buildHead(template, { title, description, canonicalPath, image, type, structuredData }) {
    let html = template;

    // Usa uma função como substituição (não uma string) em todo .replace() abaixo:
    // título/descrição/excerto vêm de conteúdo jurídico real, que frequentemente
    // cita valores em "R$" — e strings de substituição tratam "$" como referência
    // de grupo de regex (ex.: "R$1" seria lido como "$1"), corrompendo o texto.
    html = html.replace(/<title>.*?<\/title>/s, () => `<title>${escapeHtml(title)}</title>`);
    html = html.replace(
        /<meta name="description" content=".*?" \/>/s,
        () => `<meta name="description" content="${escapeHtml(description)}" />`
    );

    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    html = html.replace(
        /<link rel="canonical" href=".*?" \/>/s,
        () => `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
    );

    const extraTags = [
        `<meta property="og:title" content="${escapeHtml(title)}" />`,
        `<meta property="og:description" content="${escapeHtml(description)}" />`,
        `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
        `<meta property="og:type" content="${type}" />`,
        image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '',
        structuredData ? `<script type="application/ld+json" id="prerendered-jsonld">${escapeJsonForScript(structuredData)}</script>` : '',
    ].filter(Boolean).join('\n    ');

    html = html.replace('<link rel="icon"', () => `${extraTags}\n    <link rel="icon"`);

    return html;
}

function injectRootContent(html, innerHtml) {
    return html.replace('<div id="root"></div>', () => `<div id="root">${innerHtml}</div>`);
}

function writeRoute(routePath, html) {
    const outDir = resolve(distDir, routePath.replace(/^\//, ''));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
}

async function main() {
    if (!existsSync(distDir)) {
        console.error('[prerender] dist/ não existe — rode "vite build" antes deste script.');
        return;
    }
    const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8');

    const settingsRows = await supabaseGet('/rest/v1/site_settings?select=key,value');
    const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value]).filter(([, v]) => v));
    const aboutSubtitle = settings['about.subtitle'] || ABOUT_SUBTITLE_DEFAULT;

    for (const page of STATIC_PAGES) {
        const html = buildHead(template, {
            title: page.title,
            description: page.path === '/sobre' ? aboutSubtitle : page.description,
            canonicalPath: page.path,
            type: 'website',
        });
        writeRoute(page.path, html);
    }

    const rows = await supabaseGet('/rest/v1/contents?select=id,type,title,excerpt,image,categoryName,author,date') || [];
    let generated = 0;

    for (const row of rows) {
        const config = TYPE_CONFIG[row.type];
        if (!config || row.id == null || !row.title) continue;

        const path = `/${config.prefix}/${row.id}`;
        const title = `${row.title} — Fatima Felippe`;
        const description = row.excerpt || `${row.title} — ${SITE_NAME}.`;

        const structuredData = [
            {
                '@context': 'https://schema.org',
                '@type': config.schemaType,
                headline: row.title,
                description: row.excerpt,
                image: row.image ? [row.image] : undefined,
                author: { '@type': 'Person', name: row.author },
                publisher: { '@type': 'Organization', name: SITE_NAME },
                mainEntityOfPage: `${SITE_URL}${path}`,
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: row.categoryName, item: `${SITE_URL}${config.listPath}` },
                    { '@type': 'ListItem', position: 3, name: row.title, item: `${SITE_URL}${path}` },
                ],
            },
        ];

        let html = buildHead(template, {
            title,
            description,
            canonicalPath: path,
            image: row.image,
            type: 'article',
            structuredData,
        });

        const metaLine = [row.date, row.author ? `por ${row.author}` : ''].filter(Boolean).join(' • ');
        const snippet = `<main style="max-width:800px;margin:0 auto;padding:24px 18px;">`
            + `<p>${escapeHtml(row.categoryName || '')}</p>`
            + `<h1>${escapeHtml(row.title)}</h1>`
            + (metaLine ? `<p>${escapeHtml(metaLine)}</p>` : '')
            + (row.image ? `<img src="${escapeHtml(row.image)}" alt="${escapeHtml(row.title)}" style="max-width:100%;height:auto;" />` : '')
            + (row.excerpt ? `<p>${escapeHtml(row.excerpt)}</p>` : '')
            + `</main>`;

        html = injectRootContent(html, snippet);
        writeRoute(path, html);
        generated++;
    }

    console.log(`[prerender] ${STATIC_PAGES.length} páginas estáticas + ${generated} páginas de conteúdo pré-renderizadas em dist/.`);
}

main().catch(err => {
    // Nunca derruba o build por causa do pré-render — só avisa.
    console.error('[prerender] Erro inesperado ao pré-renderizar, build segue sem pré-renderização adicional:', err);
});
