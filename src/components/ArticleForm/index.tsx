import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import type { Selection } from '@tiptap/pm/state';
import { supabase } from '../../services/supabase';
import type { Article } from '../../data/content';
import { Upload } from 'lucide-react';
import * as mammoth from 'mammoth';
import { FontSize, TabIndent, Indent, LineHeight, TextIndent, CellWithBackground } from './extensions';
import { embedDocxFormatting, applyDocxFormatting } from './docxFormatting';
import { cleanWordHtml, base64ToBlob } from './wordImport';
import { useToast } from '../Toast';
import './ArticleForm.css';

interface ArticleFormProps {
    type: string;
    initialData?: Article | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
const FONT_FAMILIES = [
    { label: 'Padrão', value: '' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Tahoma', value: 'Tahoma' },
    { label: 'Courier New', value: 'Courier New' },
];

const LINE_HEIGHTS = [
    { label: 'Simples', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: 'Duplo', value: '2' },
    { label: '2.5', value: '2.5' },
];

export default function ArticleForm({ type, initialData, onCancel, onSuccess }: ArticleFormProps) {
    const { showToast, ToastComponent } = useToast();
    const [loading, setLoading] = useState(false);
    const [audioUploading, setAudioUploading] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [showTableInput, setShowTableInput] = useState(false);
    const [showTextColorPalette, setShowTextColorPalette] = useState(false);
    const [showBgColorPalette, setShowBgColorPalette] = useState(false);
    const [showLineHeightMenu, setShowLineHeightMenu] = useState(false);
    const [currentTextColor, setCurrentTextColor] = useState('#111111');
    const [currentBgColor, setCurrentBgColor] = useState('#ffff00');
    const textColorRef = useRef<HTMLInputElement>(null);
    const bgColorRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const prevLineHeightRef = useRef<string | null>(null);
    // Salva a seleção do editor antes de abrir o dropdown (evita perda de foco)
    const savedSelectionRef = useRef<Selection | null>(null);

    const [formData, setFormData] = useState<Partial<Article>>(initialData || {
        type,
        title: '',
        category: '',
        categoryName: '',
        excerpt: '',
        image: '',
        image_position: '50% 50%',
        author: 'Fátima T. Felippe',
        content: '',
        date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
        readTime: '5 min de leitura',
        tags: [],
        audio_url: ''
    });

    const isEditing = !!initialData;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell', 'tableHeader'] }),
            TextStyle,
            FontSize,
            Color,
            Underline,
            Subscript,
            Superscript,
            Highlight.configure({ multicolor: true }),
            FontFamily,
            LineHeight,
            Indent,
            TextIndent,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
            }),
            Image.configure({ inline: false, allowBase64: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            CellWithBackground,
            TabIndent,
        ],
        content: (formData.content || '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' '),
        onUpdate: ({ editor }) => {
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        },
        editorProps: {
            attributes: { class: 'tiptap-editor-content' },
            transformPastedHTML(html) {
                // Usa nossa função inteligente que preserva os estilos visuais do Word
                return cleanWordHtml(html);
            },
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setLoading(true);
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('content-images')
                .upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('content-images').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, image: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Erro ao enviar imagem. Verifique as permissões.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDocxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setLoading(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            // O mammoth só entende a estrutura; alinhamento, cor, tamanho, fonte, realce,
            // recuos e cor de célula vão "de carona" em marcadores (ver docxFormatting.ts).
            const { buffer, table } = await embedDocxFormatting(arrayBuffer);
            const result = await mammoth.convertToHtml(
                { arrayBuffer: buffer },
                {
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p[style-name='Quote'] => blockquote:fresh",
                        "r[style-name='Strong'] => strong",
                        "u => u",
                        "table => table:fresh"
                    ],
                    // Sobe cada imagem do .docx para o Storage em vez de embuti-la como
                    // base64 no HTML (linhas de vários MB no banco, ver base64ToBlob acima).
                    convertImage: mammoth.images.imgElement(async (image) => {
                        const base64 = await image.read('base64');
                        try {
                            const blob = base64ToBlob(base64, image.contentType);
                            const fileExt = image.contentType.split('/').pop() || 'png';
                            const fileName = `docx-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                            const { error: uploadError } = await supabase.storage
                                .from('content-images')
                                .upload(fileName, blob, { contentType: image.contentType });
                            if (uploadError) throw uploadError;
                            const { data } = supabase.storage.from('content-images').getPublicUrl(fileName);
                            return { src: data.publicUrl };
                        } catch (uploadError) {
                            // Falha no Storage não deve derrubar a importação inteira:
                            // mantém a imagem inline como base64 nesse caso pontual.
                            console.error('Error uploading docx image, embedding inline instead:', uploadError);
                            return { src: `data:${image.contentType};base64,${base64}` };
                        }
                    })
                }
            );

            if (editor) {
                // Insere no editor preservando HTML Rico, sem &nbsp; do Word
                const withFormatting = applyDocxFormatting(result.value, table);
                const cleanedContent = withFormatting.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
                editor.commands.setContent(cleanedContent);
            }
            showToast("Documento Word importado com sucesso!", 'success');
        } catch (error) {
            console.error('Error importing docx:', error);
            showToast("Erro ao importar o documento Word. Certifique-se de que é um formato .docx válido.", 'error');
        } finally {
            setLoading(false);
            e.target.value = ''; // Limpa o input
        }
    };

    // Upload de áudio para Supabase Storage
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setAudioUploading(true);
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `audio-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('content-images')
                .upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('content-images').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, audio_url: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading audio:', error);
            showToast('Erro ao enviar áudio. Verifique as permissões do storage.', 'error');
        } finally {
            setAudioUploading(false);
        }
    };

    // Remover áudio
    const handleRemoveAudio = () => {
        setFormData(prev => ({ ...prev, audio_url: '' }));
        if (audioInputRef.current) audioInputRef.current.value = '';
    };

    // Upload de imagem DENTRO do editor — vai para o Storage (como a capa),
    // em vez de virar base64 inline no HTML salvo.
    const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `editor-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('content-images')
                .upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('content-images').getPublicUrl(fileName);
            editor?.chain().focus().setImage({ src: data.publicUrl }).run();
        } catch (error) {
            console.error('Error uploading editor image:', error);
            showToast('Erro ao enviar imagem. Verifique as permissões do storage.', 'error');
        } finally {
            e.target.value = '';
        }
    };

    const handleInsertLink = () => {
        if (!linkUrl) return;
        if (editor?.state.selection.empty) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        } else {
            editor?.chain().focus().setLink({ href: linkUrl }).run();
        }
        setLinkUrl('');
        setShowLinkInput(false);
    };

    const handleInsertTable = () => {
        editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
        setShowTableInput(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // formData.type reflete o select "Tipo de Conteúdo" — permite mover o
            // item entre Artigos/Reflexões/Notícias. Cai para a aba atual (prop
            // "type") só se por algum motivo o campo não tiver sido inicializado.
            const contentType = formData.type || type;
            let error;
            if (isEditing && initialData?.id) {
                const { error: updateError } = await supabase
                    .from('contents').update({ ...formData, type: contentType }).eq('id', initialData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('contents').insert([{ ...formData, type: contentType }]);
                error = insertError;
            }
            if (error) throw error;
            // Sucesso já é avisado pelo toast do AdminPage após onSuccess() (evita notificação dupla).
            onSuccess();
        } catch (error) {
            console.error('Error saving content:', error);
            showToast('Erro ao salvar conteúdo. Verifique as configurações do Supabase.', 'error');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {ToastComponent}
            <h2 style={{ marginBottom: '24px', fontSize: '1.25rem', color: '#111827' }}>
                {isEditing ? 'Editar Conteúdo' : 'Novo Conteúdo'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Tipo de Conteúdo — em qual seção do site o item aparece */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Tipo de Conteúdo</label>
                    <select name="type" value={formData.type || type}
                        onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        required className="admin-login-input">
                        <option value="artigos">Artigos</option>
                        <option value="reflexoes">Reflexões</option>
                        <option value="noticias">Notícias</option>
                    </select>
                    {isEditing && formData.type && formData.type !== initialData?.type && (
                        <p style={{ fontSize: '12px', color: '#b45309', marginTop: '6px', marginBottom: 0 }}>
                            ⚠️ Ao mudar o tipo, o link antigo (
                            {initialData?.type === 'artigos' ? 'artigo' : initialData?.type === 'reflexoes' ? 'reflexao' : 'noticia'}
                            /{initialData?.id}) para de funcionar — o item passa a existir só no novo endereço.
                        </p>
                    )}
                </div>

                {/* Título */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Título</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required
                        className="admin-login-input" placeholder="Digite o título do artigo..." />
                </div>

                {/* Categoria + Nome */}
                <div className="form-row form-row-group">
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Categoria</label>
                        <select name="category" value={formData.category}
                            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            required className="admin-login-input">
                            <option value="">Selecione uma categoria</option>
                            <option value="artigo">Artigo</option>
                            <option value="reflexao">Reflexão</option>
                            <option value="noticia">Notícia</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Nome Exibido</label>
                        <input type="text" name="categoryName" placeholder="ex: Direito Civil"
                            value={formData.categoryName} onChange={handleChange} required className="admin-login-input" />
                    </div>
                </div>

                {/* Data + Leitura */}
                <div className="form-row form-row-group">
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Data</label>
                        <input type="text" name="date" value={formData.date} onChange={handleChange} required
                            className="admin-login-input" placeholder="ex: 11 de janeiro de 2024" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Tempo de Leitura</label>
                        <input type="text" name="readTime" value={formData.readTime} onChange={handleChange} required
                            className="admin-login-input" placeholder="ex: 5 min de leitura" />
                    </div>
                </div>

                {/* Autor */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>✍️ Autor</label>
                    <input
                        type="text"
                        name="author"
                        value={formData.author || ''}
                        onChange={handleChange}
                        required
                        className="admin-login-input"
                        placeholder="ex: Fátima T. Felippe, Redação..."
                    />
                </div>

                {/* Imagem de Capa */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Imagem de Capa</label>
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151', minWidth: '100px' }}>Cole uma URL:</span>
                        <input type="text" name="image" placeholder="https://..." value={formData.image}
                            onChange={handleChange} className="admin-login-input" style={{ flex: 1 }} />
                    </div>
                    <div className="image-upload-area">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="image-upload-input" />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                            <Upload size={32} />
                            <span>Ou clique para upload / arraste uma imagem</span>
                        </div>
                    </div>
                    {formData.image && (
                        <div style={{ marginTop: '10px', padding: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fafafa' }}>
                            <span style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                                🎯 Ponto focal — clique na imagem para escolher o que aparece recortado nos cards
                            </span>
                            <div
                                style={{ position: 'relative', cursor: 'crosshair', display: 'inline-block', maxWidth: '100%', lineHeight: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
                                    const x = clamp(((e.clientX - rect.left) / rect.width) * 100);
                                    const y = clamp(((e.clientY - rect.top) / rect.height) * 100);
                                    setFormData(prev => ({ ...prev, image_position: `${x}% ${y}%` }));
                                }}
                            >
                                <img src={formData.image} alt="Preview"
                                    style={{ maxHeight: '320px', maxWidth: '100%', width: 'auto', height: 'auto', display: 'block' }} />
                                {/* Marcador do ponto focal escolhido */}
                                <span style={{
                                    position: 'absolute',
                                    left: (formData.image_position || '50% 50%').split(' ')[0],
                                    top: (formData.image_position || '50% 50%').split(' ')[1],
                                    transform: 'translate(-50%, -50%)',
                                    width: 22, height: 22, borderRadius: '50%',
                                    border: '3px solid #2563eb',
                                    boxShadow: '0 0 0 2px white, 0 1px 4px rgba(0,0,0,0.4)',
                                    background: 'rgba(37,99,235,0.25)',
                                    pointerEvents: 'none',
                                }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                                <span>Posição: <strong>{formData.image_position || '50% 50%'}</strong></span>
                                <button type="button" className="btn"
                                    onClick={() => setFormData(prev => ({ ...prev, image_position: '50% 50%' }))}
                                    style={{ padding: '4px 10px', fontSize: '12px' }}>
                                    Centralizar
                                </button>
                            </div>
                            {/* Mini pré-visualização do recorte do card */}
                            <div style={{ marginTop: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Como ficará no card:</span>
                                <div style={{ width: '240px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: '4px' }}>
                                    <img src={formData.image} alt="Card preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: formData.image_position || '50% 50%', display: 'block' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Tags (separadas por vírgula)</label>
                    <input type="text" name="tagsInput"
                        placeholder="Ex: Constituição Federal, Direito Civil, Emendas"
                        value={formData.tags?.join(', ') || ''}
                        onChange={e => {
                            const newTags = e.target.value.split(',').map(t => t.trim());
                            setFormData(prev => ({ ...prev, tags: newTags }));
                        }}
                        className="admin-login-input" />
                </div>

                {/* Áudio da Reflexão / Artigo */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>🎧 Áudio (opcional)</label>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: 0 }}>Envie um arquivo de áudio (.mp3, .wav, .ogg) que será exibido junto ao conteúdo para o leitor.</p>
                    
                    {!formData.audio_url ? (
                        <div className="audio-upload-area">
                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3,.mp3,.wav,.ogg"
                                onChange={handleAudioUpload}
                                className="image-upload-input"
                                disabled={audioUploading}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                                <span style={{ fontSize: '32px' }}>{audioUploading ? '⏳' : '🎵'}</span>
                                <span>{audioUploading ? 'Enviando áudio...' : 'Clique para upload ou arraste um áudio'}</span>
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Formatos: MP3, WAV, OGG</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            padding: '16px', 
                            background: '#f0fdf4', 
                            borderRadius: '10px', 
                            border: '1px solid #bbf7d0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: '#16a34a', fontSize: '14px' }}>✅ Áudio carregado</span>
                                <button
                                    type="button"
                                    onClick={handleRemoveAudio}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '6px',
                                        padding: '4px 12px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 500
                                    }}
                                >
                                    🗑 Remover
                                </button>
                            </div>
                            <audio controls style={{ width: '100%' }}>
                                <source src={formData.audio_url} type="audio/mpeg" />
                                Seu navegador não suporta o elemento de áudio.
                            </audio>
                        </div>
                    )}
                </div>

                {/* Resumo */}
                <div className="form-row">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Resumo</label>
                    <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} required rows={3}
                        className="admin-login-input" placeholder="Breve descrição do artigo..." />
                </div>

                {/* ══════════════ EDITOR RICO — LAYOUT DOCUMENTO ══════════════ */}
                <div className="doc-editor-wrapper" style={{ width: '100%' }}>

                    {/* Título simples acima do editor, sem deslocar o layout */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>✏️ Conteúdo Completo</label>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Cole do Word ou importe um .docx — mantém alinhamento, cor, tamanho, fonte, realce, recuos e cor de tabela</span>
                    </div>

                    {/* Container principal do editor */}
                    <div className="doc-editor-container">

                        {/* ── BARRA DE FERRAMENTAS FIXA NA VIEWPORT ── */}
                        <div className="doc-toolbar">

                            {/* Linha principal de ferramentas */}
                            <div className="doc-toolbar-row">
                                <select
                                    title="Família da Fonte"
                                    onChange={e => {
                                        if (e.target.value) editor?.chain().focus().setFontFamily(e.target.value).run();
                                        else editor?.chain().focus().unsetFontFamily().run();
                                    }}
                                    className="doc-select doc-select-font">
                                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>

                                <select
                                    title="Tamanho da Fonte"
                                    onChange={e => {
                                        if (e.target.value) {
                                            editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value + 'px' }).run();
                                        }
                                    }}
                                    className="doc-select doc-select-size">
                                    <option value="">Pt</option>
                                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                <div className="doc-sep" />

                                <button type="button" className={`doc-btn${editor?.isActive('bold') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)"><strong>B</strong></button>
                                <button type="button" className={`doc-btn${editor?.isActive('italic') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Itálico (Ctrl+I)"><em>I</em></button>
                                <button type="button" className={`doc-btn${editor?.isActive('underline') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Sublinhado (Ctrl+U)"><span style={{ textDecoration: 'underline' }}>U</span></button>
                                <button type="button" className={`doc-btn${editor?.isActive('strike') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Tachado"><span style={{ textDecoration: 'line-through' }}>S</span></button>
                                <button type="button" className={`doc-btn${editor?.isActive('subscript') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleSubscript().run()} title="Subscrito">X<sub style={{ fontSize: '8px' }}>2</sub></button>
                                <button type="button" className={`doc-btn${editor?.isActive('superscript') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleSuperscript().run()} title="Superscrito">X<sup style={{ fontSize: '8px' }}>2</sup></button>

                                <div className="doc-sep" />

                                {/* ── COR DO TEXTO — paleta visual ── */}
                                <div className="doc-color-picker-wrap" title="Cor do Texto">
                                    <button
                                        type="button"
                                        className="doc-btn doc-color-trigger"
                                        onClick={() => { setShowTextColorPalette(v => !v); setShowBgColorPalette(false); }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>A</span>
                                        <span className="doc-color-bar" style={{ background: currentTextColor }} />
                                        <span style={{ fontSize: 9, marginLeft: 1, color: '#94a3b8' }}>▼</span>
                                    </button>
                                    {showTextColorPalette && (
                                        <div className="doc-color-palette">
                                            <div className="doc-palette-label">Cor do Texto</div>
                                            <div className="doc-palette-grid">
                                                {['#000000', '#1a1a2e', '#16213e', '#0f3460', '#e94560',
                                                    '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
                                                    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
                                                    '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#be123c',
                                                    '#fca5a5', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe',
                                                    '#a78bfa', '#f9a8d4', '#6ee7b7', '#93c5fd', 'darkgoldenrod'
                                                ].map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className="doc-palette-swatch"
                                                        style={{ background: c, outline: currentTextColor === c ? '2px solid #2563eb' : undefined }}
                                                        title={c}
                                                        onClick={() => {
                                                            setCurrentTextColor(c);
                                                            editor?.chain().focus().setColor(c).run();
                                                            setShowTextColorPalette(false);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="doc-palette-custom">
                                                <span>Personalizada:</span>
                                                <input type="color" value={currentTextColor} ref={textColorRef}
                                                    onChange={e => {
                                                        setCurrentTextColor(e.target.value);
                                                        editor?.chain().focus().setColor(e.target.value).run();
                                                    }}
                                                    className="doc-custom-color-input"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── COR DE DESTAQUE — paleta visual ── */}
                                <div className="doc-color-picker-wrap" title="Realce">
                                    <button
                                        type="button"
                                        className="doc-btn doc-color-trigger"
                                        onClick={() => { setShowBgColorPalette(v => !v); setShowTextColorPalette(false); }}
                                    >
                                        <span style={{ fontSize: 13 }}>🖊</span>
                                        <span className="doc-color-bar" style={{ background: currentBgColor }} />
                                        <span style={{ fontSize: 9, marginLeft: 1, color: '#94a3b8' }}>▼</span>
                                    </button>
                                    {showBgColorPalette && (
                                        <div className="doc-color-palette">
                                            <div className="doc-palette-label">Cor de Realce</div>
                                            <div className="doc-palette-grid">
                                                {['#fef08a', '#fde68a', '#fed7aa', '#fca5a5', '#fbcfe8',
                                                    '#e9d5ff', '#bfdbfe', '#bae6fd', '#bbf7d0', '#d1fae5',
                                                    '#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
                                                    '#ffff00', '#00ff7f', '#00bfff', '#ff69b4', '#ff6347'
                                                ].map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className="doc-palette-swatch"
                                                        style={{ background: c, outline: currentBgColor === c ? '2px solid #2563eb' : undefined }}
                                                        title={c}
                                                        onClick={() => {
                                                            setCurrentBgColor(c);
                                                            editor?.chain().focus().toggleHighlight({ color: c }).run();
                                                            setShowBgColorPalette(false);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="doc-palette-custom">
                                                <span>Personalizada:</span>
                                                <input type="color" value={currentBgColor} ref={bgColorRef}
                                                    onChange={e => {
                                                        setCurrentBgColor(e.target.value);
                                                        editor?.chain().focus().toggleHighlight({ color: e.target.value }).run();
                                                    }}
                                                    className="doc-custom-color-input"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="doc-sep" />

                                <button type="button" className={`doc-btn${editor?.isActive('heading', { level: 1 }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">H1</button>
                                <button type="button" className={`doc-btn${editor?.isActive('heading', { level: 2 }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">H2</button>
                                <button type="button" className={`doc-btn${editor?.isActive('heading', { level: 3 }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">H3</button>

                                <div className="doc-sep" />

                                {/* Alinhamento */}
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'left' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Alinhar à esquerda (Ctrl+L)" style={{ fontSize: 15 }}>≡←</button>
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'center' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Centralizar (Ctrl+E)" style={{ fontSize: 15 }}>≡</button>
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'right' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Alinhar à direita (Ctrl+R)" style={{ fontSize: 15 }}>→≡</button>
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'justify' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} title="Justificar (Ctrl+J)" style={{ fontSize: 15 }}>☰</button>

                                <div className="doc-sep" />

                                {/* Indentação */}
                                <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().decreaseIndent().run()} title="Diminuir recuo" style={{ fontSize: 14 }}>⇤</button>
                                <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().increaseIndent().run()} title="Aumentar recuo" style={{ fontSize: 14 }}>⇥</button>

                                <div className="doc-sep" />

                                {/* ── ESPAÇAMENTO DE PARÁGRAFO ── */}
                                <div className="doc-color-picker-wrap" title="Espaçamento entre linhas">
                                    <button
                                        type="button"
                                        className={`doc-btn doc-lineh-trigger${showLineHeightMenu ? ' active' : ''}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault(); 
                                            if (!editor) return;
                                            savedSelectionRef.current = editor.state.selection;
                                            prevLineHeightRef.current = editor.getAttributes('paragraph').lineHeight ?? null;
                                            window.isLineHeightConfirmed = false;
                                            setShowLineHeightMenu(v => !v);
                                            setShowTextColorPalette(false);
                                            setShowBgColorPalette(false);
                                        }}
                                        title="Espaçamento entre linhas do parágrafo"
                                    >
                                        <span style={{ fontSize: 14 }}>↕</span>
                                        <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, marginLeft: 2 }}>
                                            {editor?.getAttributes('paragraph').lineHeight || '—'}
                                        </span>
                                        <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 1 }}>▼</span>
                                    </button>
                                    {showLineHeightMenu && (
                                        <div className="doc-lineh-menu">
                                            <div className="doc-palette-label">↕ Espaçamento entre Linhas</div>
                                            {LINE_HEIGHTS.map(lh => {
                                                const isActive = editor?.isActive('paragraph', { lineHeight: lh.value }) || editor?.isActive('heading', { lineHeight: lh.value });
                                                return (
                                                    <button
                                                        key={lh.value}
                                                        type="button"
                                                        className="doc-lineh-option"
                                                        style={{
                                                            fontWeight: isActive ? 700 : 400,
                                                            color: isActive ? '#2563eb' : '#334155',
                                                            background: isActive ? '#eff6ff' : 'transparent',
                                                        }}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            if (!editor) return;
                                                            window.isLineHeightConfirmed = true;
                                                            const sel = savedSelectionRef.current;
                                                            if (!sel) return;
                                                            editor.view.dispatch(editor.state.tr.setSelection(sel));
                                                            editor.chain().focus().setLineHeight(lh.value).run();
                                                            setShowLineHeightMenu(false);
                                                        }}
                                                    >
                                                        <span className="doc-lineh-preview" style={{ '--lh': lh.value } as React.CSSProperties}>
                                                            <span /><span /><span />
                                                        </span>
                                                        <span style={{ flex: 1 }}>{lh.label}</span>
                                                        {isActive && <span style={{ color: '#2563eb', fontSize: 12 }}>✓</span>}
                                                    </button>
                                                );
                                            })}
                                            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6 }}>
                                                {(() => {
                                                    const hasMarginTop = editor?.getAttributes('paragraph').marginTop || editor?.getAttributes('heading').marginTop;
                                                    const hasMarginBottom = editor?.getAttributes('paragraph').marginBottom || editor?.getAttributes('heading').marginBottom;
                                                    const isSpaceAfterRemoved = hasMarginBottom === '0pt' || hasMarginBottom === '0px' || hasMarginBottom === '0';
                                                    
                                                    return (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="doc-lineh-option"
                                                                style={{ color: '#334155', fontSize: 12 }}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    if (!editor) return;
                                                                    window.isLineHeightConfirmed = true;
                                                                    const sel = savedSelectionRef.current;
                                                                    if (!sel) return;
                                                                    editor.view.dispatch(editor.state.tr.setSelection(sel));
                                                                    if (hasMarginTop) {
                                                                        editor.chain().focus().unsetMarginTop().run();
                                                                    } else {
                                                                        editor.chain().focus().setMarginTop('12pt').run();
                                                                    }
                                                                    setShowLineHeightMenu(false);
                                                                }}
                                                            >
                                                                <span style={{ marginRight: 6 }}>{hasMarginTop ? '↓' : '↑'}</span> 
                                                                {hasMarginTop ? 'Remover espaço antes do parágrafo' : 'Adicionar espaço antes do parágrafo'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="doc-lineh-option"
                                                                style={{ color: '#334155', fontSize: 12 }}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    if (!editor) return;
                                                                    window.isLineHeightConfirmed = true;
                                                                    const sel = savedSelectionRef.current;
                                                                    if (!sel) return;
                                                                    editor.view.dispatch(editor.state.tr.setSelection(sel));
                                                                    if (isSpaceAfterRemoved) {
                                                                        editor.chain().focus().unsetMarginBottom().run();
                                                                    } else {
                                                                        editor.chain().focus().setMarginBottom('0pt').run();
                                                                    }
                                                                    setShowLineHeightMenu(false);
                                                                }}
                                                            >
                                                                <span style={{ marginRight: 6 }}>{isSpaceAfterRemoved ? '↓' : '↑'}</span> 
                                                                {isSpaceAfterRemoved ? 'Adicionar espaço depois do parágrafo' : 'Remover espaço depois do parágrafo'}
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6 }}>
                                                <button
                                                    type="button"
                                                    className="doc-lineh-option"
                                                    style={{ color: '#64748b', fontSize: 12 }}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        if (!editor) return;
                                                        window.isLineHeightConfirmed = true;
                                                        const sel = savedSelectionRef.current;
                                                        if (!sel) return;
                                                        editor.view.dispatch(editor.state.tr.setSelection(sel));
                                                        editor.chain().focus().unsetLineHeight().unsetMarginTop().unsetMarginBottom().run();
                                                        setShowLineHeightMenu(false);
                                                    }}
                                                >
                                                    <span style={{ marginRight: 6 }}>↺</span> Restaurar padrão
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="doc-sep" />

                                {/* Listas */}
                                <button type="button" className={`doc-btn${editor?.isActive('bulletList') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista com marcadores">• ≡</button>
                                <button type="button" className={`doc-btn${editor?.isActive('orderedList') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Lista numerada">1. ≡</button>

                                <div className="doc-sep" />

                                {/* Citação */}
                                <button type="button" className={`doc-btn${editor?.isActive('blockquote') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Citação">❝</button>

                                {/* Link */}
                                <button type="button" className={`doc-btn${editor?.isActive('link') || showLinkInput ? ' active' : ''}`} onClick={() => setShowLinkInput(v => !v)} title="Link">🔗</button>
                                {editor?.isActive('link') && (
                                    <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().unsetLink().run()} title="Remover link">🚫</button>
                                )}

                                {/* Imagem no editor */}
                                <div style={{ position: 'relative' }} title="Inserir imagem">
                                    <label className="doc-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        🖼
                                        <input type="file" accept="image/*" onChange={handleEditorImageUpload}
                                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                                    </label>
                                </div>

                                <div className="doc-sep" />

                                {/* Tabela */}
                                <button type="button" className={`doc-btn${showTableInput ? ' active' : ''}`} onClick={() => setShowTableInput(v => !v)} title="Inserir Tabela">⊞ Tab</button>
                                {editor?.isActive('table') && (
                                    <>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().addColumnBefore().run()} title="Coluna antes">+C←</button>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().addColumnAfter().run()} title="Coluna depois">+C→</button>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().addRowBefore().run()} title="Linha antes">+L↑</button>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().addRowAfter().run()} title="Linha depois">+L↓</button>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().deleteColumn().run()} title="Del coluna">-C</button>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().deleteRow().run()} title="Del linha">-L</button>
                                        <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().deleteTable().run()} title="Del tabela" style={{ color: '#dc2626' }}>✕Tab</button>
                                    </>
                                )}

                                <div className="doc-sep" />

                                <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)">↩</button>
                                <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().redo().run()} title="Refazer (Ctrl+Y)">↪</button>
                                <button
                                    type="button"
                                    className="doc-btn"
                                    title="Limpar toda formatação (texto, parágrafo, recuo)"
                                    style={{ color: '#6b7280', fontSize: 12, gap: 3 }}
                                    onClick={() => {
                                        if (!editor) return;
                                        editor.chain().focus()
                                            .clearNodes()
                                            .unsetAllMarks()
                                            .unsetLineHeight()
                                            .run();
                                        // Limpa também indent via tr direto
                                        const { state, dispatch } = editor.view;
                                        const tr = state.tr;
                                        state.doc.descendants((node, pos) => {
                                            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                                                const attrs = { ...node.attrs };
                                                delete attrs.lineHeight;
                                                attrs.indent = 0;
                                                tr.setNodeMarkup(pos, undefined, attrs);
                                            }
                                        });
                                        dispatch(tr);
                                    }}
                                >
                                    ✗ <span style={{ fontSize: 10 }}>Limpar</span>
                                </button>

                                <div className="doc-sep" />

                                {/* Importar DOCX — na toolbar */}
                                <label className="doc-btn doc-btn-import" title="Importar .DOCX" style={{ cursor: 'pointer', gap: '4px' }}>
                                    📄 .DOCX
                                    <input
                                        ref={docxInputRef}
                                        type="file"
                                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleDocxImport}
                                        style={{ display: 'none' }}
                                        disabled={loading}
                                    />
                                </label>

                                {/* Salvar na toolbar */}
                                <button
                                    type="submit"
                                    className="doc-btn doc-btn-save"
                                    disabled={loading}
                                    title="Salvar conteúdo"
                                >
                                    {loading ? '⏳' : '💾'} Salvar
                                </button>
                            </div>

                            {/* Popups inline */}
                            {showLinkInput && (
                                <div className="doc-popup doc-popup-link">
                                    <span>🔗 URL:</span>
                                    <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                                        placeholder="https://..." className="doc-popup-input"
                                        onKeyDown={e => e.key === 'Enter' && handleInsertLink()} />
                                    <button type="button" onClick={handleInsertLink} className="doc-popup-ok">Inserir</button>
                                    <button type="button" onClick={() => setShowLinkInput(false)} className="doc-popup-cancel">✕</button>
                                </div>
                            )}
                            {showTableInput && (
                                <div className="doc-popup doc-popup-table">
                                    <span>⊞ Tabela:</span>
                                    <label>Linhas <input type="number" min={1} max={20} value={tableRows} onChange={e => setTableRows(+e.target.value)} className="doc-popup-num" /></label>
                                    <label>Colunas <input type="number" min={1} max={10} value={tableCols} onChange={e => setTableCols(+e.target.value)} className="doc-popup-num" /></label>
                                    <button type="button" onClick={handleInsertTable} className="doc-popup-ok">Inserir</button>
                                    <button type="button" onClick={() => setShowTableInput(false)} className="doc-popup-cancel">✕</button>
                                </div>
                            )}
                        </div>

                        {/* ── CANVAS DO DOCUMENTO (FOLHA A4) ── */}
                        <div className="doc-canvas" onClick={() => { setShowTextColorPalette(false); setShowBgColorPalette(false); setShowLineHeightMenu(false); }}>
                            <div className="doc-page">
                                <EditorContent editor={editor} className="doc-editor-body" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="form-actions">
                    <button type="submit" className="btn primary" disabled={loading} style={{ padding: '10px 28px', fontSize: '1rem' }}>
                        {loading ? 'Salvando...' : '💾 Salvar Conteúdo'}
                    </button>
                    <button type="button" className="btn" onClick={onCancel} disabled={loading} style={{ padding: '10px 24px', fontSize: '1rem' }}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
