import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/busca?q=${encodeURIComponent(searchTerm)}`);
            setMenuOpen(false);
        }
    };

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="container topbar">
                <div className="brand">
                    <img
                        src="https://res.cloudinary.com/dqewxdbfx/image/upload/v1768103475/ChatGPT_Image_11_de_jan._de_2026_00_50_34_liswp9.png"
                        alt="Logo"
                        className="logo"
                        style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '25px' }}>Fatima Felippe</div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                            Artigos, reflexões e notícias
                        </div>
                    </div>
                </div>

                <button
                    className={`menu-toggle ${menuOpen ? 'active' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Abrir menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className={`main-nav ${menuOpen ? 'active' : ''}`} aria-label="menu">
                    <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
                    <NavLink to="/artigos" onClick={() => setMenuOpen(false)}>Artigos</NavLink>
                    <NavLink to="/reflexoes" onClick={() => setMenuOpen(false)}>Reflexões</NavLink>
                    <NavLink to="/noticias" onClick={() => setMenuOpen(false)}>Notícias</NavLink>
                    <NavLink to="/contato" onClick={() => setMenuOpen(false)}>Contato</NavLink>
                    <NavLink to="/sobre" onClick={() => setMenuOpen(false)}>Sobre</NavLink>

                    <form onSubmit={handleSearch} className="search">
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn" style={{ padding: '8px 16px' }}>Ir</button>
                    </form>
                </nav>

                <div
                    className={`overlay ${menuOpen ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                ></div>
            </div>
        </header>
    );
}
