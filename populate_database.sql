-- POPULAR BANCO DE DADOS COM TODO O CONTEÚDO
-- Execute este SQL no Supabase SQL Editor para adicionar todo o conteúdo

-- Limpar dados existentes (CUIDADO: isso apaga tudo!)
-- DELETE FROM public.contents;

-- ARTIGOS
INSERT INTO public.contents (type, title, category, "categoryName", excerpt, image, author, content, date, "readTime", tags, featured)
VALUES 
-- Curatela
('artigos', 'Curatela: Instrumento de Proteção e Cuidado no Ordenamento Jurídico Brasileiro', 'civil', 'Direito Civil', 
'Análise do instrumento da curatela como forma de proteção da pessoa com incapacidade.', 
'https://res.cloudinary.com/dqewxdbfx/image/upload/v1762624801/maos-dadas-umas-as-outras-para-apoio_page-0001_n0v2bn.jpg', 
'Redação', 
'<h2>Breve Introdução</h2><p>A Curatela no ordenamento jurídico brasileiro está prevista no <strong>Código Civil, Lei nº 10.406 de 10 de janeiro de 2002</strong>, mais precisamente nos artigos n.ºs <strong>1.767 a 1.783</strong>, o qual define quais pessoas são abrangidas por ela, e que possuam incapacidade parcial ou total, além de estabelecer as regras para a nomeação de curadores, se for o caso.</p>', 
'01 de Fevereiro de 2025', '10 min de leitura', 
ARRAY['Curatela', 'Direito Civil', 'Proteção', 'Incapacidade'], 
true),

-- Tutela
('artigos', 'Tutela: Proteção Integral de Menores no Ordenamento Jurídico Brasileiro', 'civil', 'Direito Civil', 
'Análise do instrumento da tutela como forma de proteção do menor.', 
'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 
'Redação', 
'<h2>Breve Introdução</h2><p>A Tutela de menores no ordenamento jurídico brasileiro está prevista no Código Civil, Lei nº 10.406 de 10 de janeiro de 2002, mais precisamente nos artigos n.ºs 1.728 a 1.766, o qual define quais pessoas são abrangidas por ela, as condições para o encargo, além de estabelecer as regras para a nomeação de tutores, se for o caso.</p>', 
'01 de março de 2025', '30 min de leitura', 
ARRAY['Tutela', 'Direito Civil', 'Menores', 'Proteção'], 
false),

-- Princípios Fundamentais
('artigos', 'Princípios Fundamentais da Constituição Federal', 'constitucional', 'Direito Constitucional', 
'Análise dos princípios fundamentais que regem o ordenamento jurídico brasileiro.', 
'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', 
'Redação', 
'<h2>Princípios Fundamentais</h2><p>A Constituição Federal de 1988 estabelece os princípios fundamentais que regem o Estado Democrático de Direito brasileiro. Entre eles, destacam-se a dignidade da pessoa humana, a cidadania, os valores sociais do trabalho e da livre iniciativa.</p>', 
'15 de março de 2025', '15 min de leitura', 
ARRAY['Constituição', 'Princípios', 'Direitos Fundamentais'], 
false),

-- Direito Tributário
('artigos', 'Princípios do Direito Tributário Brasileiro', 'tributario', 'Direito Tributário', 
'Análise dos principais princípios que regem a tributação no Brasil.', 
'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 
'Redação', 
'<h2>Princípios Tributários</h2><p>O Direito Tributário brasileiro é regido por diversos princípios constitucionais que visam proteger o contribuinte e garantir a justiça fiscal. Entre os principais estão: legalidade, anterioridade, irretroatividade e capacidade contributiva.</p>', 
'20 de março de 2025', '12 min de leitura', 
ARRAY['Tributário', 'Princípios', 'Impostos'], 
false),

-- Direito do Trabalho
('artigos', 'Reforma Trabalhista: Principais Mudanças', 'trabalhista', 'Direito do Trabalho', 
'Análise das principais alterações trazidas pela reforma trabalhista de 2017.', 
'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800', 
'Redação', 
'<h2>Reforma Trabalhista</h2><p>A Lei 13.467/2017 trouxe significativas mudanças para as relações de trabalho no Brasil. Entre as principais alterações estão: prevalência do negociado sobre o legislado, novas regras para jornada de trabalho e férias, e mudanças no processo trabalhista.</p>', 
'25 de março de 2025', '18 min de leitura', 
ARRAY['Trabalho', 'Reforma', 'CLT'], 
false),

-- Direito Penal
('artigos', 'Legítima Defesa no Código Penal Brasileiro', 'penal', 'Direito Penal', 
'Estudo sobre o instituto da legítima defesa e suas aplicações práticas.', 
'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800', 
'Redação', 
'<h2>Legítima Defesa</h2><p>A legítima defesa está prevista no artigo 25 do Código Penal como excludente de ilicitude. Para sua configuração, são necessários requisitos como: agressão injusta, atual ou iminente, uso de meios necessários e moderação no emprego desses meios.</p>', 
'30 de março de 2025', '14 min de leitura', 
ARRAY['Penal', 'Legítima Defesa', 'Excludente'], 
false);

