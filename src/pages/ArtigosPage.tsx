import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import ArticleCard from '../components/ArticleCard';
import SkeletonCard from '../components/SkeletonCard';
import { toTitleCase } from '../utils/titleCase';

export default function ArtigosPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const { data, error } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('type', 'artigos')
                    .order('position', { ascending: true })
                    .order('id', { ascending: false });

                if (error) throw error;
                setArticles(data || []);
            } catch (error) {
                console.error('Error fetching articles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    return (
        <main className="container">
            <div className="titulo">Todos os Artigos</div>
            <section className="main">
                <section className="posts">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        articles.map((article) => (
                            <ArticleCard key={article.id} article={article} linkPrefix="artigo" />
                        ))
                    )}
                </section>

                <aside>
                    <div className="widget">
                        <h4>Categorias</h4>
                        <div className="list-compact">
                            <a href="#civil">Direito Civil</a>
                            <a href="#tributario">Direito Tributário</a>
                            <a href="#trabalho">Direito do Trabalho</a>
                            <a href="#constitucional">Direito Constitucional</a>
                        </div>
                    </div>

                    <div className="widget">
                        <h4>Mais lidos</h4>
                        {loading ? (
                            <p>Carregando...</p>
                        ) : (
                            <ol style={{ paddingLeft: '18px', margin: 0 }}>
                                {articles.slice(0, 5).map((article) => (
                                    <li key={article.id}>
                                        <a href={`/artigo/${article.id}`}>{toTitleCase(article.title)}</a>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </aside>
            </section>
        </main>
    );
}
