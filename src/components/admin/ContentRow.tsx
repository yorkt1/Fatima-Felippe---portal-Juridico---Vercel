import { useRef } from 'react';
import type { DragEvent } from 'react';
import { Calendar, Clock, GripVertical, ImageIcon, Pencil, Star, Trash2, User } from 'lucide-react';
import type { Article } from '../../data/content';

interface ContentRowProps {
    item: Article;
    index: number;
    total: number;
    /** Reordenar só faz sentido com a lista completa (sem busca ativa). */
    reorderEnabled: boolean;
    isDragging: boolean;
    isOver: boolean;
    onDragStart: (e: DragEvent<HTMLLIElement>, index: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: DragEvent<HTMLLIElement>, index: number) => void;
    onDragLeave: () => void;
    onDrop: (e: DragEvent<HTMLLIElement>, index: number) => void;
    onPositionCommit: (index: number, position: number) => void;
    onToggleFeatured: (item: Article) => void;
    onEdit: (item: Article) => void;
    onDelete: (item: Article) => void;
}

export default function ContentRow({
    item, index, total, reorderEnabled, isDragging, isOver,
    onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
    onPositionCommit, onToggleFeatured, onEdit, onDelete,
}: ContentRowProps) {
    // A linha só arrasta quando o clique começou na "alça" — assim dá para
    // selecionar texto e clicar nos campos sem iniciar um arraste sem querer.
    const fromGrip = useRef(false);

    const classes = ['adm-row'];
    if (item.featured) classes.push('adm-row--featured');
    if (isDragging) classes.push('adm-row--dragging');
    if (isOver) classes.push('adm-row--over');

    return (
        <li
            className={classes.join(' ')}
            draggable={reorderEnabled}
            onPointerDown={e => { fromGrip.current = !!(e.target as HTMLElement).closest('.adm-grip'); }}
            onDragStart={e => {
                if (!fromGrip.current) { e.preventDefault(); return; }
                onDragStart(e, index);
            }}
            onDragEnd={onDragEnd}
            onDragOver={e => onDragOver(e, index)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, index)}
        >
            <div className="adm-row__order">
                <span
                    className={`adm-grip${reorderEnabled ? '' : ' adm-grip--off'}`}
                    title={reorderEnabled ? 'Arraste para reordenar' : 'Limpe a busca para reordenar'}
                >
                    <GripVertical size={18} aria-hidden="true" />
                </span>
                <input
                    key={`${item.id}-${index}`}
                    className="adm-pos"
                    type="number"
                    min={1}
                    max={total}
                    defaultValue={index + 1}
                    disabled={!reorderEnabled}
                    aria-label={`Posição de "${item.title}"`}
                    title="Digite a posição e aperte Enter"
                    onBlur={e => {
                        // Normaliza o que foi digitado (vazio/fora do intervalo) e só grava se mudou.
                        const typed = parseInt(e.target.value, 10);
                        const position = Number.isNaN(typed) ? index + 1 : Math.min(Math.max(typed, 1), total);
                        e.target.value = String(position);
                        if (position !== index + 1) onPositionCommit(index, position);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                />
            </div>

            {item.image ? (
                <img className="adm-thumb" src={item.image} alt="" loading="lazy" draggable={false}
                    style={{ objectPosition: item.image_position || '50% 50%' }} />
            ) : (
                <div className="adm-thumb adm-thumb--empty" aria-hidden="true"><ImageIcon size={22} /></div>
            )}

            <div className="adm-row__content">
                <h3 className="adm-row__title" title={item.title}>{item.title}</h3>
                {item.excerpt && <p className="adm-row__excerpt">{item.excerpt}</p>}
                <div className="adm-row__meta">
                    {item.categoryName && <span className="adm-chip">{item.categoryName}</span>}
                    {item.featured && (
                        <span className="adm-badge adm-badge--warn"><Star size={12} fill="currentColor" aria-hidden="true" /> Destaque</span>
                    )}
                    {item.date && <span className="adm-meta-item"><Calendar size={13} aria-hidden="true" /> {item.date.trim()}</span>}
                    {item.readTime && <span className="adm-meta-item"><Clock size={13} aria-hidden="true" /> {item.readTime.trim()}</span>}
                    {item.author && <span className="adm-meta-item"><User size={13} aria-hidden="true" /> {item.author}</span>}
                </div>
            </div>

            <div className="adm-row__actions">
                <button
                    type="button"
                    className="adm-iconbtn adm-iconbtn--star"
                    aria-pressed={!!item.featured}
                    title={item.featured ? 'Remover destaque' : 'Destacar na página inicial'}
                    aria-label={item.featured ? `Remover destaque de "${item.title}"` : `Destacar "${item.title}"`}
                    onClick={() => onToggleFeatured(item)}
                >
                    <Star size={18} fill={item.featured ? 'currentColor' : 'none'} />
                </button>
                <button type="button" className="adm-iconbtn" title="Editar" aria-label={`Editar "${item.title}"`} onClick={() => onEdit(item)}>
                    <Pencil size={18} />
                </button>
                <button type="button" className="adm-iconbtn adm-iconbtn--danger" title="Excluir" aria-label={`Excluir "${item.title}"`} onClick={() => onDelete(item)}>
                    <Trash2 size={18} />
                </button>
            </div>
        </li>
    );
}
