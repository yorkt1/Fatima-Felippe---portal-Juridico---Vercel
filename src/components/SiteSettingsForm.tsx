import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft, ChevronDown, House, LayoutTemplate, List, LoaderCircle, Mail, PanelBottom,
    RotateCcw, Save, Upload, User, TriangleAlert,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { fetchSiteSettingsRaw, loadSiteSettings } from '../services/siteSettings';
import { SITE_SETTING_FIELDS } from '../data/siteSettings';
import type { SettingField } from '../data/siteSettings';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import { ActionBar } from './admin/FormParts';

interface SiteSettingsFormProps {
    onClose: () => void;
}

type Values = Record<string, string>;

const GROUP_ICONS: Record<string, LucideIcon> = {
    'Cabeçalho': LayoutTemplate,
    'Página inicial': House,
    'Sobre': User,
    'Contato': Mail,
    'Rodapé': PanelBottom,
    'Menus laterais': List,
};

const valuesFrom = (overrides: Values): Values =>
    Object.fromEntries(SITE_SETTING_FIELDS.map(f => [f.key, overrides[f.key] ?? f.default]));

export default function SiteSettingsForm({ onClose }: SiteSettingsFormProps) {
    const { showToast, ToastComponent } = useToast();
    const [saved, setSaved] = useState<Values>({});
    const [values, setValues] = useState<Values>(() => valuesFrom({}));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            const { data, error } = await fetchSiteSettingsRaw();
            if (!alive) return;
            if (error) setLoadError(error.message);
            const overrides: Values = {};
            for (const row of data ?? []) {
                if (row.value?.trim()) overrides[row.key] = row.value;
            }
            setSaved(overrides);
            setValues(valuesFrom(overrides));
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, []);

    const isChanged = (f: SettingField) => (values[f.key] ?? f.default) !== (saved[f.key] ?? f.default);
    const dirtyCount = SITE_SETTING_FIELDS.filter(isChanged).length;

    const setValue = (key: string, value: string) => setValues(prev => ({ ...prev, [key]: value }));

    const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingKey(key);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `site-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('content-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('content-images').getPublicUrl(fileName);
            setValue(key, data.publicUrl);
            showToast('Foto enviada — clique em "Salvar alterações" para publicar.', 'info');
        } catch (error) {
            console.error('Error uploading site image:', error);
            showToast('Erro ao enviar a foto. Verifique as permissões do storage.', 'error');
        } finally {
            setUploadingKey(null);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const upserts: { key: string; value: string; updated_at: string }[] = [];
            const deletes: string[] = [];
            for (const f of SITE_SETTING_FIELDS) {
                if (!isChanged(f)) continue;
                const current = values[f.key] ?? f.default;
                // Vazio ou igual ao padrão = volta a usar o texto padrão do código.
                if (current.trim() === '' || current === f.default) deletes.push(f.key);
                else upserts.push({ key: f.key, value: current, updated_at: new Date().toISOString() });
            }
            if (upserts.length === 0 && deletes.length === 0) {
                showToast('Nenhuma alteração para salvar.', 'info');
                return;
            }
            if (upserts.length > 0) {
                const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
                if (error) throw error;
            }
            if (deletes.length > 0) {
                const { error } = await supabase.from('site_settings').delete().in('key', deletes);
                if (error) throw error;
            }
            const fresh = await loadSiteSettings(true);
            setSaved(fresh);
            setValues(valuesFrom(fresh));
            setLoadError(null);
            showToast('Textos do site atualizados!', 'success');
        } catch (error) {
            console.error('Error saving site settings:', error);
            showToast('Erro ao salvar. Confira se o arquivo supabase_site_settings.sql já foi executado no Supabase.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Ctrl/Cmd + S salva (sempre com a versão mais recente da função).
    const saveRef = useRef(handleSave);
    useEffect(() => {
        saveRef.current = handleSave;
    });
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveRef.current();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Fechar a aba com alterações pendentes pede confirmação ao navegador.
    useEffect(() => {
        if (dirtyCount === 0) return;
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirtyCount]);

    const requestClose = () => (dirtyCount > 0 ? setConfirmDiscard(true) : onClose());

    const renderField = (f: SettingField) => {
        const id = `site-${f.key}`;
        const value = values[f.key] ?? f.default;

        return (
            <div key={f.key} className="adm-field">
                {/* Botão e aviso ficam FORA do <label> para o leitor de tela anunciar só o nome do campo. */}
                <div className="adm-fieldhead">
                    <label className="adm-label" htmlFor={id}>{f.label}</label>
                    {isChanged(f) && <span className="adm-changed">alterado</span>}
                    {value !== f.default && (
                        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost"
                            onClick={() => setValue(f.key, f.default)} title="Voltar ao texto original do site">
                            <RotateCcw size={14} aria-hidden="true" /> Restaurar padrão
                        </button>
                    )}
                </div>

                {f.kind === 'text' && (
                    <input id={id} type="text" className="adm-input" value={value}
                        onChange={e => setValue(f.key, e.target.value)} />
                )}
                {(f.kind === 'textarea' || f.kind === 'lines' || f.kind === 'pairs') && (
                    <textarea id={id} className="adm-textarea"
                        rows={f.kind === 'textarea' ? 4 : Math.max(4, value.split('\n').length + 1)}
                        value={value} onChange={e => setValue(f.key, e.target.value)} />
                )}
                {f.kind === 'image' && (
                    <div className="adm-imgfield">
                        {value && <img className="adm-imgfield__preview" src={value} alt="" />}
                        <div className="adm-imgfield__controls">
                            <input id={id} type="text" className="adm-input" value={value} placeholder="https://…"
                                onChange={e => setValue(f.key, e.target.value)} />
                            <span className="adm-btn adm-btn--sm adm-uploadbtn">
                                <Upload size={15} aria-hidden="true" />
                                {uploadingKey === f.key ? 'Enviando…' : 'Enviar nova foto'}
                                <input type="file" accept="image/*" aria-label={`Enviar nova foto: ${f.label}`}
                                    disabled={uploadingKey !== null} onChange={e => handleImageUpload(f.key, e)} />
                            </span>
                        </div>
                    </div>
                )}
                {f.help && <p className="adm-hint">{f.help}</p>}
            </div>
        );
    };

    const groups = SITE_SETTING_FIELDS.reduce<Record<string, SettingField[]>>((acc, f) => {
        (acc[f.group] ??= []).push(f);
        return acc;
    }, {});

    return (
        <>
            {ToastComponent}
            <ConfirmModal
                isOpen={confirmDiscard}
                title="Descartar alterações?"
                message="Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas."
                confirmLabel="Descartar"
                cancelLabel="Continuar editando"
                onConfirm={onClose}
                onCancel={() => setConfirmDiscard(false)}
            />

            <div className="adm-form">
                <div className="adm-page">
                    <button type="button" className="adm-backlink" onClick={requestClose}>
                        <ArrowLeft size={16} aria-hidden="true" /> Voltar para o painel
                    </button>
                    <div className="adm-pagehead">
                        <div>
                            <h1>Textos e fotos do site</h1>
                            <p>
                                Edite os textos, fotos, contato e rodapé que aparecem no site. Depois de mexer, clique em
                                {' '}<strong>Salvar alterações</strong>. Campo em branco ou “Restaurar padrão” volta ao texto original.
                            </p>
                        </div>
                    </div>

                    {loadError && (
                        <div className="adm-alert adm-alert--warn" role="status" style={{ marginBottom: 16 }}>
                            <TriangleAlert size={18} aria-hidden="true" />
                            <div>
                                Não foi possível carregar os textos salvos ({loadError}). Se você ainda não executou o arquivo
                                {' '}<strong>supabase_site_settings.sql</strong> no Supabase, execute-o primeiro. Enquanto isso o painel
                                mostra os textos padrão.
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="adm-card" style={{ padding: 20 }} aria-busy="true">
                            <div className="adm-skel" style={{ height: 18, width: '30%', marginBottom: 14 }} />
                            <div className="adm-skel" style={{ height: 40, marginBottom: 10 }} />
                            <div className="adm-skel" style={{ height: 40 }} />
                        </div>
                    ) : (
                        <div className="adm-stack" style={{ gap: 12 }}>
                            {Object.entries(groups).map(([group, fields], index) => {
                                const Icon = GROUP_ICONS[group] ?? LayoutTemplate;
                                const changed = fields.filter(isChanged).length;
                                return (
                                    <details key={group} className="adm-acc" open={index === 0}>
                                        <summary>
                                            <div className="adm-card__icon" aria-hidden="true"><Icon size={18} /></div>
                                            <span className="adm-acc__title">{group}</span>
                                            <span className="adm-acc__meta">
                                                {changed > 0 && <span className="adm-badge adm-badge--warn">{changed} alterado{changed > 1 ? 's' : ''}</span>}
                                                <span>{fields.length} campo{fields.length > 1 ? 's' : ''}</span>
                                                <ChevronDown size={18} className="adm-acc__chev" aria-hidden="true" />
                                            </span>
                                        </summary>
                                        <div className="adm-acc__body">{fields.map(renderField)}</div>
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>

                <ActionBar
                    status={
                        dirtyCount > 0
                            ? <span className="adm-badge adm-badge--warn">{dirtyCount} alteraç{dirtyCount > 1 ? 'ões' : 'ão'} não salva{dirtyCount > 1 ? 's' : ''}</span>
                            : <span className="adm-actionbar__hint">Nenhuma alteração pendente.</span>
                    }
                >
                    <button type="button" className="adm-btn" onClick={requestClose} disabled={saving}>
                        Voltar
                    </button>
                    <button type="button" className="adm-btn adm-btn--primary" onClick={handleSave} disabled={saving || loading}>
                        {saving
                            ? <><LoaderCircle size={17} className="adm-spin" aria-hidden="true" /> Salvando…</>
                            : <><Save size={17} aria-hidden="true" /> {`Salvar alterações${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}</>}
                    </button>
                </ActionBar>
            </div>
        </>
    );
}
