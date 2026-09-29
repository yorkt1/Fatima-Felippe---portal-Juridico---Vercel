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
        .replace(/&nbsp;/g, ' ')          // espaço fixo → espaço normal
        .replace(/\u00a0/g, ' ');          // char Unicode do &nbsp;
    return DOMPurify.sanitize(withoutNbsp);
}

export default function ArticlePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('id', id)
                    .eq('type', 'artigos')
                    .single();

                if (error) throw error;
                setArticle(data);
            } catch (error) {
                console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    useDocumentMeta(
        article ? `${article.title} — Fatima Felippe` : (!loading ? 'Artigo não encontrado — Fatima Felippe' : undefined),
        article?.excerpt,
        {
            path: id ? `/artigo/${id}` : undefined,
            image: article?.image,
            type: 'article',
            noindex: !loading && !article,
            // BreadcrumbList: mostra a categoria (ex.: "Saúde") no resultado de busca do
            // Google no lugar da URL crua "/artigo/51", como o Jusbrasil faz.
            structuredData: article ? [
                {
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: article.title,
                    description: article.excerpt,
                    image: article.image ? [article.image] : undefined,
                    author: { '@type': 'Person', name: article.author },
                    publisher: { '@type': 'Organization', name: 'Portal Jurídico Fatima Felippe' },
                    mainEntityOfPage: `https://fatimafelippe.com.br/artigo/${id}`,
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://fatimafelippe.com.br/' },
                        { '@type': 'ListItem', position: 2, name: article.categoryName, item: 'https://fatimafelippe.com.br/artigos' },
                        { '@type': 'ListItem', position: 3, name: article.title, item: `https://fatimafelippe.com.br/artigo/${id}` },
                    ],
                },
            ] : undefined,
        }
    );

    if (loading) {
        return <SkeletonArticleDetail />;
    }

    if (!article) {
        return (
            <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
                <h1>Artigo não encontrado</h1>
                <Link to="/artigos" className="btn primary">Voltar para Artigos</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '20px 18px' }}>
            <div className="article-content">
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>

                <div className="article-header">
                    <span className={`category ${categoryClass(article.categoryName)}`}>{article.categoryName}</span>

                    <div className="article-meta">
                        <div className="meta">
                            {article.date} • por {article.author} • {article.readTime}
                        </div>
                        <div className="meta">
                            Compartilhar:
                            <a href="#" style={{ marginLeft: '5px' }} title="Compartilhar">📱</a>
                            <a href={`mailto:?subject=${article.title}&body=Confira este artigo: ${window.location.href}`} style={{ marginLeft: '5px' }} title="Email">📧</a>
                            <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ marginLeft: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Copiar Link">🔗</button>
                        </div>
                    </div>

                    <h2>{article.title}</h2>

                    {article.tags && article.tags.length > 0 && (
                        <div className="article-tags">
                            {article.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <img src={article.image} alt={article.title} className="article-hero-img" style={{ objectPosition: article.image_position || '50% 50%' }} />

                {article.audio_url && (
                    <div className="article-audio-player">
                        <p><strong>🎧 Áudio da Reflexão</strong></p>
                        <audio controls style={{ width: '100%', marginTop: '10px' }}>
                            <source src={article.audio_url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </div>
                )}

                <div
                    className="article-section"
                    dangerouslySetInnerHTML={{ __html: cleanHtml(article.content || '') }}
                />

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link to="/artigos" className="btn primary">
                        ← Voltar para Artigos
                    </Link>
                </div>
            </div>
        </div>
    );
}
