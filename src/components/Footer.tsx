import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function Footer() {
    const { get } = useSiteSettings();

    return (
        <footer>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <strong>{get('footer.brand')}</strong><br />
                        <small>{get('footer.copyright')}</small><br />
                        <small style={{ marginTop: '8px', display: 'block' }}>
                            Desenvolvido por{' '}
                            <a
                                href="https://www.linkedin.com/in/guilherme-rocha-oliveira-3942481a2/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent)', textDecoration: 'none' }}
                            >
                                @Guilherme Rocha Oliveira
                            </a>
                        </small>
                        <small style={{ marginTop: '6px', display: 'block', color: 'var(--muted)' }}>
                            Imagens por{' '}
                            <a
                                href="https://www.freepik.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent)', textDecoration: 'none' }}
                            >
                                Freepik
                            </a>
                        </small>
                    </div>
                    <div style={{ color: 'var(--muted)' }}>
                        <Link to="/privacidade">Política de Privacidade</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
