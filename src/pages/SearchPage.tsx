import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';

// Normaliza string: minúsculas + remove acentos
function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Divide a query em tokens não-vazios
function tokenize(query: string): string[] {
    return query.trim().split(/\s+/).filter(Boolean);
}

// Verifica se um item passa nos filtros de todos os tokens
function matchesAllTokens(item: Article, tokens: string[]): boolean {
    const searchable = normalize(
        [
            item.title,
            item.excerpt,
            item.author,
            ...(item.tags || []),
            item.categoryName,
            // Remove tags HTML do content antes de buscar
            item.content.replace(/<[^>]*>/g, ' '),
        ].join(' ')
    );

    return tokens.every(token => searchable.includes(normalize(token)));
}

// Destaca os termos encontrados em um texto puro
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
    if (!tokens.length) return <>{text}</>;

    // Constrói regex que ignora acentos fazendo replace de cada token
    const parts: { str: string; highlight: boolean }[] = [];
    let remaining = text;

    // Abordagem simples: divide por posições
    const normalizedText = normalize(text);
    const intervals: [number, number][] = [];

    for (const token of tokens) {
        const norm = normalize(token);
        let idx = normalizedText.indexOf(norm, 0);
        while (idx !== -1) {
            intervals.push([idx, idx + norm.length]);
            idx = normalizedText.indexOf(norm, idx + 1);
        }
    }

    // Ordena e mescla intervalos sobrepostos
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const [s, e] of intervals) {
        if (merged.length && s <= merged[merged.length - 1][1]) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
        } else {
            merged.push([s, e]);
        }
    }

    let cursor = 0;
    for (const [s, e] of merged) {
        if (s > cursor) parts.push({ str: text.slice(cursor, s), highlight: false });
        parts.push({ str: text.slice(s, e), highlight: true });
        cursor = e;
    }
    if (cursor < text.length) parts.push({ str: text.slice(cursor), highlight: false });

    remaining; // suppress unused warning
    return (
        <>
            {parts.map((p, i) =>
                p.highlight ? (
                    <mark key={i} style={{ background: '#fef08a', borderRadius: '2px', padding: '0 1px' }}>
                        {p.str}
                    </mark>
                ) : (
                    <span key={i}>{p.str}</span>
                )
            )}
        </>
    );
}

