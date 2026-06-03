import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// E-mail fixo do administrador. A tela pede só a senha; este e-mail é usado
// internamente para autenticar no Supabase Auth.
// IMPORTANTE: crie no painel do Supabase (Authentication > Users) um usuário
// com EXATAMENTE este e-mail e a senha desejada.
const ADMIN_EMAIL = 'admin@fatimafelippe.com.br';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password,
        });

        setLoading(false);

        if (signInError) {
            setError('Senha incorreta');
            setPassword('');
        } else {
            navigate('/admin');
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
                            Senha de Acesso
                        </label>
                        <input
                            id="code"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite a senha..."
                            className="admin-login-input"
                            autoFocus
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
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            marginTop: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
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
