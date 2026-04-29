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

export default function ReflexaoPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [reflexao, setReflexao] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReflexao = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setReflexao(data);
            } catch (error) {
                console.error('Error fetching reflexao:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReflexao();
    }, [id]);

    if (loading) {
        return <SkeletonArticleDetail />;
    }

    if (!reflexao) {
        return (
            <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
                <h1>Reflexão não encontrada</h1>
                <Link to="/reflexoes" className="btn primary">Voltar para Reflexões</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '20px 0' }}>
            <div className="article-content" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '12px', position: 'relative' }}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>

                <div className="article-header">
                    <div className={`category ${reflexao.category}`}>{reflexao.categoryName}</div>

                    <div className="article-meta">
                        <div className="meta">
                            {reflexao.date} • por {reflexao.author} • {reflexao.readTime}
                        </div>
                        <div className="meta">
                            Compartilhar:
                            <a href="#" style={{ marginLeft: '5px' }} title="Compartilhar">📱</a>
                            <a href={`mailto:?subject=${reflexao.title}&body=Confira esta reflexão: ${window.location.href}`} style={{ marginLeft: '5px' }} title="Email">📧</a>
                            <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ marginLeft: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Copiar Link">🔗</button>
                        </div>
                    </div>

                    <h2>{reflexao.title}</h2>

                    {reflexao.tags && reflexao.tags.length > 0 && (
                        <div className="article-tags">
                            {reflexao.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <img src={reflexao.image} alt={reflexao.title} className="article-hero-img" />

                {reflexao.audio_url && (
                    <div className="article-audio-player">
                        <p><strong>🎧 Áudio da Reflexão</strong></p>
                        <audio controls style={{ width: '100%', marginTop: '10px' }}>
                            <source src={reflexao.audio_url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </div>
                )}

                <div
                    className="article-section"
                    dangerouslySetInnerHTML={{ __html: cleanHtml(reflexao.content) }}
                />

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link to="/reflexoes" className="btn primary">
                        ← Voltar para Reflexões
                    </Link>
                </div>
            </div>
        </div>
    );
}
