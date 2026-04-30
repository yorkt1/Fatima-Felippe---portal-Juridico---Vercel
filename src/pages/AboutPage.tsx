import { useEffect } from 'react';

export default function AboutPage() {
    useEffect(() => {
        document.title = 'Sobre — Fátima Felippe | Portal Jurídico';
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <section className="sobre-hero">
                <div className="container">
                    <h1>Sobre Fátima T Felippe</h1>
                    <p>Conheça a trajetória, formação e objetivos da advogada por trás do Portal Jurídico</p>
                </div>
            </section>

            <main className="container">
                <div className="sobre-content">
                    <aside className="sobre-profile">
                        <div className="profile-image">
                            <img
                                src="https://res.cloudinary.com/dqewxdbfx/image/upload/v1777508324/profile_fz9eko.jpg"
                                alt="Fátima T Felippe"
                            />
                        </div>
                        <div className="profile-info">
                            <h3>Fátima T Felippe</h3>
                            <p>Advogada</p>
                            <p>OAB/SC n° 42.113</p>
                            <div className="oab-badge">Atuação jurídica</div>

                            <div className="contact-info" style={{ marginTop: '20px' }}>
                                <div className="contact-item">
                                    <i>📚</i>
                                    <span>Especialista em Direito Processual Civil</span>
                                </div>
                                <div className="contact-item">
                                    <i>⚖️</i>
                                    <span>Especialista em Direito Penal e Criminologia</span>
                                </div>
                                <div className="contact-item">
                                    <i>✍️</i>
                                    <span>Autora de Artigos Científicos</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="sobre-details">
                        <h2 className="section-title">Formação Acadêmica</h2>
                        <div className="timeline">
                            <div className="timeline-item">
                                <h4>Graduação em Administração de Empresas</h4>
                                <p>Universidade do Vale do Itajaí (UNIVALI/SC)</p>
                            </div>

                            <div className="timeline-item">
                                <h4>Graduação em Direito</h4>
                                <p>Faculdade CESUSC (atual Faculdade UNICESUSC)</p>
                            </div>

                            <div className="timeline-item">
                                <h4>Pós-graduação em Direito Processual Civil</h4>
                                <p>Centro Universitário Internacional (UNINTER)</p>
                            </div>

                            <div className="timeline-item">
                                <h4>Pós-graduação em Direito Penal e Criminologia</h4>
                                <p>Centro Universitário Internacional (UNINTER)</p>
                            </div>
                        </div>

                        <h2 className="section-title">Publicações e Produção Acadêmica</h2>
                        <div className="publicacoes-grid">
                            <div className="publicacao-card">
                                <h4>Site JUSBRASIL</h4>
                                <p className="justificado">Publicou vários artigos em diversos temas jurídicos, contribuindo para a disseminação do conhecimento jurídico acessível.</p>
                            </div>

                            <div className="publicacao-card">
                                <h4>Revista VIRTUAJUS - PUC MINAS</h4>
                                <p className="justificado">Artigo científico "Criação dos Juizados Especiais como modelo inovador no acesso à justiça" - aceito e publicado pela renomada revista eletrônica.</p>
                            </div>
                        </div>

                        <div className="highlight-box">
                            <p className="justificado">"A criação dos Juizados Especiais como modelo inovador no acesso à justiça" - Artigo científico publicado na Revista eletrônica VIRTUAJUS da PUC Minas, demonstrando comprometimento com pesquisa acadêmica de qualidade."</p>
                        </div>

                        <h2 className="section-title">Cursos e Participações</h2>
                        <ul style={{ color: 'var(--muted)', lineHeight: '1.6', paddingLeft: '20px' }}>
                            <li>Conciliação, Mediação e Arbitragem na CCRR (Corte Catarinense de Resolução de Conflitos)</li>
                            <li>Fórum Nacional dos Juizados Especiais no TJSC (2019)</li>
                            <li>Diversos outros cursos de atualização jurídica</li>
                        </ul>

                        <h2 className="section-title">Experiência Profissional</h2>
                        <p className="justificado" style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                            Ex-servidora do Executivo Federal. Atualmente, dedica sua carreira à advocacia privada, com ênfase no Direito Criminal.
                        </p>

                        <h2 className="section-title">Filosofia Pessoal</h2>
                        <p className="justificado" style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                            Aprecia muito o estudo, o conhecimento e a boa prática dele. Acredita na educação contínua como ferramenta
                            essencial para a excelência profissional e no compartilhamento de conhecimento como forma de contribuir
                            para a sociedade.
                        </p>

                        <h2 className="section-title">Objetivos com o Portal Jurídico</h2>
                        <div className="objetivo-missao">
                            <div className="objetivo-card">
                                <h4>Missão</h4>
                                <p className="justificado">Escrever, publicar e compartilhar conhecimentos na área do direito e matérias afins com todas as pessoas interessadas e conectadas à grande rede.</p>
                            </div>

                            <div className="objetivo-card">
                                <h4>Visão</h4>
                                <p className="justificado">Oferecer um conteúdo jurídico, informativo e de matérias afins,  contribuindo para que informações específicas alcancem aqueles que necessitarem, e sejam úteis quer seja aos estudos, trabalhos ou à vida pessoal.</p>
                            </div>

                            <div className="objetivo-card">
                                <h4>Reflexões</h4>
                                <p className="justificado">Escrever sobre reflexões que possam auxiliar a estimular pensamentos, fornecendo novas perspectivas do cotidiano para além do âmbito estritamente jurídico.</p>
                            </div>
                        </div>

                        <div className="highlight-box" style={{ marginTop: '30px' }}>
                            <p className="justificado">"O Portal Jurídico fatimafelippe.com.br nasceu da convicção de que o conhecimento deve ser acessível a todos.
                                Meu compromisso é com a excelência, ética e compartilhamento de conteúdo que realmente faça diferença na vida das pessoas."</p>
                            <p style={{ textAlign: 'right', marginTop: '10px', fontWeight: '600' }}>- Fátima T Felippe</p>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
