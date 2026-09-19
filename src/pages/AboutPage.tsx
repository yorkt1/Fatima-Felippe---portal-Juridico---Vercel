import { useEffect } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { parseLines, parsePairs } from '../utils/siteText';

export default function AboutPage() {
    const { get } = useSiteSettings();

    useEffect(() => {
        document.title = 'Sobre — Fátima Felippe | Portal Jurídico';
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <section className="sobre-hero">
                <div className="container">
                    <h1>{get('about.title')}</h1>
                    <p>{get('about.subtitle')}</p>
                </div>
            </section>

            <main className="container">
                <div className="sobre-content">
                    <aside className="sobre-profile">
                        <div className="profile-image">
                            <img
                                src={get('about.photo')}
                                alt="Fátima T Felippe"
                            />
                        </div>
                        <div className="profile-info">
                            <h3>{get('about.name')}</h3>
                            <p>{get('about.role')}</p>
                            <p>{get('about.oab')}</p>
                            <div className="oab-badge">{get('about.badge')}</div>

                            <div className="contact-info" style={{ marginTop: '20px' }}>
                                <div className="contact-item">
                                    <i>📚</i>
                                    <span>{get('about.spec1')}</span>
                                </div>
                                <div className="contact-item">
                                    <i>⚖️</i>
                                    <span>{get('about.spec2')}</span>
                                </div>
                                <div className="contact-item">
                                    <i>✍️</i>
                                    <span>{get('about.spec3')}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="sobre-details">
                        <h2 className="section-title">Formação Acadêmica</h2>
                        <div className="timeline">
                            {parsePairs(get('about.formation')).map((item, i) => (
                                <div className="timeline-item" key={i}>
                                    <h4>{item.title}</h4>
                                    <p>{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <h2 className="section-title">Publicações e Produção Acadêmica</h2>
                        <div className="publicacoes-grid">
                            {parsePairs(get('about.publications')).map((item, i) => (
                                <div className="publicacao-card" key={i}>
                                    <h4>{item.title}</h4>
                                    <p className="justificado">{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="highlight-box">
                            <p className="justificado">{get('about.highlight')}</p>
                        </div>

                        <h2 className="section-title">Cursos e Participações</h2>
                        <ul style={{ color: 'var(--muted)', lineHeight: '1.6', paddingLeft: '20px' }}>
                            {parseLines(get('about.courses')).map((course, i) => (
                                <li key={i}>{course}</li>
                            ))}
                        </ul>

                        <h2 className="section-title">Experiência Profissional</h2>
                        <p className="justificado" style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                            {get('about.experience')}
                        </p>

                        <h2 className="section-title">Filosofia Pessoal</h2>
                        <p className="justificado" style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                            {get('about.philosophy')}
                        </p>

                        <h2 className="section-title">Objetivos com o Portal Jurídico</h2>
                        <div className="objetivo-missao">
                            <div className="objetivo-card">
                                <h4>Missão</h4>
                                <p className="justificado">{get('about.mission')}</p>
                            </div>

                            <div className="objetivo-card">
                                <h4>Visão</h4>
                                <p className="justificado">{get('about.vision')}</p>
                            </div>

                            <div className="objetivo-card">
                                <h4>Reflexões</h4>
                                <p className="justificado">{get('about.reflections')}</p>
                            </div>
                        </div>

                        <div className="highlight-box" style={{ marginTop: '30px' }}>
                            <p className="justificado">{get('about.quote')}</p>
                            <p style={{ textAlign: 'right', marginTop: '10px', fontWeight: '600' }}>{get('about.quoteAuthor')}</p>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
