import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { supabase } from '../services/supabase';
import { fetchSiteSettingsRaw, loadSiteSettings } from '../services/siteSettings';
import { SITE_SETTING_FIELDS } from '../data/siteSettings';
import type { SettingField } from '../data/siteSettings';
import { useToast } from './Toast';

interface SiteSettingsFormProps {
    onClose: () => void;
}

type Values = Record<string, string>;

const valuesFrom = (overrides: Values): Values =>
    Object.fromEntries(SITE_SETTING_FIELDS.map(f => [f.key, overrides[f.key] ?? f.default]));

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151' } as const;

export default function SiteSettingsForm({ onClose }: SiteSettingsFormProps) {
    const { showToast, ToastComponent } = useToast();
    const [saved, setSaved] = useState<Values>({});
    const [values, setValues] = useState<Values>(() => valuesFrom({}));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

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

    const renderField = (f: SettingField) => {
        const id = `site-${f.key}`;
        const value = values[f.key] ?? f.default;
        const restore = value !== f.default && (
            <button type="button" className="btn" style={{ padding: '2px 10px', fontSize: '12px' }}
                onClick={() => setValue(f.key, f.default)} title="Voltar ao texto original do site">
                ↺ Restaurar padrão
            </button>
        );

        return (
            <div key={f.key} className="form-row" style={{ marginBottom: '16px' }}>
                {/* Botão e aviso ficam FORA do <label> para o leitor de tela anunciar só o nome do campo. */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                    <label htmlFor={id} style={{ ...labelStyle, marginBottom: 0 }}>{f.label}</label>
                    {isChanged(f) && <span style={{ color: '#b45309', fontSize: '12px' }}>● alterado</span>}
                    {restore}
                </div>
                {f.kind === 'text' && (
                    <input id={id} type="text" className="admin-login-input" value={value}
                        onChange={e => setValue(f.key, e.target.value)} />
                )}
                {(f.kind === 'textarea' || f.kind === 'lines' || f.kind === 'pairs') && (
                    <textarea id={id} className="admin-login-input"
                        rows={f.kind === 'textarea' ? 4 : Math.max(4, value.split('\n').length + 1)}
                        value={value} onChange={e => setValue(f.key, e.target.value)} />
                )}
                {f.kind === 'image' && (
                    <div>
                        {value && (
                            <img src={value} alt="" style={{ maxHeight: '110px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '8px', display: 'block' }} />
                        )}
                        <input id={id} type="text" className="admin-login-input" value={value} placeholder="https://..."
                            onChange={e => setValue(f.key, e.target.value)} />
                        <label className="btn" style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <Upload size={16} />
                            {uploadingKey === f.key ? 'Enviando...' : 'Enviar nova foto'}
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                                disabled={uploadingKey !== null} onChange={e => handleImageUpload(f.key, e)} />
                        </label>
                    </div>
                )}
                {f.help && <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{f.help}</p>}
            </div>
        );
    };

    const groups = SITE_SETTING_FIELDS.reduce<Record<string, SettingField[]>>((acc, f) => {
        (acc[f.group] ??= []).push(f);
        return acc;
    }, {});

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {ToastComponent}
            <h2 style={{ marginBottom: '8px', fontSize: '1.25rem', color: '#111827' }}>⚙️ Textos e fotos do site</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>
                Edite os textos, fotos, contato e rodapé que aparecem no site. Depois de mexer, clique em
                <strong> Salvar alterações</strong>. Campo em branco ou <em>↺ Restaurar padrão</em> volta ao texto original.
            </p>

            {loadError && (
                <div style={{ padding: '12px 14px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    Não foi possível carregar os textos salvos ({loadError}). Se você ainda não executou o arquivo
                    <strong> supabase_site_settings.sql</strong> no Supabase, execute-o primeiro. Enquanto isso o painel
                    mostra os textos padrão.
                </div>
            )}

            {loading ? (
                <p>Carregando…</p>
            ) : (
                Object.entries(groups).map(([group, fields], index) => (
                    <details key={group} open={index === 0}
                        style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '4px 16px 8px', marginBottom: '12px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '16px', padding: '10px 0' }}>{group}</summary>
                        <div style={{ paddingTop: '8px' }}>{fields.map(renderField)}</div>
                    </details>
                ))
            )}

            <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn primary" onClick={handleSave} disabled={saving || loading}
                    style={{ padding: '10px 28px', fontSize: '1rem' }}>
                    {saving ? 'Salvando...' : `💾 Salvar alterações${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
                </button>
                <button type="button" className="btn" onClick={onClose} disabled={saving}
                    style={{ padding: '10px 24px', fontSize: '1rem' }}>
                    Voltar
                </button>
            </div>
        </div>
    );
}
