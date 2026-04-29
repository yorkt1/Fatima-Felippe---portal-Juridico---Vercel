import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import SkeletonArticleDetail from '../components/SkeletonArticleDetail';

// Remove &nbsp; e outros resíduos do Word que quebram a justificação do texto
function cleanHtml(html: string): string {
    return html
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00a0/g, ' ');
}

export default function NoticiaPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [noticia, setNoticia] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNoticia = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setNoticia(data);
            } catch (error) {
                console.error('Error fetching noticia:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNoticia();
    }, [id]);

    if (loading) {
        return <SkeletonArticleDetail />;
    }

    if (!noticia) {
        return (
            <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
                <h1>Notícia não encontrada</h1>
                <Link to="/noticias" className="btn primary">Voltar para Notícias</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '20px 0' }}>
            <div className="article-content" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '12px', position: 'relative' }}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>

                <div className="article-header">
                    <div className={`category ${noticia.category}`}>{noticia.categoryName}</div>

                    <div className="article-meta">
                        <div className="meta">
                            {noticia.date} • por {noticia.author} • {noticia.readTime}
                        </div>
                        <div className="meta">
                            Compartilhar:
                            <a href="#" style={{ marginLeft: '5px' }} title="Compartilhar">📱</a>
                            <a href={`mailto:?subject=${noticia.title}&body=Confira esta notícia: ${window.location.href}`} style={{ marginLeft: '5px' }} title="Email">📧</a>
                            <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ marginLeft: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Copiar Link">🔗</button>
                        </div>
                    </div>

                    <h2>{noticia.title}</h2>

                    {noticia.tags && noticia.tags.length > 0 && (
                        <div className="article-tags">
                            {noticia.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <img src={noticia.image} alt={noticia.title} className="article-hero-img" />

                {noticia.audio_url && (
                    <div className="article-audio-player">
                        <p><strong>🎧 Áudio</strong></p>
                        <audio controls style={{ width: '100%', marginTop: '10px' }}>
                            <source src={noticia.audio_url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </div>
                )}

                <div
                    className="article-section"
                    dangerouslySetInnerHTML={{ __html: cleanHtml(noticia.content) }}
                />

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link to="/noticias" className="btn primary">
                        ← Voltar para Notícias
                    </Link>
                </div>
            </div>
        </div>
    );
}
