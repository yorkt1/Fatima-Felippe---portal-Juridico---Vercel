-- ============================================================================
--  ALINHAR OS DADOS DO SUPABASE COM O SITE ORIGINAL (fatimafelippe.com.br)
--  Gerado em 2026-09-19 comparando, item a item, a tabela public.contents
--  com os artigos que estão dentro do HTML do site original.
--
--  POR QUE: o novo site lê tudo do Supabase e o original tem os textos dentro do
--  próprio HTML. A fórmula dos contadores do hero é IDÊNTICA nos dois; o que difere
--  são os DADOS (tempo de leitura, tags, tipo de um item, autor, categoria). Sem isso
--  os números saem +105 tópicos / +472 min em vez de +107 / +467.
--
--  COMO USAR (SQL Editor do Supabase):
--    1) rode o BACKUP;
--    2) rode o BLOCO 1 (o que você pediu) e o BLOCO 2 (contadores);
--    3) BLOCO 3 é OPCIONAL (autor/data/nome da categoria dos demais cards): está
--       comentado — tire o "-- " das linhas se quiser aplicar.
--    Para desfazer: a tabela contents_backup_20260919 guarda o estado anterior.
--  Depois de rodar, atualize o site: os contadores devem mostrar +30 / +107 / +467.
--
--  Não altera título, conteúdo (corpo), imagem nem a ordem (position) de nenhum item.
-- ============================================================================

-- BACKUP
create table if not exists public.contents_backup_20260919 as
  select * from public.contents;

-- ── BLOCO 1 — o que você pediu ────────────────────────────────────────────
-- destaque (PEC 03/2026 – IPVA): categoria "Direito Tributário" → "Direito Civil"
update public.contents set "categoryName" = 'Direito Civil' where id = 44;

-- card "Antecipação do abono anual": autor "Fátima T. Felippe" → "Redação"
update public.contents set author = 'Redação' where id = 40;

-- ── BLOCO 2 — contadores do hero (tipo, tempo de leitura e tags) ──────────
-- Proposta de Emenda à Constituição (PEC) 03/2026 - altera o a…
update public.contents set tags = ARRAY['CF/88', 'PEC03/2026', 'IPVA', 'Base de cálculo', 'alteração', 'peso do veículo.']::text[] where id = 44;

-- Proposta de Emenda à Constituição – PEC 19/2024 –  Profissio…
update public.contents set tags = ARRAY['PEC 19/2024', 'Jornada de trabalho', 'Piso salarial', 'Carga horária', 'lei nº 14.434/2022']::text[] where id = 43;

-- Antecipação do abono anual (13° salário do INSS).
update public.contents set tags = ARRAY['INSS', 'Antecipação', '13° salário do INSS', ' Decreto nº 12.884, de 19 de março de 2026']::text[] where id = 40;

-- Isenção do Imposto de Renda - Lei n° 15.270/2025  - Novo tet…
update public.contents set "readTime" = '10 min de leitura', tags = ARRAY['Finanças Públicas ', ' Isenção de Imposto de Renda', 'Novo teto']::text[] where id = 39;

-- Taxa de Licenciamento Anual - (CRLV-E)
update public.contents set tags = ARRAY['Taxa', 'TRU', 'Licenciamento ', 'Anual ', 'Veículos ', 'Digital CRVL-E ', 'IPVA']::text[] where id = 41;

-- Curatela - Instrumento de proteção e cuidado no ordenamento …
update public.contents set "readTime" = '10 min de leitura', tags = ARRAY['Introdução', 'Importância', 'Constituição Federal/88', 'Lei nº 10.406/2002', 'Lei nº 13.105/2015', 'Lei nº 13.146/2015', 'Outros']::text[] where id = 5;

-- Tutela: Proteção integral de menores no ordenamento jurídico…
update public.contents set "readTime" = '30 min de leitura', tags = ARRAY['Introdução', 'Importância', 'Constituição Federal/88', 'Lei nº 10.406/2002', 'Lei nº 13.105/2015', 'Lei nº 13.146/2015', 'Outros']::text[] where id = 6;

-- Orçamento Público I
update public.contents set tags = ARRAY['Importância', 'Constituição Federal/88', 'Emendas', 'Lei Complementar nº 101/2000', 'Princípios ', 'Instrumentos', 'Outros']::text[] where id = 17;

