-- ============================================================================
--  SEGURANÇA: trava de escrita na tabela `contents` e no Storage
--  Execute este script no SQL Editor do Supabase UMA vez.
--
--  Antes: qualquer visitante (chave anônima, que é pública) podia
--  inserir, editar e apagar conteúdo.
--  Depois: leitura continua pública; escrita só para usuários autenticados.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
--  1. Tabela public.contents
-- ─────────────────────────────────────────────────────────────
alter table public.contents enable row level security;

-- Remove as políticas antigas e permissivas
drop policy if exists "Enable read access for all users" on public.contents;
drop policy if exists "Enable insert for all users"      on public.contents;
drop policy if exists "Enable update for all users"      on public.contents;
drop policy if exists "Enable delete for all users"      on public.contents;

-- Leitura: liberada para todos (site público)
create policy "Public read access"
  on public.contents for select
  using (true);

-- Escrita: somente usuários autenticados (admin logado via Supabase Auth)
create policy "Authenticated insert"
  on public.contents for insert to authenticated
  with check (true);

create policy "Authenticated update"
  on public.contents for update to authenticated
  using (true) with check (true);

create policy "Authenticated delete"
  on public.contents for delete to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────
--  2. Storage (bucket content-images: imagens e áudios)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Public Access"  on storage.objects;
drop policy if exists "Allow Uploads"  on storage.objects;
drop policy if exists "Allow Updates"  on storage.objects;
drop policy if exists "Allow Deletes"  on storage.objects;

-- Visualizar arquivos: liberado (imagens aparecem no site público)
create policy "Public read content-images"
  on storage.objects for select
  using ( bucket_id = 'content-images' );

-- Upload / alterar / remover: somente autenticados
create policy "Authenticated upload content-images"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'content-images' );

create policy "Authenticated update content-images"
  on storage.objects for update to authenticated
  using ( bucket_id = 'content-images' );

create policy "Authenticated delete content-images"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'content-images' );

-- ============================================================================
--  3. Criar o usuário administrador
--  NÃO dá para criar usuário por SQL com senha aqui de forma confiável.
--  Faça pelo painel do Supabase:
--    Authentication > Users > Add user  (marque "Auto Confirm User")
--  Use esse e-mail/senha para entrar em /admin-login.
--
--  IMPORTANTE: desative a auto-inscrição pública para ninguém criar conta:
--    Authentication > Providers > Email  ->  desligar "Allow new users to sign up"
-- ============================================================================
