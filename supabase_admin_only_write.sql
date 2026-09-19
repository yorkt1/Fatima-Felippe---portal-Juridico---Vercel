-- ============================================================================
--  SEGURANÇA (endurecimento): restringe escrita a UM admin específico
--  Execute no SQL Editor do Supabase quando quiser aplicar. Não precisa
--  rodar supabase_auth_rls.sql de novo antes — este script já substitui
--  as políticas "Authenticated ..." por versões com o e-mail do admin.
--
--  Antes: QUALQUER usuário autenticado no Supabase Auth podia escrever
--  em `contents` e no Storage — não só o admin. Bastava alguém criar uma
--  conta (se o cadastro público estivesse ligado) pra ganhar acesso de
--  escrita.
--  Depois: só o e-mail definido em ADMIN_EMAIL (o mesmo hardcoded em
--  src/pages/AdminLoginPage.tsx) pode inserir/editar/apagar.
--
--  Se um dia existir mais de um admin, troque o "=" por "in (...)" com a
--  lista de e-mails, ou crie uma tabela de admins e troque a comparação
--  por um "exists (select 1 from public.admins where email = ...)".
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
--  1. Tabela public.contents
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Authenticated insert" on public.contents;
drop policy if exists "Authenticated update" on public.contents;
drop policy if exists "Authenticated delete" on public.contents;

create policy "Admin insert"
  on public.contents for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br');

create policy "Admin update"
  on public.contents for update to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br')
  with check ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br');

create policy "Admin delete"
  on public.contents for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br');

-- ─────────────────────────────────────────────────────────────
--  2. Storage (bucket content-images: imagens e áudios)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Authenticated upload content-images" on storage.objects;
drop policy if exists "Authenticated update content-images" on storage.objects;
drop policy if exists "Authenticated delete content-images" on storage.objects;

create policy "Admin upload content-images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'content-images'
    and (auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br'
  );

create policy "Admin update content-images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'content-images'
    and (auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br'
  );

create policy "Admin delete content-images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'content-images'
    and (auth.jwt() ->> 'email') = 'admin@fatimafelippe.com.br'
  );

-- ============================================================================
--  Lembrete: isso não substitui MFA nem rate limit no login — trava só
--  QUEM pode escrever depois de autenticado. Pra travar tentativas de senha
--  errada, veja Authentication > Rate Limits no painel do Supabase.
-- ============================================================================