-- Orçamento Público II
update public.contents set tags = ARRAY['Princípios', 'Instrumentos', ' Arts. 165', '166-A da CF/88', 'Continuação']::text[] where id = 18;

-- Ação Declaratória de Constitucionalidade
update public.contents set "readTime" = '25 min de leitura' where id = 19;

-- Obrigação Tributária
update public.contents set "readTime" = '25 min de leitura', tags = ARRAY['Obrigação Tributária', 'Fato Gerador', 'Sujeito Ativo', 'Sujeito Passivo', 'CTN', 'Lei 5.172/66', 'Tributário', 'Contribuinte', 'Responsável']::text[] where id = 20;

-- Dos Atos Processuais
update public.contents set tags = ARRAY['Atos Processuais', 'Processo Civil', 'NCPC', 'Classificação Processual', 'Forma dos Atos', 'Requisitos Processuais', 'Procedimento', 'Dinamarco', 'Marinoni']::text[] where id = 21;

-- Gratuidade de Justiça I
update public.contents set tags = ARRAY['Gratuidade da Justiça I - Art. 98', 'Gratuidade da Justiça II - Art. 99 ao 102 - Próximo Post', 'Constituição Federal/88', 'Lei 1.060/50', 'Lei nº 13.105/2015', 'Requisitos', 'Citação']::text[] where id = 23;

-- O Estado Brasileiro
update public.contents set tags = ARRAY['Introdução', 'A Organização do Estado ', 'A Organização Político - Administrativa', 'A importância do Estado e sua organização', 'Artigos 18 e 19 da CF/88']::text[] where id = 25;

-- Ordem Social - Seguridade Social
update public.contents set tags = ARRAY['Conceito', 'Importância', 'Constituição Federal/88', 'Artigos 193 a 195']::text[] where id = 26;

-- Ordem Social - Assistência Social
update public.contents set tags = ARRAY['Conceito', 'Importância', 'Constituição Federal/88', 'Artigos 203 e 204', 'SUAS']::text[] where id = 27;

-- Ordem Econômica e Financeira
update public.contents set tags = ARRAY['Termo', 'Importância', 'Constituição Federal/88', 'Emendas', 'Artigos 170 a 181 da Constituição Federal de 1988']::text[] where id = 28;

-- Auxílio-Reclusão
update public.contents set tags = ARRAY['O que é o auxílio-reclusão', 'Fato gerador', 'Dependentes', 'Valores', 'Quantidade de contribuições necessárias', 'Tipo de regime de cumprimento pena', 'Início e término do auxílio-reclusão', 'Leis', 'entre outros']::text[] where id = 31;

-- Dia do Advogado: A Importância e História da Advocacia no Br…
update public.contents set "readTime" = '15 min de leitura', tags = ARRAY['Artigo 133 da Constituição Federal', 'Advogado indispensável à justiça', 'Estatuto da Advocacia (Lei 8.906/1994)', 'Código de Ética e Disciplina da OAB', 'Estado Democrático de Direito', 'Dia do Advogado']::text[] where id = 32;

-- Dom Pedro I
update public.contents set "readTime" = '35 min de leitura', tags = ARRAY['Lei 11 de agosto 1827', 'Criação Cursos Jurídicos Brasil', 'Faculdade Direito São Paulo', 'Faculdade Direito Olinda']::text[] where id = 33;

-- O poder da vontade
update public.contents set type = 'reflexoes', tags = ARRAY['Poder', 'Vontade', 'Direção', 'Opção', 'Decisão']::text[] where id = 45;

-- Mudanças
update public.contents set tags = ARRAY['Comunicação', 'Perspectiva', 'Sucesso', 'Oportunidade', 'Pensamentos', 'Habilidade', 'Coragem']::text[] where id = 38;

-- Inteligência
update public.contents set "readTime" = '5 min de leitura', tags = ARRAY['Objetivo', 'Estratégia', 'Habilidade', 'Compreensão', 'Recomeçar']::text[] where id = 11;

-- Organização
update public.contents set "readTime" = '7 min de leitura', tags = ARRAY['Sociedade', 'Competência', 'Produtividade', 'Eficácia', 'Poder']::text[] where id = 12;

