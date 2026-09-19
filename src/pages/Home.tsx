import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import SkeletonCard from '../components/SkeletonCard';
import ArticleCard from '../components/ArticleCard';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { categoryClass } from '../utils/category';


// Hook que anima um número de 0 até `target` em `duration`ms
function useCountUp(target: number, duration = 800) {
    const [count, setCount] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (target === 0) {
            const timeout = setTimeout(() => setCount(0), 0);
            return () => clearTimeout(timeout);
        }
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out: desacelera no final
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return count;
}

// Componente que exibe o número animado com prefixo +
function AnimatedStat({ value, label }: { value: number; label: string }) {
    const count = useCountUp(value);
    return (
        <div className="stat-item">
            <span className="stat-number">+{count}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
}

export default function Home() {
    const { get } = useSiteSettings();
    const [posts, setPosts] = useState<Article[]>([]);
    const [reflexoes, setReflexoes] = useState<Article[]>([]);
    const [noticias, setNoticias] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);

    const [currentPageArtigos, setCurrentPageArtigos] = useState(1);
    const [currentPageReflexoes, setCurrentPageReflexoes] = useState(1);
    const [currentPageNoticias, setCurrentPageNoticias] = useState(1);
    const itemsPerPage = 4;

    useEffect(() => {
        fetchAllContent();
    }, []);

    const fetchAllContent = async () => {
        setLoading(true);
        try {
            const { data: artigosData } = await supabase
                .from('contents')
                .select('id, category, categoryName, date, readTime, title, excerpt, image, image_position, author, tags, featured')
                .eq('type', 'artigos')
                .order('position', { ascending: true })
                .order('id', { ascending: false });

            const { data: reflexoesData } = await supabase
                .from('contents')
                .select('id, category, categoryName, date, readTime, title, excerpt, image, image_position, author, tags, featured')
                .eq('type', 'reflexoes')
                .order('position', { ascending: true })
                .order('id', { ascending: false });

            const { data: noticiasData } = await supabase
                .from('contents')
                .select('id, category, categoryName, date, readTime, title, excerpt, image, image_position, author, tags, featured')
                .eq('type', 'noticias')
                .order('position', { ascending: true })
                .order('id', { ascending: false });

            setPosts(artigosData || []);
            setReflexoes(reflexoesData || []);
            setNoticias(noticiasData || []);

            // Apenas 1 artigo em destaque
            const featured = artigosData?.find(a => a.featured) || null;
            setFeaturedArticle(featured);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Hero and Main List content
    const leadArticle = featuredArticle || posts[0];
    const sideArticles = leadArticle
        ? posts.filter(p => p.id !== leadArticle.id).slice(0, 2)
        : [];
    const mainArtigosList = leadArticle
        ? posts.filter(p => p.id !== leadArticle.id)
        : posts;

    // Total de conteúdo (artigos + reflexões + notícias)
    const totalContent = posts.length + reflexoes.length + noticias.length;

    // Tópicos únicos abordados nos artigos
    const totalTopics = new Set(posts.flatMap(p => p.tags || [])).size;

    // Soma dos minutos de leitura de todo o conteúdo (ex.: "10 min de leitura" -> 10)
    const totalReadingMinutes = [...posts, ...reflexoes, ...noticias].reduce(
        (total, item) => total + (parseInt(item.readTime, 10) || 0),
        0
    );

    const paginate = (items: Article[], currentPage: number) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    };

    const totalPages = (items: Article[]) => Math.ceil(items.length / itemsPerPage);

    const Pagination = ({ current, total, onChange }: { current: number; total: number; onChange: (page: number) => void }) => {
        // Como no site original, a barra aparece sempre (mesmo com uma página só).
        const pages = Math.max(total, 1);

        // O original lista TODAS as páginas. Só passa a usar janela de 5
        // números quando há muitas (mais de 10), para a barra não estourar.
        let visiblePages = [];
        if (pages <= 10) {
            visiblePages = Array.from({ length: pages }, (_, i) => i + 1);
        } else {
            if (current <= 3) {
                visiblePages = [1, 2, 3, 4, 5];
            } else if (current >= pages - 2) {
                visiblePages = [pages - 4, pages - 3, pages - 2, pages - 1, pages];
            } else {
                visiblePages = [current - 2, current - 1, current, current + 1, current + 2];
            }
        }

        return (
            <div className="pagination">
                <button
                    onClick={() => onChange(current - 1)}
                    disabled={current === 1}
                    className="btn"
                >
                    « Anterior
                </button>
                {visiblePages.map(page => (
                    <button
                        key={page}
                        onClick={() => onChange(page)}
                        className={`btn ${current === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => onChange(current + 1)}
                    disabled={current === pages}
                    className="btn"
                >
                    Próxima »
                </button>
            </div>
        );
    };

    return (
        <>
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-image">
                            <div className="frame-rectangular">
                                <img
                                    src={get('home.image')}
                                    alt="Mulher representando o Direito"
                                />
                            </div>
                        </div>
                        <div className="hero-text">
                            <h1 style={{ textAlign: 'center' }}>{get('home.title')}</h1>
                            <p>{get('home.p1')}</p>
                            <p>{get('home.p2')}</p>
                            <p>{get('home.p3')}</p>
                            <div className="hero-stats">
                                <AnimatedStat value={Math.floor(totalContent * 0.9)} label="Artigos Publicados" />
                                <AnimatedStat value={totalTopics} label="Tópicos Abordados" />
                                <AnimatedStat value={Math.floor(totalReadingMinutes * 0.9)} label="Minutos de Leitura" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container">
                {/* Hero Section - Always show 3 cards (1 large + 2 small) */}
                <section className="hero">
                    {loading ? (
                        <>
                            {/* Skeleton: lead-article — imagem 320px, h2, excerpt, botão */}
                            <div className="lead-article skeleton-wrapper">
                                <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '4px', marginBottom: '8px' }}></div>
                                <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '4px', marginBottom: '10px' }}></div>
                                <div className="skeleton" style={{ width: '100%', height: '320px', borderRadius: '8px', marginBottom: '14px' }}></div>
                                <div className="skeleton" style={{ width: '85%', height: '26px', borderRadius: '4px', marginBottom: '6px' }}></div>
                                <div className="skeleton" style={{ width: '60%', height: '26px', borderRadius: '4px', marginBottom: '14px' }}></div>
                                <div className="skeleton" style={{ width: '100%', height: '14px', borderRadius: '4px', marginBottom: '5px' }}></div>
                                <div className="skeleton" style={{ width: '95%', height: '14px', borderRadius: '4px', marginBottom: '5px' }}></div>
                                <div className="skeleton" style={{ width: '75%', height: '14px', borderRadius: '4px', marginBottom: '14px' }}></div>
                                <div className="skeleton" style={{ width: '130px', height: '36px', borderRadius: '8px' }}></div>
                            </div>

                            {/* Skeleton: side-cards — 2x card-small com imagem 96px */}
                            <div className="side-cards">
                                {[1, 2].map(i => (
                                    <div key={i} className="card-small skeleton-wrapper">
                                        <div className="skeleton" style={{ width: '90px', height: '22px', borderRadius: '4px', marginBottom: '8px' }}></div>
                                        <div className="skeleton" style={{ width: '100%', height: '96px', borderRadius: '6px', marginBottom: '10px' }}></div>
                                        <div className="skeleton" style={{ width: '90%', height: '16px', borderRadius: '4px', marginBottom: '4px' }}></div>
                                        <div className="skeleton" style={{ width: '65%', height: '16px', borderRadius: '4px', marginBottom: '8px' }}></div>
                                        <div className="skeleton" style={{ width: '130px', height: '13px', borderRadius: '4px' }}></div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : leadArticle ? (
                        <>
                            {/* Main featured card */}
                            <div className="lead-article">
                                <span className={`category ${categoryClass(leadArticle.categoryName)}`}>
                                    {leadArticle.categoryName}
                                </span>
                                <div className="meta">
                                    {leadArticle.date} • {leadArticle.readTime}
                                </div>
                                <Link to={`/artigo/${leadArticle.id}`}>
                                    <img
                                        src={leadArticle.image}
                                        alt={leadArticle.title}
                                        style={{ objectPosition: leadArticle.image_position || '50% 50%' }}
                                        onError={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                            e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                                        }}
                                    />
                                </Link>
                                <Link to={`/artigo/${leadArticle.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    <h1>{leadArticle.title}</h1>
                                </Link>
                                <p className="excerpt">{leadArticle.excerpt}</p>
                                <div style={{ marginTop: '12px' }}>
                                    <Link
                                        to={`/artigo/${leadArticle.id}`}
                                        className="btn primary"
                                    >
                                        Leia na íntegra
                                    </Link>
                                </div>
                            </div>

                            {/* 2 side cards — card-small igual ao Copy.html */}
                            <div className="side-cards">
                                {sideArticles.map((post) => (
                                    <Link key={post.id} to={`/artigo/${post.id}`} className="card-small">
                                        <span className={`category ${categoryClass(post.categoryName)}`}>{post.categoryName}</span>
                                        <img
                                            src={post.image}
                                            loading="lazy"
                                            alt={post.title}
                                            style={{ objectPosition: post.image_position || '50% 50%' }}
                                            onError={(e) => {
                                                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                                e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                                            }}
                                        />
                                        <h4 style={{ margin: '10px 0 6px' }}>{post.title}</h4>
                                        <div className="meta">por {post.author || 'Redação'} • {post.date}</div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                            Nenhum artigo disponível no momento.
                        </p>
                    )}
                </section>

                {/* Artigos Section */}
                <div className="titulo" id="postsContainer">Artigos</div>
                <section className="main">
                    <section className="posts" aria-label="lista de posts">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                            </>
                        ) : (
                            paginate(mainArtigosList, currentPageArtigos).map((post) => (
                                <ArticleCard key={post.id} article={post} linkPrefix="artigo" />
                            ))
                        )}
                    </section>

                    <aside>
                        <div className="widget">
                            <h4>Mais lidos</h4>
                            <ol style={{ paddingLeft: '18px', margin: 0 }}>
                                {posts.slice(0, 3).map((post) => (
                                    <li key={post.id}>
                                        <Link to={`/artigo/${post.id}`}>
                                            <span className={`category ${categoryClass(post.categoryName)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{post.categoryName.split(' ')[0]}</span>{' '}
                                            {post.title}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>
                </section>

                <Pagination
                    current={currentPageArtigos}
                    total={totalPages(mainArtigosList)}
                    onChange={setCurrentPageArtigos}
                />

                {/* Reflexões Section */}
                <div className="titulo" id="reflexoesContainer">Reflexões</div>
                <section className="main">
                    <section className="posts" aria-label="lista de reflexões">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                            </>
                        ) : (
                            paginate(reflexoes, currentPageReflexoes).map((reflexao) => (
                                <ArticleCard key={reflexao.id} article={reflexao} linkPrefix="reflexao" />
                            ))
                        )}
                    </section>

                    <aside>
                        <div className="widget">
                            <h4>Mais lidos</h4>
                            <ol style={{ paddingLeft: '18px', margin: 0 }}>
                                {reflexoes.slice(0, 3).map((reflexao) => (
                                    <li key={reflexao.id}>
                                        <Link to={`/reflexao/${reflexao.id}`}>
                                            <span className={`category ${categoryClass(reflexao.categoryName, true)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{reflexao.categoryName.split(' ')[0]}</span>{' '}
                                            {reflexao.title}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>
                </section>

                <Pagination
                    current={currentPageReflexoes}
                    total={totalPages(reflexoes)}
                    onChange={setCurrentPageReflexoes}
                />

                {/* Notícias Section */}
                <div className="titulo" id="noticiasContainer">Notícias</div>
                <section className="main">
                    <section className="posts" aria-label="lista de notícias">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                            </>
                        ) : noticias.length > 0 ? (
                            paginate(noticias, currentPageNoticias).map((noticia) => (
                                <ArticleCard key={noticia.id} article={noticia} linkPrefix="noticia" />
                            ))
                        ) : (
                            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
                                Nenhuma notícia disponível no momento.
                            </p>
                        )}
                    </section>

                    <aside>
                        <div className="widget">
                            <h4>Mais lidos</h4>
                            <ol style={{ paddingLeft: '18px', margin: 0 }}>
                                {noticias.slice(0, 3).map((noticia) => (
                                    <li key={noticia.id}>
                                        <Link to={`/noticia/${noticia.id}`}>
                                            <span className={`category ${categoryClass(noticia.categoryName)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{noticia.categoryName.split(' ')[0]}</span>{' '}
                                            {noticia.title}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>
                </section>

                <Pagination
                    current={currentPageNoticias}
                    total={totalPages(noticias)}
                    onChange={setCurrentPageNoticias}
                />
            </main>
        </>
    );
}
