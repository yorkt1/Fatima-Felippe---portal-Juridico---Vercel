import { useNavigate, Link } from 'react-router-dom';

export default function Footer() {
    const navigate = useNavigate();

    const handleAdminAccess = () => {
        navigate('/admin-login');
    };

    return (
        <footer>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <strong>Portal Jurídico</strong><br />
                        <small>© 2025 — Todos os direitos reservados.</small><br />
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
                    <div style={{ color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <Link to="/privacidade">Política de Privacidade</Link>
                        <button
                            type="button"
                            onClick={handleAdminAccess}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                opacity: 0.5,
                                padding: '10px',
                                transition: 'opacity 0.2s',
                                zIndex: 10,
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            title="Área restrita"
                        >
                            Área de desenvolvimento
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
