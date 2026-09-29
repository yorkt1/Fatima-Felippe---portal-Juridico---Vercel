import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import SkeletonArticleDetail from '../components/SkeletonArticleDetail';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { categoryClass } from '../utils/category';

// Remove &nbsp; e outros resíduos do Word que quebram a justificação do texto
function cleanHtml(html: string): string {
    const withoutNbsp = html
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00a0/g, ' ');
    return DOMPurify.sanitize(withoutNbsp);
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
                    .eq('type', 'reflexoes')
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

    useDocumentMeta(
        reflexao ? `${reflexao.title} — Fatima Felippe` : (!loading ? 'Reflexão não encontrada — Fatima Felippe' : undefined),
        reflexao?.excerpt,
        {
            path: id ? `/reflexao/${id}` : undefined,
            image: reflexao?.image,
            type: 'article',
            noindex: !loading && !reflexao,
            // BreadcrumbList: mostra a categoria no resultado de busca do Google no
            // lugar da URL crua "/reflexao/12", como o Jusbrasil faz.
            structuredData: reflexao ? [
                {
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: reflexao.title,
                    description: reflexao.excerpt,
                    image: reflexao.image ? [reflexao.image] : undefined,
                    author: { '@type': 'Person', name: reflexao.author },
                    publisher: { '@type': 'Organization', name: 'Portal Jurídico Fatima Felippe' },
                    mainEntityOfPage: `https://fatimafelippe.com.br/reflexao/${id}`,
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://fatimafelippe.com.br/' },
                        { '@type': 'ListItem', position: 2, name: reflexao.categoryName, item: 'https://fatimafelippe.com.br/reflexoes' },
                        { '@type': 'ListItem', position: 3, name: reflexao.title, item: `https://fatimafelippe.com.br/reflexao/${id}` },
                    ],
                },
            ] : undefined,
        }
    );

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
        <div className="container" style={{ padding: '20px 18px' }}>
            <div className="article-content">
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>

                <div className="article-header">
                    <span className={`category ${categoryClass(reflexao.categoryName, true)}`}>{reflexao.categoryName}</span>

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

                <img src={reflexao.image} alt={reflexao.title} className="article-hero-img" style={{ objectPosition: reflexao.image_position || '50% 50%' }} />

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
                    dangerouslySetInnerHTML={{ __html: cleanHtml(reflexao.content || '') }}
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
