import { useEffect } from 'react';

// Atualiza <title> e <meta name="description"> enquanto a página de detalhe
// está montada, e restaura os valores anteriores ao sair.
// Obs: não substitui SSR/pré-render para preview em redes sociais (crawlers
// de WhatsApp/Facebook/LinkedIn não executam JS), mas já corrige a aba do
// navegador e ajuda buscadores que renderizam JS (ex.: Googlebot).
export function useDocumentMeta(title?: string, description?: string) {
    useEffect(() => {
        if (!title) return;

        const previousTitle = document.title;
        document.title = title;

        let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        const previousDescription = meta?.getAttribute('content') ?? null;

        if (description) {
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'description');
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', description);
        }

        return () => {
            document.title = previousTitle;
            if (meta && previousDescription !== null) {
                meta.setAttribute('content', previousDescription);
            }
        };
    }, [title, description]);
}
