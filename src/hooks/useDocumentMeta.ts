import { useEffect } from 'react';

// Atualiza <title>, <meta name="description">, <link rel="canonical">, tags
// Open Graph e (opcionalmente) dados estruturados JSON-LD enquanto a página
// está montada, restaurando os valores anteriores ao desmontar.
//
// Isso corrige um bug de indexação: o index.html tem um <link rel="canonical">
// fixo apontando sempre para "/", então sem isso todo artigo/reflexão/notícia
// dizia ao Google que era "duplicata" da home.
//
// Obs: não substitui SSR/pré-render para preview em redes sociais (crawlers
// de WhatsApp/Facebook/LinkedIn não executam JS), mas já corrige a aba do
// navegador e ajuda buscadores que renderizam JS (ex.: Googlebot).
const SITE_URL = 'https://fatimafelippe.com.br';

export interface DocumentMetaOptions {
    /** Caminho da página (ex.: "/artigo/12"), usado no canonical e no og:url. */
    path?: string;
    /** URL da imagem usada em og:image. */
    image?: string;
    /** og:type — "article" para páginas de conteúdo, "website" para as demais. */
    type?: 'website' | 'article';
    /** Marca a página como noindex (ex.: busca interna, conteúdo não encontrado). */
    noindex?: boolean;
    /** Dados estruturados JSON-LD (schema.org) específicos da página. */
    structuredData?: Record<string, unknown>;
}

function setAttrTag(selector: string, make: () => HTMLElement, attr: string, value: string): () => void {
    let el = document.head.querySelector<HTMLElement>(selector);
    const created = !el;
    if (!el) {
        el = make();
        document.head.appendChild(el);
    }
    const previous = el.getAttribute(attr);
    el.setAttribute(attr, value);
    return () => {
        if (created) {
            el!.remove();
        } else if (previous !== null) {
            el!.setAttribute(attr, previous);
        }
    };
}

function metaTag(property: string, byProperty = false): () => HTMLElement {
    return () => {
        const meta = document.createElement('meta');
        meta.setAttribute(byProperty ? 'property' : 'name', property);
        return meta;
    };
}

export function useDocumentMeta(title?: string, description?: string, options: DocumentMetaOptions = {}) {
    const { path, image, type = 'article', noindex, structuredData } = options;

    useEffect(() => {
        if (!title) return;

        const previousTitle = document.title;
        document.title = title;

        const cleanups: Array<() => void> = [];

        if (description) {
            cleanups.push(setAttrTag('meta[name="description"]', metaTag('description'), 'content', description));
            cleanups.push(setAttrTag('meta[property="og:description"]', metaTag('og:description', true), 'content', description));
        }

        cleanups.push(setAttrTag('meta[property="og:title"]', metaTag('og:title', true), 'content', title));
        cleanups.push(setAttrTag('meta[property="og:type"]', metaTag('og:type', true), 'content', type));

        if (path) {
            const url = `${SITE_URL}${path}`;
            cleanups.push(setAttrTag('link[rel="canonical"]', () => {
                const link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                return link;
            }, 'href', url));
            cleanups.push(setAttrTag('meta[property="og:url"]', metaTag('og:url', true), 'content', url));
        }

        if (image) {
            cleanups.push(setAttrTag('meta[property="og:image"]', metaTag('og:image', true), 'content', image));
        }

        cleanups.push(setAttrTag(
            'meta[name="robots"]',
            metaTag('robots'),
            'content',
            noindex ? 'noindex, follow' : 'index, follow'
        ));

        if (structuredData) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo-jsonld', 'dynamic');
            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);
            cleanups.push(() => script.remove());
        }

        return () => {
            document.title = previousTitle;
            cleanups.forEach(fn => fn());
        };
    }, [title, description, path, image, type, noindex, structuredData]);
}
