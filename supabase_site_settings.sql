-- ============================================================================
--  TEXTOS E FOTOS DO SITE EDITÁVEIS PELO PAINEL ("Textos do Site")
--  Execute no SQL Editor do Supabase UMA vez.
--
--  Cria a tabela `site_settings` (chave → valor). Cada linha é um texto/foto
--  que o admin alterou no painel. Sem linha = o site usa o texto padrão que
--  está no código (src/data/siteSettings.ts), então o site continua igual
--  até alguém editar alguma coisa. Rodar este script NÃO muda nada no site.
--
--  Leitura: pública (o site precisa ler para mostrar os textos).
--  Escrita: só o e-mail do admin (o mesmo de src/pages/AdminLoginPage.tsx).
-- ============================================================================

create table if not exists public.site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Public read site_settings"  on public.site_settings;
drop policy if exists "Admin insert site_settings" on public.site_settings;
drop policy if exists "Admin update site_settings" on public.site_settings;
drop policy if exists "Admin delete site_settings" on public.site_settings;

create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

create policy "Admin insert site_settings"
  on public.site_settings for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br');

create policy "Admin update site_settings"
  on public.site_settings for update to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br')
  with check ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br');

create policy "Admin delete site_settings"
  on public.site_settings for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br');
