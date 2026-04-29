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
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'content-images' );

-- 4. Allow uploads (INSERT)
create policy "Allow Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'content-images' );

-- 5. Allow updates/deletes
create policy "Allow Updates"
  on storage.objects for update
  using ( bucket_id = 'content-images' );

create policy "Allow Deletes"
  on storage.objects for delete
  using ( bucket_id = 'content-images' );
