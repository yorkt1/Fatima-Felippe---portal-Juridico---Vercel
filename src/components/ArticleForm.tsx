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
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import { supabase } from '../services/supabase';
import type { Article } from '../data/content';
import { Upload } from 'lucide-react';
import * as mammoth from 'mammoth';

// Extensão customizada para suporte a font-size inline
const FontSize = Extension.create({
    name: 'fontSize',
    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize || null,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
});

// Extensão de Tab = recuo de parágrafo (como o Word)
const TabIndent = Extension.create({
    name: 'tabIndent',
    addKeyboardShortcuts() {
        return {
            // Tab insere um recuo visual fixo (salvo no banco, exibido ao usuário)
            Tab: () =>
                this.editor.commands.insertContent(
                    '<span style="display:inline-block;width:2em"> </span>'
                ),
        };
    },
});

// Função que limpa HTML do Word preservando estilos visuais importantes
function cleanWordHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Propriedades CSS que queremos PRESERVAR
    const KEEP_PROPS = new Set([
        'color', 'background-color', 'font-size', 'font-family',
        'font-weight', 'font-style', 'text-decoration', 'text-align',
        'border', 'border-top', 'border-bottom', 'border-left', 'border-right',
        'border-collapse', 'width', 'height', 'padding', 'padding-top',
        'padding-bottom', 'padding-left', 'padding-right', 'vertical-align',
        'line-height', 'margin', 'margin-top', 'margin-bottom',
        'text-indent', 'white-space',
    ]);

    // Para cada elemento com style, filtra apenas propriedades úteis
    doc.querySelectorAll('[style]').forEach(el => {
        const htmlEl = el as HTMLElement;
        const raw = htmlEl.getAttribute('style') || '';
        // Separa declarações
        const decls = raw.split(';').map(s => s.trim()).filter(Boolean);
        const kept: string[] = [];
        for (const decl of decls) {
            const colonIdx = decl.indexOf(':');
            if (colonIdx === -1) continue;
            const prop = decl.slice(0, colonIdx).trim().toLowerCase();
            const val = decl.slice(colonIdx + 1).trim().toLowerCase();
            // Ignora propriedades MSO/Office e valores vazios
            if (prop.startsWith('mso') || prop.startsWith('-aw') || !val) continue;
            // Remove text-align: left/start do Word (será aplicado justify via CSS)
            // Preserva center e right que o usuário escolheu explicitamente
            if (prop === 'text-align' && (val === 'left' || val === 'start' || val === 'justify')) continue;
            if (KEEP_PROPS.has(prop)) {
                kept.push(`${prop}: ${val}`);
            }
        }
        if (kept.length > 0) {
            htmlEl.setAttribute('style', kept.join('; '));
        } else {
            htmlEl.removeAttribute('style');
        }
    });

    // Remove classes MSO
    doc.querySelectorAll('[class]').forEach(el => {
        const cls = el.getAttribute('class') || '';
        if (/Mso/i.test(cls)) el.removeAttribute('class');
    });

    // Remove comentários condicionais do Word (não acessíveis via DOM, então regex no body)
    let result = doc.body.innerHTML;
    result = result.replace(/<!--\[if[\s\S]*?\[endif\]-->/gi, '');
    result = result.replace(/<!--[^>]*-->/g, '');

    // IMPORTANTE: Converte espaços fixos do Word (&nbsp;) para espaços normais. 
    // Isso é o que mais impede o text-align: justify de encostar perfeitamente nas extremidades!
    result = result.replace(/&nbsp;/g, ' ');

    return result;
}

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

