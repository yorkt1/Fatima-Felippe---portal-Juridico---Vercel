import { Link } from 'react-router-dom';
import type { Article } from '../data/content';


interface ArticleCardProps {
    article: Article;
    linkPrefix?: string;
}

export default function ArticleCard({ article, linkPrefix }: ArticleCardProps) {
    const prefix = linkPrefix || (article.category === 'reflexoes' ? 'reflexao' : article.category === 'noticias' ? 'noticia' : 'artigo');
    return (
        <article className="post">
            <div>
                <span className={`category ${article.category}`}>{article.categoryName}</span>
                <div className="meta">{article.date} • {article.readTime}</div>
                <Link to={`/${prefix}/${article.id}`}>
                    <img
                        src={article.image}
                        loading="lazy"
                        alt={article.title}
                        onError={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                            e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                        }}
                    />
                </Link>
                <h3>
                    <Link to={`/${prefix}/${article.id}`}>{article.title}</Link>
                </h3>
                <p className="excerpt">{article.excerpt}</p>
            </div>
        </article>
    );
}
