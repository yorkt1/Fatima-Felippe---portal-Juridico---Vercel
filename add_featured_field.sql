-- Adicionar campo "featured" (artigo em destaque)
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Criar índice para garantir apenas 1 artigo em destaque por tipo
-- (Comentado porque pode dar erro se já existir, execute manualmente se necessário)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_one_featured_per_type 
-- ON public.contents (type) 
-- WHERE featured = true;
