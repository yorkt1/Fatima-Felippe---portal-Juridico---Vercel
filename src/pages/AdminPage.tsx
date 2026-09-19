import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, GripVertical, Newspaper, Plus, Search, SearchX, TriangleAlert, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import ArticleForm from '../components/ArticleForm';
import SiteSettingsForm from '../components/SiteSettingsForm';
import ConfirmModal from '../components/ConfirmModal';
import AdminLayout from '../components/admin/AdminLayout';
import type { ContentType } from '../components/admin/AdminLayout';
import ContentRow from '../components/admin/ContentRow';
import { EmptyState, RowSkeleton } from '../components/admin/ListStates';
import { useToast } from '../components/Toast';
import { normalize } from '../utils/search';

type View = 'list' | 'form' | 'site';

const TYPE_INFO: Record<ContentType, { plural: string; description: string; newLabel: string; emptyTitle: string; icon: typeof FileText }> = {
    artigos: {
        plural: 'Artigos', description: 'Artigos jurídicos publicados no portal.',
        newLabel: 'Novo artigo', emptyTitle: 'Nenhum artigo ainda', icon: FileText,
    },
    reflexoes: {
        plural: 'Reflexões', description: 'Textos de reflexão, com ou sem áudio.',
        newLabel: 'Nova reflexão', emptyTitle: 'Nenhuma reflexão ainda', icon: BookOpen,
    },
    noticias: {
        plural: 'Notícias', description: 'Notícias e atualizações do mundo jurídico.',
        newLabel: 'Nova notícia', emptyTitle: 'Nenhuma notícia ainda', icon: Newspaper,
    },
};

const CONTENT_TYPES: ContentType[] = ['artigos', 'reflexoes', 'noticias'];

// Move um item de uma posição para outra, sem alterar a lista original.
function moveItem<T>(list: T[], from: number, to: number): T[] {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}

