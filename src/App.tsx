import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ArtigosPage from './pages/ArtigosPage';
import ReflexoesPage from './pages/ReflexoesPage';
import NoticiasPage from './pages/NoticiasPage';
import ArticlePage from './pages/ArticlePage';
import ReflexaoPage from './pages/ReflexaoPage';
import NoticiaPage from './pages/NoticiaPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SearchPage from './pages/SearchPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import CookieConsent from './components/CookieConsent';
import { useCopyProtection } from './hooks/useCopyProtection';
import './App.css';

// Carregado sob demanda: só o admin usa o editor rico (TipTap + mammoth),
// que sozinho é a maior parte do bundle. Visitantes do site público nunca
// baixam esse peso — só quem realmente acessa /admin.
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  useCopyProtection();
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artigos" element={<ArtigosPage />} />
          <Route path="/artigo/:id" element={<ArticlePage />} />
          <Route path="/reflexoes" element={<ReflexoesPage />} />
          <Route path="/reflexao/:id" element={<ReflexaoPage />} />
          <Route path="/noticias" element={<NoticiasPage />} />
          <Route path="/noticia/:id" element={<NoticiaPage />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center' }}>Carregando…</div>}>
                <AdminPage />
              </Suspense>
            }
          />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
        </Routes>
        <Footer />
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;
