import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import ArticleForm from '../components/ArticleForm';
import SkeletonCard from '../components/SkeletonCard';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { Trash2, Edit, Star } from 'lucide-react';

type ContentType = 'artigos' | 'reflexoes' | 'noticias';

export default function AdminPage() {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState<ContentType>('artigos');
    const [isCreating, setIsCreating] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [contentList, setContentList] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
    const { showToast, ToastComponent } = useToast();

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
        if (isAuthenticated !== 'true') {
            navigate('/admin-login');
        }
    }, [navigate]);

    const fetchContent = async () => {
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
        } catch (error: any) {
            console.error('Error fetching content:', error);
            setContentList([]);
            if (error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.message?.includes('404')) {
                setError('A tabela "contents" não foi encontrada. Por favor, crie a tabela no Supabase.');
            } else {
                setError('Erro ao carregar conteúdo: ' + (error.message || 'Erro desconhecido'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [selectedType]);

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
        // Add a class specifically for dragging styling if needed
        (e.target as HTMLElement).style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        (e.target as HTMLElement).style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (dragIndex === dropIndex) return;

        const newContentList = [...contentList];
        const [movedItem] = newContentList.splice(dragIndex, 1);
        newContentList.splice(dropIndex, 0, movedItem);

        // Optimistic UI update
        setContentList(newContentList);

        // Prepare batch update for Supabase
        // We only update items that actually changed position in the visible range
        // But to be safe and simple properly, let's update indices for the affected range
        // For simplicity in this implementation, we re-assign position to all based on current index
        const updates = newContentList.map((item, index) => ({
            id: item.id,
            position: index + 1 // 1-based index
        }));

        try {
            // Update in Supabase
            // Since Supabase doesn't support bulk update of different values easily in one query without RPC,
            // we will iterate. For small lists this is fine. For larger lists, an RPC function would be better.

            // To avoid too many requests, we can just update the ones that changed?
            // Actually, simply iterating is safer to ensure consistency.
            await Promise.all(updates.map(update =>
                supabase
                    .from('contents')
                    .update({ position: update.position })
                    .eq('id', update.id)
            ));

            showToast('Ordem atualizada com sucesso', 'success');
        } catch (err) {
            console.error('Error updating positions:', err);
            showToast('Erro ao salvar a nova ordem', 'error');
            fetchContent(); // Revert on error
        }
    };

    const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
        const newFeaturedState = !currentFeatured;

        try {
            if (newFeaturedState) {
                // If checking (turning ON):
                // 1. Optimistic update: Set clicked to true, all others to false
                setContentList(prev => prev.map(item => ({
                    ...item,
                    featured: item.id === id ? true : false
                })));

                // 2. Database update: Reset all of this type to false
                await supabase
                    .from('contents')
                    .update({ featured: false })
                    .eq('type', selectedType);

                // 3. Database update: Set the specific one to true
                const { error } = await supabase
                    .from('contents')
                    .update({ featured: true })
                    .eq('id', id);

                if (error) throw error;
            } else {
                // If unchecking (turning OFF):
                // 1. Optimistic update: Set clicked to false
                setContentList(prev => prev.map(item =>
                    item.id === id ? { ...item, featured: false } : item
                ));

                // 2. Database update: Set to false
                const { error } = await supabase
                    .from('contents')
                    .update({ featured: false })
                    .eq('id', id);

                if (error) throw error;
            }

            showToast(
                newFeaturedState ? 'Destaque definido!' : 'Destaque removido',
                'success'
            );
        } catch (error) {
            console.error('Error toggling featured:', error);
            showToast('Erro ao alterar destaque', 'error');
            fetchContent(); // Revert on error
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase
                .from('contents')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setContentList(prev => prev.filter(item => item.id !== id));
            showToast('Item excluído com sucesso', 'success');
            setDeleteModal({ isOpen: false, id: null });
        } catch (error) {
            console.error('Error deleting content:', error);
            showToast('Erro ao excluir item', 'error');
        }
    };

    const handleEdit = (article: Article) => {
        setEditingArticle(article);
        setIsCreating(true);
    };

    const handleSuccess = () => {
        setIsCreating(false);
        setEditingArticle(null);
        fetchContent();
        showToast(
            editingArticle ? 'Conteúdo atualizado!' : 'Conteúdo criado!',
            'success'
        );
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingArticle(null);
    };

    if (isCreating) {
        return (
            <div style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
                <ArticleForm
                    type={selectedType}
                    initialData={editingArticle}
                    onCancel={handleCancel}
                    onSuccess={handleSuccess}
                />
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            {ToastComponent}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
                onConfirm={() => deleteModal.id && handleDelete(deleteModal.id)}
                onCancel={() => setDeleteModal({ isOpen: false, id: null })}
            />

            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Painel Administrativo</h1>

            {/* Tabs */}
            <div className="admin-tabs">
                {(['artigos', 'reflexoes', 'noticias'] as ContentType[]).map((type) => (
                    <button
                        key={type}
                        className={`btn ${selectedType === type ? 'primary' : ''}`}
                        onClick={() => setSelectedType(type)}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content List */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
                <div className="admin-header-controls">
                    <h2>Gerenciar {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}</h2>
                    <button className="btn primary" onClick={() => setIsCreating(true)}>+ Novo Conteúdo</button>
                </div>

                {error && (
                    <div style={{ padding: '15px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
                        {error}
                        <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
                            Certifique-se de executar o script SQL no Supabase para criar a tabela.
                        </p>
                    </div>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {contentList.map((item, index) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`admin-card-grid ${item.featured ? 'featured' : ''}`}
                                style={{ cursor: 'move' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--muted)' }}>
                                    ⋮⋮
                                </div>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{
                                        width: '100px',
                                        height: '70px',
                                        objectFit: 'cover',
                                        borderRadius: '6px'
                                    }}
                                />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px' }}>{item.title}</h3>
                                        {item.featured && <span style={{ fontSize: '16px' }}>⭐</span>}
                                    </div>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--muted)' }}>
                                        {item.excerpt}
                                    </p>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        <span className={`category ${item.category}`}>{item.categoryName}</span>
                                        <span style={{ margin: '0 8px' }}>•</span>
                                        {item.date}
                                        <span style={{ margin: '0 8px' }}>•</span>
                                        {item.readTime}
                                    </div>
                                </div>
                                <div className="admin-actions">
                                    <button
                                        className="btn"
                                        title={item.featured ? "Remover destaque" : "Destacar artigo"}
                                        onClick={() => handleToggleFeatured(item.id, item.featured || false)}
                                        style={{
                                            padding: '8px',
                                            background: item.featured ? '#fbbf24' : 'transparent',
                                            color: item.featured ? 'white' : '#666'
                                        }}
                                    >
                                        <Star size={18} fill={item.featured ? 'white' : 'none'} />
                                    </button>
                                    <button
                                        className="btn"
                                        title="Editar"
                                        onClick={() => handleEdit(item)}
                                        style={{ padding: '8px' }}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="btn"
                                        title="Excluir"
                                        style={{ color: '#dc2626', padding: '8px' }}
                                        onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && contentList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                        <p>Nenhum conteúdo encontrado.</p>
                        <p>Clique em "+ Novo Conteúdo" para adicionar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