-- Pensamentos
update public.contents set "readTime" = '6 min de leitura', tags = ARRAY['Sentimentos', 'Vibração', 'Autorresponsabilidade', 'lapidar', 'Alegria']::text[] where id = 13;

-- Reciprocidade
update public.contents set "readTime" = '6 min de leitura', tags = ARRAY['Recíproco', 'Relação', 'Espiritual', 'Relacionamento', 'Harmonia']::text[] where id = 4;

-- Tolerância
update public.contents set "readTime" = '6 min de leitura' where id = 35;

-- Retorno dos serviços após atualização do INSS
update public.contents set "readTime" = '5 min de leitura', tags = ARRAY['Meu INSS', 'Central 135', 'Aplicativo', 'Atualização', 'Pataforma', 'Processamento', 'Agilidade']::text[] where id = 37;

-- Aprovado o fim da escala de trabalho 6x1 pela CCJ do Senado …
update public.contents set "readTime" = '8 min de leitura', tags = ARRAY['Fim da escala 6x1', 'PEC 148/2015', 'Redução da jornada de trabalho', 'Jornada 36 horas', 'CCJ Senado Federal', 'Paulo Paim', 'Direito do Trabalho', 'Qualidade de vida', 'Saúde mental no trabalho', 'Afastamento por doença']::text[] where id = 36;

-- Isenção do IPVA
update public.contents set "readTime" = '1 min de leitura', tags = ARRAY['IPVA', 'Isenção Fiscal', 'Veículos Antigos', 'Legislação Tributária', 'Congresso Nacional', 'Emenda Constitucional']::text[] where id = 16;

-- ── BLOCO 3 — OPCIONAL: autor, data e nome da categoria dos demais cards ──
-- -- Taxa de Licenciamento Anual - (CRLV-E)
-- update public.contents set author = 'Redação' where id = 41;

-- -- Orçamento Público I
-- update public.contents set author = 'Redação' where id = 17;

-- -- Orçamento Público II
-- update public.contents set author = 'Redação' where id = 18;

-- -- Ação Declaratória de Constitucionalidade
-- update public.contents set author = 'Redação' where id = 19;

-- -- Obrigação Tributária
-- update public.contents set author = 'Redação' where id = 20;

-- -- Dos Atos Processuais
-- update public.contents set author = 'Redação' where id = 21;

-- -- TCC - Especialização Processo Civil
-- update public.contents set author = 'Redação' where id = 22;

-- -- Gratuidade de Justiça I
-- update public.contents set author = 'Redação' where id = 23;

-- -- Gratuidade de Justiça II
-- update public.contents set author = 'Redação' where id = 24;

-- -- O Estado Brasileiro
-- update public.contents set author = 'Redação' where id = 25;

-- -- Ordem Social - Seguridade Social
-- update public.contents set author = 'Redação' where id = 26;

-- -- Ordem Social - Assistência Social
-- update public.contents set author = 'Redação', date = '30 de julho de 2025' where id = 27;

-- -- Ordem Econômica e Financeira
-- update public.contents set author = 'Redação' where id = 28;

-- -- Competência Tributária
-- update public.contents set author = 'Redação', "categoryName" = 'Direito TRIBUTÁRIO' where id = 29;

-- -- Ordem Social - Saúde
-- update public.contents set author = 'Redação' where id = 30;

-- -- Auxílio-Reclusão
-- update public.contents set author = 'Redação' where id = 31;

-- -- Dia do Advogado: A Importância e História da Advocacia no Br…
-- update public.contents set author = 'Redação' where id = 32;

-- -- Dom Pedro I
-- update public.contents set author = 'Redação' where id = 33;

-- -- O poder da vontade
-- update public.contents set author = 'Redação' where id = 45;

-- -- Mudanças
-- update public.contents set author = 'Redação', "categoryName" = 'reflexoes' where id = 38;

-- -- Organização
-- update public.contents set date = '02 de fevereiro de 2025' where id = 12;

-- -- Tolerância
-- update public.contents set author = 'Redação', date = '01 de dezembro de 2025' where id = 35;

-- -- Retorno dos serviços após atualização do INSS
-- update public.contents set author = 'Redação' where id = 37;

-- -- Aprovado o fim da escala de trabalho 6x1 pela CCJ do Senado …
-- update public.contents set author = 'Redação', date = '10 de dezembro de 2025' where id = 36;
