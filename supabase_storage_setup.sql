-- 1. Create the storage bucket 'content-images'
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts (Fix for ERROR: 42710)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow Uploads" on storage.objects;
drop policy if exists "Allow Updates" on storage.objects;
drop policy if exists "Allow Deletes" on storage.objects;

-- 3. Allow public access to view images (SELECT)
create policy "Public read content-images"
  on storage.objects for select
  using ( bucket_id = 'content-images' );

-- 4. Uploads apenas para usuários autenticados (admin logado)
create policy "Authenticated upload content-images"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'content-images' );

-- 5. Alterar/remover apenas para usuários autenticados
create policy "Authenticated update content-images"
  on storage.objects for update to authenticated
  using ( bucket_id = 'content-images' );

create policy "Authenticated delete content-images"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'content-images' );
