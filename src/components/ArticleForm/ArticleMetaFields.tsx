import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import { Crosshair, FileText, Headphones, ImageIcon, Music, Tag, Trash2, TriangleAlert, Upload } from 'lucide-react';
import type { Article } from '../../data/content';
import { Field, Section } from '../admin/FormParts';

interface ArticleMetaFieldsProps {
    formData: Partial<Article>;
    setFormData: Dispatch<SetStateAction<Partial<Article>>>;
    /** Tipo da aba de onde o formulário foi aberto (padrão do campo "Tipo"). */
    type: string;
    initialData?: Article | null;
    imageUploading: boolean;
    audioUploading: boolean;
    audioInputRef: RefObject<HTMLInputElement | null>;
    onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onAudioUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveAudio: () => void;
}

const TYPE_PATH: Record<string, string> = { artigos: 'artigo', reflexoes: 'reflexao', noticias: 'noticia' };
const EXCERPT_RECOMMENDED = 220;

// Campos de metadados do conteúdo (tudo menos o editor de texto).
export default function ArticleMetaFields({
    formData, setFormData, type, initialData, imageUploading, audioUploading, audioInputRef,
    onImageUpload, onAudioUpload, onRemoveAudio,
}: ArticleMetaFieldsProps) {
    const set = (patch: Partial<Article>) => setFormData(prev => ({ ...prev, ...patch }));
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        set({ [name]: value } as Partial<Article>);
    };

    const isEditing = !!initialData;
    const typeChanged = isEditing && !!formData.type && formData.type !== initialData?.type;
    const position = formData.image_position || '50% 50%';
    const [focalX, focalY] = position.split(' ');
    const excerptLength = (formData.excerpt ?? '').length;
    const tags = (formData.tags ?? []).map(t => t.trim()).filter(Boolean);

    return (
        <>
            <Section icon={<FileText size={18} />} title="Informações" description="Onde o conteúdo aparece e como ele é apresentado.">
                <div className="adm-stack">
                    <Field label="Tipo de conteúdo" htmlFor="f-type" required className="adm-field--narrow">
                        <select id="f-type" name="type" className="adm-select" value={formData.type || type}
                            onChange={handleChange} required>
                            <option value="artigos">Artigos</option>
                            <option value="reflexoes">Reflexões</option>
                            <option value="noticias">Notícias</option>
                        </select>
                        {typeChanged && (
                            <div className="adm-alert adm-alert--warn" role="status">
                                <TriangleAlert size={16} aria-hidden="true" />
                                <span>
                                    Ao mudar o tipo, o link antigo ({TYPE_PATH[initialData?.type ?? ''] ?? 'artigo'}/{initialData?.id}) para de
                                    funcionar — o item passa a existir só no novo endereço.
                                </span>
                            </div>
                        )}
                    </Field>

                    <Field label="Título" htmlFor="f-title" required>
                        <input id="f-title" name="title" type="text" className="adm-input adm-input--title"
                            value={formData.title ?? ''} onChange={handleChange} required
                            placeholder="Digite o título…" />
                    </Field>

                    <Field label="Resumo" htmlFor="f-excerpt" required
                        hint={
                            <span className="adm-hintrow">
                                <span>Texto curto exibido nos cards da página inicial e nos resultados de busca.</span>
                                <span className={`adm-counter${excerptLength > EXCERPT_RECOMMENDED ? ' adm-counter--over' : ''}`}>
                                    {excerptLength}/{EXCERPT_RECOMMENDED} caracteres
                                </span>
                            </span>
                        }>
                        <textarea id="f-excerpt" name="excerpt" className="adm-textarea" rows={3}
                            value={formData.excerpt ?? ''} onChange={handleChange} required
                            placeholder="Breve descrição do conteúdo…" />
                    </Field>
                </div>
            </Section>

            <Section icon={<Tag size={18} />} title="Detalhes da publicação" description="Informações mostradas no card e na página do conteúdo.">
                <div className="adm-stack">
                    <div className="adm-grid-2">
                        <Field label="Categoria" htmlFor="f-categoryName" required
                            hint={'Etiqueta exibida no card, ex.: "Direito Civil".'}>
                            <input id="f-categoryName" name="categoryName" type="text" className="adm-input"
                                value={formData.categoryName ?? ''} onChange={handleChange} required
                                placeholder="ex.: Direito Civil" />
                        </Field>
                        <Field label="Autor" htmlFor="f-author" required>
                            <input id="f-author" name="author" type="text" className="adm-input"
                                value={formData.author ?? ''} onChange={handleChange} required
                                placeholder="ex.: Fátima T. Felippe, Redação…" />
                        </Field>
                        <Field label="Data" htmlFor="f-date" required hint={'Texto livre, ex.: "11 de janeiro de 2026".'}>
                            <input id="f-date" name="date" type="text" className="adm-input"
                                value={formData.date ?? ''} onChange={handleChange} required
                                placeholder="ex.: 11 de janeiro de 2026" />
                        </Field>
                        <Field label="Tempo de leitura" htmlFor="f-readTime" required hint={'Começa com o número de minutos, ex.: "5 min de leitura".'}>
                            <input id="f-readTime" name="readTime" type="text" className="adm-input"
                                value={formData.readTime ?? ''} onChange={handleChange} required
                                placeholder="ex.: 5 min de leitura" />
                        </Field>
                    </div>

                    <Field label="Tags" htmlFor="f-tags" hint="Separe por vírgula. Contam nos “Tópicos abordados” da página inicial.">
                        <input id="f-tags" name="tagsInput" type="text" className="adm-input"
                            value={formData.tags?.join(', ') ?? ''}
                            onChange={e => set({ tags: e.target.value.split(',').map(t => t.trim()) })}
                            placeholder="Ex.: Constituição Federal, Direito Civil, Emendas" />
                        {tags.length > 0 && (
                            <div className="adm-tagchips" aria-label="Tags atuais">
                                {tags.map((t, i) => <span key={`${t}-${i}`} className="adm-tagchip">{t}</span>)}
                            </div>
                        )}
                    </Field>
                </div>
            </Section>

            <Section icon={<ImageIcon size={18} />} title="Imagem de capa" description="Aparece no card e no topo do conteúdo.">
                <div className="adm-cover">
                    <div>
                        {formData.image ? (
                            <>
                                <div
                                    className="adm-focal"
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Escolher o ponto focal da imagem: clique no que deve aparecer no recorte dos cards"
                                    onClick={e => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
                                        const x = clamp(((e.clientX - rect.left) / rect.width) * 100);
                                        const y = clamp(((e.clientY - rect.top) / rect.height) * 100);
                                        set({ image_position: `${x}% ${y}%` });
                                    }}
                                >
                                    <img src={formData.image} alt="Pré-visualização da capa" />
                                    <span className="adm-focal__dot" style={{ left: focalX, top: focalY }} />
                                </div>
                                <p className="adm-hint" style={{ marginTop: 8 }}>
                                    <Crosshair size={13} style={{ verticalAlign: '-2px' }} aria-hidden="true" /> Clique na imagem para
                                    escolher o ponto focal (o que fica visível quando o card recorta a foto).
                                </p>
                            </>
                        ) : (
                            <div className="adm-dropzone">
                                <div className="adm-dropzone__icon"><Upload size={20} /></div>
                                <strong>{imageUploading ? 'Enviando imagem…' : 'Clique para enviar uma imagem'}</strong>
                                <span>ou arraste o arquivo até aqui</span>
                                <input type="file" accept="image/*" onChange={onImageUpload} disabled={imageUploading} aria-label="Enviar imagem de capa" />
                            </div>
                        )}
                    </div>

                    <div className="adm-cover__side">
                        <Field label="Endereço da imagem (URL)" htmlFor="f-image">
                            <input id="f-image" name="image" type="text" className="adm-input"
                                value={formData.image ?? ''} onChange={handleChange} placeholder="https://…" />
                        </Field>

                        {formData.image && (
                            <>
                                <div className="adm-inline">
                                    <span className="adm-btn adm-btn--sm adm-uploadbtn">
                                        <Upload size={15} aria-hidden="true" /> {imageUploading ? 'Enviando…' : 'Trocar imagem'}
                                        <input type="file" accept="image/*" onChange={onImageUpload} disabled={imageUploading} aria-label="Trocar imagem de capa" />
                                    </span>
                                    <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost"
                                        onClick={() => set({ image_position: '50% 50%' })}>
                                        Centralizar foco
                                    </button>
                                    <span className="adm-hint">Foco: <strong>{position}</strong></span>
                                </div>
                                <div>
                                    <span className="adm-hint">Como ficará no card:</span>
                                    <div className="adm-cardpreview" style={{ marginTop: 6 }}>
                                        <img src={formData.image} alt="Prévia do card" style={{ objectPosition: position }} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Section>

            <Section icon={<Headphones size={18} />} title="Áudio (opcional)" description="Um arquivo .mp3, .wav ou .ogg exibido junto ao conteúdo para o leitor ouvir.">
                {!formData.audio_url ? (
                    <div className="adm-dropzone">
                        <div className="adm-dropzone__icon"><Music size={20} /></div>
                        <strong>{audioUploading ? 'Enviando áudio…' : 'Clique para enviar um áudio'}</strong>
                        <span>Formatos: MP3, WAV, OGG</span>
                        <input ref={audioInputRef} type="file"
                            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3,.mp3,.wav,.ogg"
                            onChange={onAudioUpload} disabled={audioUploading} aria-label="Enviar áudio" />
                    </div>
                ) : (
                    <div className="adm-audio">
                        <div className="adm-inline" style={{ justifyContent: 'space-between' }}>
                            <strong style={{ color: '#15803d' }}>Áudio carregado</strong>
                            <button type="button" className="adm-btn adm-btn--sm" onClick={onRemoveAudio}>
                                <Trash2 size={15} aria-hidden="true" /> Remover
                            </button>
                        </div>
                        <audio controls>
                            <source src={formData.audio_url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </div>
                )}
            </Section>
        </>
    );
}
