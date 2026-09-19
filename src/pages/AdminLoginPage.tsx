import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react';
import { supabase } from '../services/supabase';
import '../admin/index.css';

// E-mail fixo do administrador. A tela pede só a senha; este e-mail é usado
// internamente para autenticar no Supabase Auth.
// IMPORTANTE: crie no painel do Supabase (Authentication > Users) um usuário
// com EXATAMENTE este e-mail e a senha desejada.
const ADMIN_EMAIL = 'admin@fatimafelippe.com.br';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError('Digite a senha para entrar.');
            return;
        }
        setError('');
        setLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password,
        });

        setLoading(false);

        if (signInError) {
            setError('Senha incorreta. Tente novamente.');
            setPassword('');
        } else {
            navigate('/admin');
        }
    };

    return (
        <div className="adm adm-login">
            <div className="adm-login__card">
                <div className="adm-login__brand">
                    <div className="adm-login__mark" aria-hidden="true">FF</div>
                    <h1 className="adm-login__title">Painel Administrativo</h1>
                    <p className="adm-login__sub">Entre com a senha para gerenciar o conteúdo do portal.</p>
                </div>

                <form onSubmit={handleLogin} noValidate>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="admin-password">Senha de acesso</label>
                        <div className="adm-pass">
                            <input
                                id="admin-password"
                                className="adm-input"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                                placeholder="Digite a senha"
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? 'admin-login-error' : undefined}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="adm-iconbtn adm-pass__toggle"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div id="admin-login-error" className="adm-alert adm-alert--error" role="alert">
                            <TriangleAlert size={16} aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
                        {loading ? <><LoaderCircle size={18} className="adm-spin" aria-hidden="true" /> Entrando…</> : 'Entrar'}
                    </button>
                </form>

                <button type="button" className="adm-login__back" onClick={() => navigate('/')}>
                    <ArrowLeft size={14} aria-hidden="true" /> Voltar para o site
                </button>
            </div>
        </div>
    );
}