interface GroupedResults {
    artigos: Article[];
    reflexoes: Article[];
    noticias: Article[];
}

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<GroupedResults>({ artigos: [], reflexoes: [], noticias: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchAndFilter = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults({ artigos: [], reflexoes: [], noticias: [] });
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(false);

        try {
            const tokens = tokenize(q);

            // Busca todos os dados do Supabase de uma vez
            const [{ data: artigosData }, { data: reflexoesData }, { data: noticiasData }] = await Promise.all([
                supabase.from('contents').select('*').eq('type', 'artigos').order('position', { ascending: true }),
                supabase.from('contents').select('*').eq('type', 'reflexoes').order('position', { ascending: true }),
                supabase.from('contents').select('*').eq('type', 'noticias').order('position', { ascending: true }),
            ]);

            const allArtigos: Article[] = artigosData || [];
            const allReflexoes: Article[] = reflexoesData || [];
            const allNoticias: Article[] = noticiasData || [];

            setResults({
                artigos: allArtigos.filter(item => matchesAllTokens(item, tokens)),
                reflexoes: allReflexoes.filter(item => matchesAllTokens(item, tokens)),
                noticias: allNoticias.filter(item => matchesAllTokens(item, tokens)),
            });
        } catch (err) {
            console.error('Erro na busca:', err);
            setResults({ artigos: [], reflexoes: [], noticias: [] });
        } finally {
            setLoading(false);
            setSearched(true);
        }
    }, []);

    useEffect(() => {
        fetchAndFilter(query);
    }, [query, fetchAndFilter]);

    const tokens = tokenize(query);
    const total = results.artigos.length + results.reflexoes.length + results.noticias.length;
    const hasResults = total > 0;

    const ResultCard = ({ item, prefix }: { item: Article; prefix: string }) => (
        <Link
            to={`/${prefix}/${item.id}`}
            className="post"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div>
                <span className={`category ${item.category}`}>{item.categoryName}</span>
                <div className="post-meta">
                    <span>{item.date}</span>
                    <span> • </span>
                    <span>{item.readTime}</span>
                </div>
                <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    }}
                />
                <h3>
                    <Highlight text={item.title} tokens={tokens} />
                </h3>
                <p className="excerpt">
                    <Highlight text={item.excerpt} tokens={tokens} />
                </p>
            </div>
        </Link>
    );

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>
                    Resultados para: <em style={{ color: 'var(--accent)' }}>"{query}"</em>
                </h1>
                {searched && !loading && (
                    <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                        {hasResults
                            ? `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`
                            : 'Nenhum resultado encontrado'}
                    </p>
                )}
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
                    <p>Buscando em todos os conteúdos...</p>
                </div>
            )}

            {!loading && searched && !hasResults && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                    <h2 style={{ color: '#333', marginBottom: '10px' }}>Nenhum resultado encontrado</h2>
                    <p style={{ marginBottom: '30px' }}>
                        Não encontramos nada para <strong>"{query}"</strong>.
                    </p>

                    <div style={{
                        background: '#f8f9fa',
                        padding: '20px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        textAlign: 'left',
                        maxWidth: '420px',
                    }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>Sugestões:</p>
                        <ul style={{ paddingLeft: '20px', lineHeight: '1.8', margin: '0 0 16px' }}>
                            <li>Verifique a ortografia das palavras.</li>
                            <li>Tente termos mais genéricos (ex: "curatela" em vez de "curatela especial").</li>
                            <li>Busque por palavras individuais separadamente.</li>
                            <li>Tente sinônimos ou termos relacionados.</li>
                        </ul>
                        <div style={{ borderTop: '1px solid #e6e9ee', paddingTop: '14px' }}>
                            <p style={{ fontSize: '14px', marginBottom: '10px', color: '#555' }}>Temas populares:</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['Curatela', 'Tutela', 'Direito Civil', 'Família', 'Constituição', 'STF'].map(term => (
                                    <Link
                                        key={term}
                                        to={`/busca?q=${encodeURIComponent(term)}`}
                                        style={{
                                            background: 'white',
                                            border: '1px solid #e6e9ee',
                                            padding: '5px 12px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            color: 'var(--accent)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && hasResults && (
                <>
                    {results.artigos.length > 0 && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{
                                borderLeft: '4px solid var(--accent)',
                                paddingLeft: '12px',
                                color: 'var(--accent)',
                                marginBottom: '20px',
                                fontSize: '20px',
                            }}>
                                Artigos <span style={{ fontWeight: 400, fontSize: '15px', color: 'var(--muted)' }}>({results.artigos.length})</span>
                            </h2>
                            <div className="posts">
                                {results.artigos.map(item => (
                                    <ResultCard key={item.id} item={item} prefix="artigo" />
                                ))}
                            </div>
                        </section>
                    )}

                    {results.reflexoes.length > 0 && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{
                                borderLeft: '4px solid var(--accent)',
                                paddingLeft: '12px',
                                color: 'var(--accent)',
                                marginBottom: '20px',
                                fontSize: '20px',
                            }}>
                                Reflexões <span style={{ fontWeight: 400, fontSize: '15px', color: 'var(--muted)' }}>({results.reflexoes.length})</span>
                            </h2>
                            <div className="posts">
                                {results.reflexoes.map(item => (
                                    <ResultCard key={item.id} item={item} prefix="reflexao" />
                                ))}
                            </div>
                        </section>
                    )}

                    {results.noticias.length > 0 && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{
                                borderLeft: '4px solid var(--accent)',
                                paddingLeft: '12px',
                                color: 'var(--accent)',
                                marginBottom: '20px',
                                fontSize: '20px',
                            }}>
                                Notícias <span style={{ fontWeight: 400, fontSize: '15px', color: 'var(--muted)' }}>({results.noticias.length})</span>
                            </h2>
                            <div className="posts">
                                {results.noticias.map(item => (
                                    <ResultCard key={item.id} item={item} prefix="noticia" />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