export default function AdminPage() {
    const navigate = useNavigate();
    const [view, setView] = useState<View>('list');
    const [selectedType, setSelectedType] = useState<ContentType>('artigos');
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [contentList, setContentList] = useState<Article[]>([]);
    const [counts, setCounts] = useState<Partial<Record<ContentType, number>>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const { showToast, ToastComponent } = useToast();

    useEffect(() => {
        // Verifica a sessão atual do Supabase Auth
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) navigate('/admin-login');
            else setUserEmail(session.user.email ?? null);
        });

        // Reage a logout / expiração de token em tempo real
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/admin-login');
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin-login');
    };

    const fetchContent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .eq('type', selectedType)
                .order('position', { ascending: true })
                .order('featured', { ascending: false })
                .order('id', { ascending: false });

            if (error) throw error;
            setContentList(data || []);
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('Error fetching content:', err);
            setContentList([]);
            if (err?.code === 'PGRST204' || err?.code === 'PGRST205' || err?.message?.includes('404')) {
                setError('A tabela "contents" não foi encontrada. Execute o script SQL no Supabase para criá-la.');
            } else {
                setError('Erro ao carregar conteúdo: ' + (err.message || 'Erro desconhecido'));
            }
        } finally {
            setLoading(false);
        }
    }, [selectedType]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    // Quantidade de itens de cada tipo (mostrada nas abas)
    const fetchCounts = useCallback(async () => {
        const results = await Promise.all(CONTENT_TYPES.map(t =>
            supabase.from('contents').select('id', { count: 'exact', head: true }).eq('type', t)
        ));
        const next: Partial<Record<ContentType, number>> = {};
        results.forEach((r, i) => { if (!r.error && r.count !== null) next[CONTENT_TYPES[i]] = r.count; });
        setCounts(next);
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    // ── Ordem ──────────────────────────────────────────────────────────────
    // Grava a nova ordem (posição = índice + 1). supabase-js resolve com { error }
    // em vez de rejeitar, então cada resultado é checado explicitamente.
    const persistOrder = async (newList: Article[]) => {
        setContentList(newList); // atualização otimista
        try {
            const results = await Promise.all(newList.map((item, index) =>
                supabase.from('contents').update({ position: index + 1 }).eq('id', item.id)
            ));
            const failed = results.find(r => r.error);
            if (failed?.error) throw failed.error;
            showToast('Ordem atualizada com sucesso', 'success');
        } catch (err) {
            console.error('Error updating positions:', err);
            showToast('Erro ao salvar a nova ordem', 'error');
            fetchContent(); // desfaz a atualização otimista
        }
    };

    const handleDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
        e.dataTransfer.setData('text/plain', String(index));
        e.dataTransfer.effectAllowed = 'move';
        setDragIndex(index);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setOverIndex(null);
    };

    const handleDragOver = (e: DragEvent<HTMLLIElement>, index: number) => {
        if (dragIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (overIndex !== index) setOverIndex(index);
    };

    const handleDrop = async (e: DragEvent<HTMLLIElement>, dropIndex: number) => {
        e.preventDefault();
        const from = dragIndex ?? parseInt(e.dataTransfer.getData('text/plain'), 10);
        handleDragEnd();
        if (Number.isNaN(from) || from === dropIndex) return;
        await persistOrder(moveItem(contentList, from, dropIndex));
    };

    const handlePositionCommit = async (oldIndex: number, position: number) => {
        const newIndex = Math.min(Math.max(position - 1, 0), contentList.length - 1);
        if (oldIndex === newIndex) return;
        await persistOrder(moveItem(contentList, oldIndex, newIndex));
    };

    // ── Destaque / exclusão ────────────────────────────────────────────────
    const handleToggleFeatured = async (item: Article) => {
        const turnOn = !item.featured;
        try {
            if (turnOn) {
                // Só 1 destaque por tipo: marca este e desmarca os outros
                setContentList(prev => prev.map(i => ({ ...i, featured: i.id === item.id })));
                const reset = await supabase.from('contents').update({ featured: false }).eq('type', selectedType);
                if (reset.error) throw reset.error;
                const { error } = await supabase.from('contents').update({ featured: true }).eq('id', item.id);
                if (error) throw error;
            } else {
                setContentList(prev => prev.map(i => (i.id === item.id ? { ...i, featured: false } : i)));
                const { error } = await supabase.from('contents').update({ featured: false }).eq('id', item.id);
                if (error) throw error;
            }
            showToast(turnOn ? 'Destaque definido!' : 'Destaque removido', 'success');
        } catch (error) {
            console.error('Error toggling featured:', error);
            showToast('Erro ao alterar destaque', 'error');
            fetchContent();
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('contents').delete().eq('id', deleteTarget.id);
            if (error) throw error;

            setContentList(prev => prev.filter(i => i.id !== deleteTarget.id));
            fetchCounts();
            showToast('Item excluído com sucesso', 'success');
        } catch (error) {
            console.error('Error deleting content:', error);
            showToast('Erro ao excluir item', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    // ── Navegação ──────────────────────────────────────────────────────────
    const openNew = () => { setEditingArticle(null); setView('form'); };
    const openEdit = (article: Article) => { setEditingArticle(article); setView('form'); };
    const backToList = () => { setView('list'); setEditingArticle(null); };

    const handleSuccess = () => {
        showToast(editingArticle ? 'Conteúdo atualizado!' : 'Conteúdo criado!', 'success');
        backToList();
        fetchContent();
        fetchCounts();
    };

    const selectType = (type: ContentType) => {
        setSelectedType(type);
        setQuery('');
    };

    // ── Busca (sem acento, em título/resumo/categoria/autor) ───────────────
    const visible = useMemo(() => {
        const q = normalize(query.trim());
        if (!q) return contentList;
        return contentList.filter(i =>
            normalize([i.title, i.excerpt, i.categoryName, i.author].filter(Boolean).join(' ')).includes(q)
        );
    }, [contentList, query]);

    const searching = query.trim() !== '';
    const reorderEnabled = !searching;
    const info = TYPE_INFO[selectedType];
    const EmptyIcon = info.icon;

    return (
        <AdminLayout
            active={selectedType}
            showTabs={view === 'list'}
            counts={counts}
            email={userEmail}
            onSelectType={selectType}
            onOpenSiteSettings={() => setView('site')}
            onLogout={handleLogout}
        >
            {ToastComponent}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                title="Excluir este item?"
                message={deleteTarget ? `“${deleteTarget.title}” será removido do site. Essa ação não pode ser desfeita.` : ''}
                confirmLabel="Excluir"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {view === 'form' && (
                <ArticleForm type={selectedType} initialData={editingArticle} onCancel={backToList} onSuccess={handleSuccess} />
            )}

            {view === 'site' && <SiteSettingsForm onClose={() => setView('list')} />}

            {view === 'list' && (
                <div className="adm-page">
                    <div className="adm-pagehead">
                        <div>
                            <h1>{info.plural}</h1>
                            <p>{info.description}</p>
                        </div>
                        <div className="adm-pagehead__actions">
                            <button type="button" className="adm-btn adm-btn--primary" onClick={openNew}>
                                <Plus size={16} aria-hidden="true" /> {info.newLabel}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="adm-alert adm-alert--error" role="alert" style={{ marginBottom: 16 }}>
                            <TriangleAlert size={18} aria-hidden="true" />
                            <div>{error}</div>
                        </div>
                    )}

                    <div className="adm-toolbar">
                        <div className="adm-search">
                            <Search size={16} aria-hidden="true" />
                            <input
                                className="adm-input"
                                type="search"
                                placeholder="Buscar por título, categoria ou autor…"
                                aria-label="Buscar conteúdos"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                            {searching && (
                                <button type="button" className="adm-iconbtn adm-search__clear" aria-label="Limpar busca" onClick={() => setQuery('')}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        {!loading && (
                            <div className="adm-toolbar__info">
                                {searching
                                    ? <span>{visible.length} de {contentList.length}</span>
                                    : contentList.length > 1 && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <GripVertical size={14} aria-hidden="true" /> Arraste pela alça ou digite a posição para reordenar
                                        </span>
                                    )}
                            </div>
                        )}
                    </div>

                    <section className="adm-card" aria-busy={loading}>
                        {loading ? (
                            <ul className="adm-list">
                                {[1, 2, 3, 4].map(i => <RowSkeleton key={i} />)}
                            </ul>
                        ) : visible.length === 0 ? (
                            searching ? (
                                <EmptyState
                                    icon={<SearchX size={26} />}
                                    title="Nada encontrado"
                                    text={`Nenhum resultado para “${query.trim()}”. Tente outras palavras.`}
                                    action={<button type="button" className="adm-btn" onClick={() => setQuery('')}>Limpar busca</button>}
                                />
                            ) : (
                                <EmptyState
                                    icon={<EmptyIcon size={26} />}
                                    title={info.emptyTitle}
                                    text="Comece criando o primeiro. Ele aparece no site assim que for salvo."
                                    action={
                                        <button type="button" className="adm-btn adm-btn--primary" onClick={openNew}>
                                            <Plus size={16} aria-hidden="true" /> {info.newLabel}
                                        </button>
                                    }
                                />
                            )
                        ) : (
                            <ul className="adm-list">
                                {visible.map((item, index) => (
                                    <ContentRow
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        total={contentList.length}
                                        reorderEnabled={reorderEnabled}
                                        isDragging={dragIndex === index}
                                        isOver={overIndex === index && dragIndex !== null && dragIndex !== index}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDragLeave={() => setOverIndex(null)}
                                        onDrop={handleDrop}
                                        onPositionCommit={handlePositionCommit}
                                        onToggleFeatured={handleToggleFeatured}
                                        onEdit={openEdit}
                                        onDelete={setDeleteTarget}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}
