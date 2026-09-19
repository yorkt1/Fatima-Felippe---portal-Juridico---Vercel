import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ArtigosPage from './pages/ArtigosPage';
import ReflexoesPage from './pages/ReflexoesPage';
import NoticiasPage from './pages/NoticiasPage';
import ArticlePage from './pages/ArticlePage';
import ReflexaoPage from './pages/ReflexaoPage';
import NoticiaPage from './pages/NoticiaPage';
import SearchPage from './pages/SearchPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import CookieConsent from './components/CookieConsent';
import { useCopyProtection } from './hooks/useCopyProtection';
import './App.css';

// Carregados sob demanda: só o admin usa o editor rico (TipTap + mammoth),
// que sozinho é a maior parte do bundle. Visitantes do site público nunca
// baixam esse peso — só quem realmente acessa /admin.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));

const adminFallback = (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>
    Carregando…
  </div>
);

// O painel tem layout próprio: não mostra cabeçalho, rodapé nem aviso de
// cookies do site público, e o aviso de "cópia de conteúdo" fica desligado.
function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  useCopyProtection(!isAdmin);

  return (
    <div className={isAdmin ? undefined : 'app'}>
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artigos" element={<ArtigosPage />} />
        <Route path="/artigo/:id" element={<ArticlePage />} />
        <Route path="/reflexoes" element={<ReflexoesPage />} />
        <Route path="/reflexao/:id" element={<ReflexaoPage />} />
        <Route path="/noticias" element={<NoticiasPage />} />
        <Route path="/noticia/:id" element={<NoticiaPage />} />
        <Route path="/busca" element={<SearchPage />} />
        <Route path="/admin" element={<Suspense fallback={adminFallback}><AdminPage /></Suspense>} />
        <Route path="/admin-login" element={<Suspense fallback={adminFallback}><AdminLoginPage /></Suspense>} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <CookieConsent />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
