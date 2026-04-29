import { Link } from 'react-router-dom';
import type { Article } from '../data/content';
import { toTitleCase } from '../utils/titleCase';

interface ArticleCardProps {
    article: Article;
    linkPrefix?: string;
}

export default function ArticleCard({ article, linkPrefix }: ArticleCardProps) {
    const prefix = linkPrefix || (article.category === 'reflexoes' ? 'reflexao' : article.category === 'noticias' ? 'noticia' : 'artigo');
    return (
        <Link to={`/${prefix}/${article.id}`} className="post">
            <div>
                <div className={`category ${article.category}`}>{article.categoryName}</div>
                <div className="meta">
                    {article.date} • {article.readTime}
                </div>
                <img src={article.image} alt={article.title} />
                <h3>{toTitleCase(article.title)}</h3>
                <p className="excerpt">{article.excerpt}</p>
            </div>
        </Link>
    );
}
