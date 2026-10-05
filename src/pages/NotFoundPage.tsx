import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

// Pega qualquer rota sem correspondência em App.tsx (ex.: link antigo quebrado,
// URL digitada errada). Sem isso, essas URLs ficavam em branco (nenhuma <Route>
// casava) e ainda respondiam 200 com o index.html via rewrite da Vercel — o
// noindex aqui ao menos evita que o Google as trate como conteúdo indexável.
export default function NotFoundPage() {
    useDocumentMeta(
        'Página não encontrada — Fatima Felippe',
        'A página que você procura não existe ou foi movida.',
        { type: 'website', noindex: true }
    );

    return (
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h1>Página não encontrada</h1>
            <p>A página que você procura não existe ou foi movida.</p>
            <Link to="/" className="btn primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                Voltar para a página inicial
            </Link>
        </div>
    );
}
