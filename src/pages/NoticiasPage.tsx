import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import ArticleCard from '../components/ArticleCard';
import SkeletonCard from '../components/SkeletonCard';
import { toTitleCase } from '../utils/titleCase';

export default function NoticiasPage() {
    const [noticias, setNoticias] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNoticias = async () => {
            try {
                const { data, error } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('type', 'noticias')
                    .order('position', { ascending: true })
                    .order('id', { ascending: false });

                if (error) throw error;
                setNoticias(data || []);
            } catch (error) {
                console.error('Error fetching noticias:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNoticias();
    }, []);

    return (
        <main className="container">
            <div className="titulo">Todas as Notícias</div>
            <section className="main">
                <section className="posts">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : noticias.length > 0 ? (
                        noticias.map((article) => (
                            <ArticleCard key={article.id} article={article} linkPrefix="noticia" />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
                            <h2 style={{ color: 'var(--muted)', marginBottom: '10px' }}>
                                Nenhuma notícia disponível
                            </h2>
                            <p style={{ color: 'var(--muted)' }}>
                                Em breve teremos novidades para você!
                            </p>
                        </div>
                    )}
                </section>

                <aside>
                    <div className="widget">
                        <h4>Categorias</h4>
                        <div className="list-compact">
                            <a href="#geral">Notícias Gerais</a>
                            <a href="#juridico">Jurídico</a>
                            <a href="#legislacao">Legislação</a>
                            <a href="#tribunais">Tribunais</a>
                        </div>
                    </div>

                    {noticias.length > 0 && (
                        <div className="widget">
                            <h4>Mais lidos</h4>
                            <ol style={{ paddingLeft: '18px', margin: 0 }}>
                                {noticias.slice(0, 5).map((article) => (
                                    <li key={article.id}>
                                        <a href={`/noticia/${article.id}`}>{toTitleCase(article.title)}</a>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
}