export default function ArticleForm({ type, initialData, onCancel, onSuccess }: ArticleFormProps) {
    const [loading, setLoading] = useState(false);
    const [audioUploading, setAudioUploading] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [showTableInput, setShowTableInput] = useState(false);
    const [showTextColorPalette, setShowTextColorPalette] = useState(false);
    const [showBgColorPalette, setShowBgColorPalette] = useState(false);
    const [currentTextColor, setCurrentTextColor] = useState('#111111');
    const [currentBgColor, setCurrentBgColor] = useState('#ffff00');
    const textColorRef = useRef<HTMLInputElement>(null);
    const bgColorRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<Article>>(initialData || {
        title: '',
        category: '',
        categoryName: '',
        excerpt: '',
        image: '',
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
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
            }),
            Image.configure({ inline: false, allowBase64: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TabIndent,
        ],
        content: (formData.content || '').replace(/&nbsp;/g, ' ').replace(/ /g, ' '),
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
            alert('Erro ao enviar imagem. Verifique as permissões.');
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
            const result = await mammoth.convertToHtml(
                { arrayBuffer: arrayBuffer },
                {
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p[style-name='Quote'] => blockquote:fresh",
                        "r[style-name='Strong'] => strong",
                        "table => table:fresh",
                        "tr => tr:fresh",
                        "td => td:fresh"
                    ],
                    convertImage: mammoth.images.imgElement(function (image) {
                        return image.read("base64").then(function (imageBuffer) {
                            return {
                                src: "data:" + image.contentType + ";base64," + imageBuffer
                            };
                        });
                    })
                }
            );

            if (editor) {
                // Insere no editor preservando HTML Rico, sem &nbsp; do Word
                const cleanedContent = result.value.replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
                editor.commands.setContent(cleanedContent);
            }
            alert("Documento Word importado com sucesso!");
        } catch (error) {
            console.error('Error importing docx:', error);
            alert("Erro ao importar o documento Word. Certifique-se de que é um formato .docx válido.");
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
            alert('Erro ao enviar áudio. Verifique as permissões do storage.');
        } finally {
            setAudioUploading(false);
        }
    };

    // Remover áudio
    const handleRemoveAudio = () => {
        setFormData(prev => ({ ...prev, audio_url: '' }));
        if (audioInputRef.current) audioInputRef.current.value = '';
    };

    // Upload de imagem DENTRO do editor
    const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            editor?.chain().focus().setImage({ src: reader.result as string }).run();
        };
        reader.readAsDataURL(file);
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
            let error;
            if (isEditing && initialData?.id) {
                const { error: updateError } = await supabase
                    .from('contents').update({ ...formData, type }).eq('id', initialData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('contents').insert([{ ...formData, type }]);
                error = insertError;
            }
            if (error) throw error;
            alert(`Conteúdo ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
            onSuccess();
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Erro ao salvar conteúdo. Verifique as configurações do Supabase.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.25rem', color: '#111827' }}>
                {isEditing ? 'Editar Conteúdo' : 'Novo Conteúdo'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
                        <div className="image-preview-wrapper">
                            <span className="image-preview-label">Pré-visualização</span>
                            <img src={formData.image} alt="Preview"
                                style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
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
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Cole do Word ou importe um .docx — formatação preservada</span>
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
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'left' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Esquerda">⬡←</button>
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'center' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Centro">⬡</button>
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'right' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Direita">→⬡</button>
                                <button type="button" className={`doc-btn${editor?.isActive({ textAlign: 'justify' }) ? ' active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} title="Justificar">☰</button>

                                <div className="doc-sep" />

                                {/* Listas */}
                                <button type="button" className={`doc-btn${editor?.isActive('bulletList') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista">• ≡</button>
                                <button type="button" className={`doc-btn${editor?.isActive('orderedList') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Lista Numerada">1.≡</button>

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
                                <button type="button" className="doc-btn" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpar formatação" style={{ color: '#6b7280' }}>✗</button>

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
                        <div className="doc-canvas" onClick={() => { setShowTextColorPalette(false); setShowBgColorPalette(false); }}>
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

            {/* ══════ ESTILOS DO EDITOR DOCUMENTO ══════ */}
            <style>{`

                /* ── Wrapper geral ── */
                .doc-editor-wrapper { margin: 0 !important; }

                /* ── Container principal ── */
                .doc-editor-container {
                    border: 1.5px solid #cbd5e1;
                    border-radius: 12px;
                    overflow: visible;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                    position: relative;
                }

                /* ── Toolbar FIXA na tela ── */
                .doc-toolbar {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: #f8fafc;
                    border-bottom: 1.5px solid #e2e8f0;
                    border-radius: 12px 12px 0 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
                }
                .doc-toolbar-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 1px;
                    padding: 6px 10px;
                }

                /* Botões da toolbar */
                .doc-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 28px;
                    height: 28px;
                    padding: 0 6px;
                    border: none;
                    border-radius: 5px;
                    background: transparent;
                    color: #334155;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.12s, color 0.12s;
                    white-space: nowrap;
                }
                .doc-btn:hover { background: #e2e8f0; }
                .doc-btn.active {
                    background: #dbeafe;
                    color: #1d4ed8;
                    font-weight: 700;
                }

                /* Botão Importar DOCX na toolbar */
                .doc-btn-import {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #bfdbfe;
                    font-weight: 500;
                    padding: 0 9px;
                    gap: 4px;
                }
                .doc-btn-import:hover { background: #dbeafe; }

                /* Botão Salvar na toolbar */
                .doc-btn-save {
                    background: #16a34a;
                    color: white;
                    border: none;
                    font-weight: 600;
                    padding: 0 12px;
                    gap: 4px;
                    border-radius: 6px;
                }
                .doc-btn-save:hover { background: #15803d; }
                .doc-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Separadores */
                .doc-sep {
                    width: 1px;
                    height: 20px;
                    background: #cbd5e1;
                    margin: 0 5px;
                    align-self: center;
                    flex-shrink: 0;
                }

                /* Selects de fonte */
                .doc-select {
                    height: 28px;
                    padding: 0 4px;
                    border: 1px solid #e2e8f0;
                    border-radius: 5px;
                    font-size: 12.5px;
                    color: #334155;
                    background: white;
                    cursor: pointer;
                }
                .doc-select-font { width: 130px; }
                .doc-select-size { width: 54px; }

                /* ── Seletor de cor com paleta ── */
                .doc-color-picker-wrap {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                .doc-color-trigger {
                    flex-direction: column;
                    height: 32px;
                    gap: 1px;
                    padding: 0 5px;
                }
                .doc-color-bar {
                    display: block;
                    width: 18px;
                    height: 4px;
                    border-radius: 2px;
                }
                .doc-color-palette {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    padding: 10px;
                    z-index: 200;
                    min-width: 180px;
                }
                .doc-palette-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                }
                .doc-palette-grid {
                    display: grid;
                    grid-template-columns: repeat(10, 20px);
                    gap: 3px;
                    margin-bottom: 8px;
                }
                .doc-palette-swatch {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    border: 1px solid rgba(0,0,0,0.12);
                    cursor: pointer;
                    padding: 0;
                    transition: transform 0.1s;
                }
                .doc-palette-swatch:hover { transform: scale(1.25); border-color: #2563eb; }
                .doc-palette-custom {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: #475569;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 8px;
                }
                .doc-custom-color-input {
                    width: 32px;
                    height: 24px;
                    padding: 0;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    cursor: pointer;
                }

                /* Popups */
                .doc-popup {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 12px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 13px;
                    color: #334155;
                    flex-wrap: wrap;
                }
                .doc-popup-link { background: #eff6ff; }
                .doc-popup-table { background: #f0fdf4; }
                .doc-popup-input {
                    flex: 1;
                    min-width: 180px;
                    padding: 4px 8px;
                    border: 1px solid #93c5fd;
                    border-radius: 5px;
                    font-size: 13px;
                }
                .doc-popup-num {
                    width: 52px;
                    padding: 3px 6px;
                    border: 1px solid #86efac;
                    border-radius: 5px;
                    font-size: 13px;
                    margin-left: 4px;
                }
                .doc-popup-ok {
                    padding: 4px 14px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }
                .doc-popup-cancel {
                    padding: 4px 8px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #64748b;
                    font-size: 14px;
                }

                /* ── Canvas / Folha A4 ── */
                .doc-canvas {
                    background: #e8eaed;
                    padding: 32px 24px 48px;
                    min-height: 600px;
                    display: flex;
                    justify-content: center;
                    overflow-x: auto;
                }

                /* Folha A4 */
                .doc-page {
                    background: #fff;
                    width: 794px;       /* A4 em 96dpi */
                    min-height: 1123px; /* altura A4 */
                    padding: 80px 90px 80px 90px; /* margens de documento */
                    box-shadow:
                        0 1px 3px rgba(0,0,0,0.12),
                        0 4px 24px rgba(0,0,0,0.12);
                    border-radius: 2px;
                    flex-shrink: 0;
                    position: relative;
                }

                /* Área de escrita dentro da folha */
                .doc-editor-body {
                    outline: none;
                    min-height: 100%;
                }
                .doc-editor-body .ProseMirror {
                    outline: none;
                    min-height: 900px;
                    font-family: 'Calibri', 'Georgia', 'Times New Roman', serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #1a1a1a;
                    word-break: break-word;
                    hyphens: auto;
                }

                /* Parágrafos */
                .doc-editor-body .ProseMirror p {
                    margin: 0 0 0.6em 0;
                    line-height: 1.6;
                }

                /* Títulos estilo documento */
                .doc-editor-body .ProseMirror h1 {
                    font-size: 20pt;
                    font-weight: 700;
                    margin: 1.2em 0 0.5em;
                    color: #1e293b;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 6px;
                }
                .doc-editor-body .ProseMirror h2 {
                    font-size: 16pt;
                    font-weight: 700;
                    margin: 1em 0 0.4em;
                    color: #1e3a5f;
                }
                .doc-editor-body .ProseMirror h3 {
                    font-size: 13pt;
                    font-weight: 700;
                    margin: 0.8em 0 0.4em;
                    color: #1e3a5f;
                }
                .doc-editor-body .ProseMirror h4,
                .doc-editor-body .ProseMirror h5,
                .doc-editor-body .ProseMirror h6 {
                    font-size: 12pt;
                    font-weight: 600;
                    margin: 0.7em 0 0.3em;
                    color: #334155;
                }

                /* Listas */
                .doc-editor-body .ProseMirror ul,
                .doc-editor-body .ProseMirror ol {
                    padding-left: 28px;
                    margin: 0.4em 0 0.8em;
                }
                .doc-editor-body .ProseMirror li { margin-bottom: 3px; }

                /* Citação */
                .doc-editor-body .ProseMirror blockquote {
                    border-left: 3px solid #94a3b8;
                    margin: 14px 0;
                    padding: 8px 18px;
                    background: #f8fafc;
                    color: #475569;
                    font-style: italic;
                }

                /* Código */
                .doc-editor-body .ProseMirror pre {
                    background: #1e293b;
                    color: #e2e8f0;
                    border-radius: 6px;
                    padding: 14px 18px;
                    font-size: 11pt;
                    overflow-x: auto;
                    margin: 12px 0;
                }
                .doc-editor-body .ProseMirror code {
                    background: #f1f5f9;
                    border-radius: 3px;
                    padding: 1px 5px;
                    font-size: 10.5pt;
                }
                .doc-editor-body .ProseMirror pre code {
                    background: transparent;
                    padding: 0;
                }

                /* Links */
                .doc-editor-body .ProseMirror a {
                    color: #1d4ed8;
                    text-decoration: underline;
                }

                /* Imagens — suport total dentro da folha */
                .doc-editor-body .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 12px auto;
                    border-radius: 4px;
                    box-shadow: 0 1px 6px rgba(0,0,0,0.12);
                    cursor: pointer;
                }
                .doc-editor-body .ProseMirror img.ProseMirror-selectednode {
                    outline: 3px solid #2563eb;
                    border-radius: 4px;
                }

                /* Tabelas estilo documento */
                .doc-editor-body .ProseMirror table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 14px 0;
                    table-layout: auto;
                }
                .doc-editor-body .ProseMirror td,
                .doc-editor-body .ProseMirror th {
                    border: 1px solid #cbd5e1;
                    padding: 7px 12px;
                    min-width: 50px;
                    vertical-align: top;
                    position: relative;
                    font-size: 11pt;
                }
                .doc-editor-body .ProseMirror th {
                    background: #f1f5f9;
                    font-weight: 700;
                    color: #1e293b;
                }
                .doc-editor-body .ProseMirror .selectedCell:after {
                    background: rgba(37,99,235,0.12);
                    content: '';
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .doc-editor-body .ProseMirror .column-resize-handle {
                    background: #2563eb;
                    bottom: -2px;
                    pointer-events: none;
                    position: absolute;
                    right: -2px;
                    top: 0;
                    width: 3px;
                }

                /* Placeholder */
                .doc-editor-body .ProseMirror p.is-editor-empty:first-child::before {
                    content: 'Comece a digitar ou cole aqui o conteúdo do Word...';
                    color: #94a3b8;
                    pointer-events: none;
                    float: left;
                    height: 0;
                    font-style: italic;
                }

                /* Regua no topo da página (decorativa) */
                .doc-page::before {
                    content: '';
                    display: block;
                    height: 3px;
                    background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    border-radius: 2px 2px 0 0;
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
}
