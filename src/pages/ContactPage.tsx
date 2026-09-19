import { useEffect } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { SITE_DEFAULTS } from '../data/siteSettings';
import { safeHttpUrl } from '../utils/siteText';

export default function ContactPage() {
    const { get } = useSiteSettings();
    useEffect(() => {
        document.title = 'Contato — Portal Jurídico Fátima Felippe';
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="contact-page">
            <div className="container">
                <div className="contact-header">
                    <h1>{get('contact.title')}</h1>
                    <p>{get('contact.subtitle')}</p>
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
                                        <a href={`mailto:${get('contact.email')}`}>
                                            {get('contact.email')}
                                        </a>
                                    </p>
                                </div>
                            </div>
                            <div className="info-item" style={{ marginTop: '15px' }}>
                                <div className="info-icon">📞</div>
                                <div className="info-content">
                                    <h3>Telefone</h3>
                                    <p>{get('contact.phone')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="widget">
                            <h4>Redes Sociais</h4>
                            <p>Siga-nos nas redes sociais para ficar por dentro das novidades:</p>
                            <div className="social-links">
                                <a
                                    href={safeHttpUrl(get('contact.instagram'), SITE_DEFAULTS['contact.instagram'])}
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
