-- Adicionar coluna audio_url à tabela contents
-- Executar este SQL no Supabase SQL Editor
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS audio_url text;
