import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === 'Fatimaadv132!@#') {
            // Save authentication state
            sessionStorage.setItem('adminAuthenticated', 'true');
            navigate('/admin');
        } else {
            setError('Código de acesso incorreto');
            setPassword('');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <h1 className="admin-login-title">
                    Área Restrita
                </h1>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label
                            htmlFor="code"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.875rem',
                                color: '#4b5563'
                            }}
                        >
                            Código de Acesso
                        </label>
                        <input
                            id="code"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite o código..."
                            className="admin-login-input"
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            background: '#fee2e2',
                            padding: '8px',
                            borderRadius: '4px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            marginTop: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Entrar
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Voltar para o site
                    </button>
                </form>
            </div>
        </div>
    );
}
