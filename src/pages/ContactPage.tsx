import { useEffect } from 'react';

export default function ContactPage() {
    useEffect(() => {
        document.title = 'Contato — Portal Jurídico Fátima Felippe';
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="contact-page">
            <div className="container">
                <div className="contact-header">
                    <h1>Entre em Contato</h1>
                    <p>Tem alguma dúvida, sugestão ou deseja colaborar com nosso portal? Entre em contato conosco!</p>
                </div>

                <div className="contact-content">
                    <div className="contact-info">
                        <div className="widget">
                            <h4>Informações de Contato</h4>
                            <div className="info-item">
                                <div className="info-icon">✉️</div>
                                <div className="info-content">
                                    <h3>Email</h3>
                                    <p>
                                        <a href="mailto:Fatimafelippe7.adv@gmail.com">
                                            Fatimafelippe7.adv@gmail.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                            <div className="info-item" style={{ marginTop: '15px' }}>
                                <div className="info-icon">📞</div>
                                <div className="info-content">
                                    <h3>Telefone</h3>
                                    <p>(48) 99802-1460</p>
                                </div>
                            </div>
                        </div>

                        <div className="widget">
                            <h4>Redes Sociais</h4>
                            <p>Siga-nos nas redes sociais para ficar por dentro das novidades:</p>
                            <div className="social-links">
                                <a
                                    href="https://www.instagram.com/fatimafelippe7?utm_source=qr&igsh=ZTUyeDhwcjlsem5h"
                                    className="btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
