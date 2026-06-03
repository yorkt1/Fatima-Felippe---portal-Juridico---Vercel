-- Adiciona o campo de ponto focal da imagem (object-position dos cards).
-- Permite escolher no admin qual parte da foto aparece quando o card recorta.
-- Formato: "<x>% <y>%" — ex: "50% 30%". Padrão: centro ("50% 50%").
-- Execute uma vez no SQL Editor do Supabase.

alter table public.contents
  add column if not exists image_position text not null default '50% 50%';