-- REFLEXÕES
INSERT INTO public.contents (type, title, category, "categoryName", excerpt, image, author, content, date, "readTime", tags, featured)
VALUES 
-- Inteligência
('reflexoes', 'INTELIGÊNCIA', 'reflexoes', 'Reflexão', 
'Reflexão sobre a inteligência como capacidade de aprender com os erros e recomeçar com mais sabedoria', 
'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800', 
'Redação', 
'<p><strong>INTELIGÊNCIA</strong></p><p><strong>"O insucesso é apenas uma oportunidade para recomeçar com mais inteligência".</strong></p><p><strong style="color: DARKGOLDENROD">Henry Ford</strong></p><p>Em outras palavras, é respeitável para si mesmo quando deparamos com o insucesso na obtenção de algo que desejávamos muito em nossa jornada de vida, ou de um objetivo que não foi satisfeito naquele momento, digo porque não sabemos do dia seguinte, pois que no momento devemos parar, respirar e analisar analiticamente os possíveis erros que foram cometidos na busca do objetivo e o que fazer para identificar os possíveis acertos, assim se recomeça a jornada.</p>', 
'05 de setembro de 2025', '5 min de leitura', 
ARRAY['Objetivo', 'Estratégia', 'Habilidade', 'Compreensão', 'Recomeçar'], 
false),

-- Organização
('reflexoes', 'ORGANIZAÇÃO', 'reflexoes', 'Reflexão', 
'Análise sobre como vivemos em uma sociedade organizacional e a importância da competência nos sistemas', 
'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800', 
'Redação', 
'<p><strong>ORGANIZAÇÃO</strong></p><p><strong>Breve comentário.</strong></p><p>Você se considera que vive dentro de uma sociedade eminentemente organizacional?</p><p>Pois bem, podemos dizer que vivemos em um sistema controlado por uma sociedade organizacional onde o homem em todas as etapas de sua vida, desde a concepção até a morte, depende desse sistema organizacional. A competência e eficácia são primordiais para o sucesso desses sistemas organizacionais.</p>', 
'05 de outubro de 2025', '7 min de leitura', 
ARRAY['Sociedade', 'Competência', 'Produtividade', 'Eficácia', 'Poder'], 
false),

-- Pensamentos
('reflexoes', 'PENSAMENTOS', 'reflexoes', 'Reflexão', 
'Reflexão sobre a relação entre pensamentos e sentimentos e a importância da auto-responsabilidade.', 
'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800', 
'Redação', 
'<p><strong>PENSAMENTOS</strong></p><p><strong>O que vem antes, o pensamento ou o sentimento?</strong></p><p><strong>Quando você pensa, sente e quando você sente, pensa! Porque tudo isso, parece confuso?</strong></p><p>Os pensamentos são formas de lidar com os sentimentos e vice-versa, porque ao pensar dependendo dos pensamentos vão surgir sentimentos que serão necessários lapidá-los a fim de direcioná-los para a melhor consecução dos objetivos.</p>', 
'05 de novembro de 2025', '6 min de leitura', 
ARRAY['Sentimentos', 'Vibração', 'Autorresponsabilidade', 'lapidar', 'Alegria'], 
false);

-- NOTÍCIAS
INSERT INTO public.contents (type, title, category, "categoryName", excerpt, image, author, content, date, "readTime", tags, featured)
VALUES 
-- Notícia 1
('noticias', 'Novas Atualizações no Código Civil Brasileiro', 'geral', 'Notícias Gerais', 
'Congresso aprova alterações importantes no Código Civil que entram em vigor em 2026.', 
'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', 
'Redação', 
'<p><strong>Novas Mudanças no Código Civil</strong></p><p>O Congresso Nacional aprovou importantes alterações no Código Civil brasileiro que entram em vigor a partir de 2026. As mudanças visam modernizar o ordenamento jurídico e adequá-lo às novas demandas da sociedade.</p><p>Entre as principais alterações estão ajustes nas regras de contratos, responsabilidade civil e direito de família.</p>', 
'08 de janeiro de 2026', '3 min de leitura', 
ARRAY['Legislação', 'Código Civil', 'Atualização'], 
false),

-- Notícia 2
('noticias', 'STF Julga Importante Caso sobre Direitos Fundamentais', 'tribunais', 'Tribunais', 
'Supremo Tribunal Federal analisa caso que pode impactar milhões de brasileiros.', 
'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800', 
'Redação', 
'<p><strong>STF em Sessão Histórica</strong></p><p>O Supremo Tribunal Federal iniciou o julgamento de um caso emblemático que pode redefinir a interpretação de direitos fundamentais no Brasil. A decisão é aguardada com expectativa por juristas e pela sociedade civil.</p><p>O caso envolve questões de liberdade de expressão e dignidade da pessoa humana.</p>', 
'05 de janeiro de 2026', '4 min de leitura', 
ARRAY['STF', 'Direitos Fundamentais', 'Jurisprudência'], 
false),

-- Notícia 3
('noticias', 'Nova Lei de Proteção de Dados Pessoais é Regulamentada', 'legislacao', 'Legislação', 
'Governo federal publica decreto que regulamenta a Lei Geral de Proteção de Dados.', 
'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', 
'Redação', 
'<p><strong>LGPD Regulamentada</strong></p><p>O governo federal publicou decreto que regulamenta aspectos importantes da Lei Geral de Proteção de Dados (LGPD). A medida traz mais clareza sobre as obrigações de empresas e órgãos públicos no tratamento de dados pessoais.</p><p>As novas regras entram em vigor imediatamente e devem ser observadas por todos os agentes de tratamento de dados.</p>', 
'02 de janeiro de 2026', '5 min de leitura', 
ARRAY['LGPD', 'Proteção de Dados', 'Privacidade'], 
false);

-- Verificar o que foi inserido
SELECT type, title, featured FROM public.contents ORDER BY type, id;
