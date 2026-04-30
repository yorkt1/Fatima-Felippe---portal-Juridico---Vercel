import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import ArticleCard from '../components/ArticleCard';
import SkeletonCard from '../components/SkeletonCard';
import { toTitleCase } from '../utils/titleCase';

export default function ReflexoesPage() {
    const [reflexoes, setReflexoes] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReflexoes = async () => {
            try {
                const { data, error } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('type', 'reflexoes')
                    .order('position', { ascending: true })
                    .order('id', { ascending: false });

                if (error) throw error;
                setReflexoes(data || []);
            } catch (error) {
                console.error('Error fetching reflexoes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReflexoes();
    }, []);

    return (
        <main className="container">
            <div className="titulo">Todas as Reflexões</div>
            <section className="main">
                <section className="posts">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        reflexoes.map((reflexao) => (
                            <ArticleCard key={reflexao.id} article={reflexao} linkPrefix="reflexao" />
                        ))
                    )}
                </section>

                <aside>
                    <div className="widget">
                        <h4>Mais lidos</h4>
                        {loading ? (
                            <p>Carregando...</p>
                        ) : (
                            <ol style={{ paddingLeft: '18px', margin: 0 }}>
                                {reflexoes.slice(0, 3).map((reflexao) => (
                                    <li key={reflexao.id}>
                                        <Link to={`/reflexao/${reflexao.id}`}>
                                            <span className={`category ${reflexao.category}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                {reflexao.categoryName.split(' ')[0]}
                                            </span>{' '}
                                            {toTitleCase(reflexao.title)}
                                        </Link>
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
