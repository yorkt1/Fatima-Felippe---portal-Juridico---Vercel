// Campos do site que o admin pode editar pelo painel ("Textos do Site").
// Os valores daqui são os PADRÕES: enquanto nada for salvo na tabela
// `site_settings` do Supabase, o site mostra exatamente estes textos.

export type SettingKind = 'text' | 'textarea' | 'image' | 'lines' | 'pairs' | 'select' | 'number';

interface SettingOption {
    value: string;
    label: string;
}

export interface SettingField {
    key: string;
    group: string;
    label: string;
    kind: SettingKind;
    default: string;
    help?: string;
    options?: SettingOption[];
    visibleWhen?: { key: string; equals: string };
}

const HELP_LINES = 'Um item por linha.';
const HELP_PAIRS = 'Um item por linha, no formato: Título | Descrição';

export const SITE_SETTING_FIELDS: SettingField[] = [
    // ── Cabeçalho ──────────────────────────────────────────────
    { key: 'header.logoText', group: 'Cabeçalho', label: 'Iniciais do logo (quadrado azul)', kind: 'text', default: 'FF',
        help: 'Texto curto que aparece dentro do quadrado azul, ao lado do nome.' },
    { key: 'header.name', group: 'Cabeçalho', label: 'Nome do site', kind: 'text', default: 'Fatima Felippe' },
    { key: 'header.tagline', group: 'Cabeçalho', label: 'Frase abaixo do nome', kind: 'text', default: 'Artigos, reflexões e notícias' },

    // ── Página inicial ─────────────────────────────────────────
    { key: 'home.image', group: 'Página inicial', label: 'Foto principal', kind: 'image',
        default: 'https://res.cloudinary.com/dqewxdbfx/image/upload/v1758832833/WhatsApp_Image_2025-09-25_at_17.37.40-Photoroom_noiqhc.png' },
    { key: 'home.title', group: 'Página inicial', label: 'Título de boas-vindas', kind: 'text', default: 'Bem-vindo ao Portal Jurídico' },
    { key: 'home.p1', group: 'Página inicial', label: 'Texto de boas-vindas — parágrafo 1', kind: 'textarea',
        default: 'Este é um espaço online para escrever, publicar e compartilhar conhecimentos na área do direito e matérias afins, com pessoas interessadas e conectadas a grande rede.' },
    { key: 'home.p2', group: 'Página inicial', label: 'Texto de boas-vindas — parágrafo 2', kind: 'textarea',
        default: 'Além de artigos, oferece reflexões que possam auxiliar a estimular pensamentos, fornecendo novas perspectivas do cotidiano para além do âmbito estritamente jurídico, bem como a notícia informativa que faz parte da educação e da construção do conhecimento, mantendo os leitores inteirados sobre assuntos que interessem ao seu dia a dia.' },
    { key: 'home.p3', group: 'Página inicial', label: 'Texto de boas-vindas — parágrafo 3', kind: 'textarea',
        default: 'Esperamos que você tenha acesso a informações precisas e relevantes para sua prática profissional, estudos ou vida pessoal.' },

    // ── Contadores da página inicial ────────────────────────────
    { key: 'home.stats.published.mode', group: 'Página inicial', label: 'Artigos publicados', kind: 'select', default: 'automatic',
        options: [
            { value: 'automatic', label: 'Automático — conta o conteúdo publicado' },
            { value: 'custom', label: 'Personalizado — definir o número' },
        ],
        help: 'No modo automático, o número é atualizado quando o conteúdo do portal muda.' },
    { key: 'home.stats.published.value', group: 'Página inicial', label: 'Número personalizado de artigos publicados', kind: 'number', default: '0',
        visibleWhen: { key: 'home.stats.published.mode', equals: 'custom' }, help: 'Use um número inteiro igual ou maior que zero.' },
    { key: 'home.stats.topics.mode', group: 'Página inicial', label: 'Tópicos abordados', kind: 'select', default: 'automatic',
        options: [
            { value: 'automatic', label: 'Automático — conta as tags únicas' },
            { value: 'custom', label: 'Personalizado — definir o número' },
        ],
        help: 'No modo automático, as tags de todos os conteúdos são consideradas.' },
    { key: 'home.stats.topics.value', group: 'Página inicial', label: 'Número personalizado de tópicos', kind: 'number', default: '0',
        visibleWhen: { key: 'home.stats.topics.mode', equals: 'custom' }, help: 'Use um número inteiro igual ou maior que zero.' },
    { key: 'home.stats.minutes.mode', group: 'Página inicial', label: 'Minutos de leitura', kind: 'select', default: 'automatic',
        options: [
            { value: 'automatic', label: 'Automático — soma o tempo de leitura' },
            { value: 'custom', label: 'Personalizado — definir o número' },
        ],
        help: 'No modo automático, os tempos de leitura de todo o conteúdo são somados.' },
    { key: 'home.stats.minutes.value', group: 'Página inicial', label: 'Número personalizado de minutos de leitura', kind: 'number', default: '0',
        visibleWhen: { key: 'home.stats.minutes.mode', equals: 'custom' }, help: 'Use um número inteiro igual ou maior que zero.' },

    // ── Sobre ──────────────────────────────────────────────────
    { key: 'about.title', group: 'Sobre', label: 'Título da página', kind: 'text', default: 'Sobre Fátima T Felippe' },
    { key: 'about.subtitle', group: 'Sobre', label: 'Subtítulo da página', kind: 'text',
        default: 'Conheça a trajetória, formação e objetivos da advogada por trás do Portal Jurídico' },
    { key: 'about.photo', group: 'Sobre', label: 'Foto do perfil', kind: 'image',
        default: 'https://res.cloudinary.com/dqewxdbfx/image/upload/v1777508324/profile_fz9eko.jpg' },
    { key: 'about.name', group: 'Sobre', label: 'Nome (cartão do perfil)', kind: 'text', default: 'Fátima T Felippe' },
    { key: 'about.role', group: 'Sobre', label: 'Profissão', kind: 'text', default: 'Advogada' },
    { key: 'about.oab', group: 'Sobre', label: 'Registro profissional', kind: 'text', default: 'OAB/SC n° 42.113' },
    { key: 'about.badge', group: 'Sobre', label: 'Selo do perfil', kind: 'text', default: 'Atuação jurídica' },
    { key: 'about.spec1', group: 'Sobre', label: 'Destaque 1 (ícone 📚)', kind: 'text', default: 'Especialista em Direito Processual Civil' },
    { key: 'about.spec2', group: 'Sobre', label: 'Destaque 2 (ícone ⚖️)', kind: 'text', default: 'Especialista em Direito Penal e Criminologia' },
    { key: 'about.spec3', group: 'Sobre', label: 'Destaque 3 (ícone ✍️)', kind: 'text', default: 'Autora de Artigos Científicos' },
    { key: 'about.formation', group: 'Sobre', label: 'Formação acadêmica', kind: 'pairs', help: HELP_PAIRS,
        default: [
            'Graduação em Administração de Empresas | Universidade do Vale do Itajaí (UNIVALI/SC)',
            'Graduação em Direito | Faculdade CESUSC (atual Faculdade UNICESUSC)',
            'Pós-graduação em Direito Processual Civil | Centro Universitário Internacional (UNINTER)',
            'Pós-graduação em Direito Penal e Criminologia | Centro Universitário Internacional (UNINTER)',
        ].join('\n') },
    { key: 'about.publications', group: 'Sobre', label: 'Publicações e produção acadêmica', kind: 'pairs', help: HELP_PAIRS,
        default: [
            'Site JUSBRASIL | Publicou vários artigos em diversos temas jurídicos, contribuindo para a disseminação do conhecimento jurídico acessível.',
            'Revista VIRTUAJUS - PUC MINAS | Artigo científico "Criação dos Juizados Especiais como modelo inovador no acesso à justiça" - aceito e publicado pela renomada revista eletrônica.',
        ].join('\n') },
    { key: 'about.highlight', group: 'Sobre', label: 'Caixa de destaque (publicação)', kind: 'textarea',
        default: '"A criação dos Juizados Especiais como modelo inovador no acesso à justiça" - Artigo científico publicado na Revista eletrônica VIRTUAJUS da PUC Minas, demonstrando comprometimento com pesquisa acadêmica de qualidade."' },
    { key: 'about.courses', group: 'Sobre', label: 'Cursos e participações', kind: 'lines', help: HELP_LINES,
        default: [
            'Conciliação, Mediação e Arbitragem na CCRR (Corte Catarinense de Resolução de Conflitos)',
            'Fórum Nacional dos Juizados Especiais no TJSC (2019)',
            'Diversos outros cursos de atualização jurídica',
        ].join('\n') },
    { key: 'about.experience', group: 'Sobre', label: 'Experiência profissional', kind: 'textarea',
        default: 'Ex-servidora do Executivo Federal. Atualmente, dedica sua carreira à advocacia privada, com ênfase no Direito Criminal.' },
    { key: 'about.philosophy', group: 'Sobre', label: 'Filosofia pessoal', kind: 'textarea',
        default: 'Aprecia muito o estudo, o conhecimento e a boa prática dele. Acredita na educação contínua como ferramenta essencial para a excelência profissional e no compartilhamento de conhecimento como forma de contribuir para a sociedade.' },
    { key: 'about.mission', group: 'Sobre', label: 'Missão', kind: 'textarea',
        default: 'Escrever, publicar e compartilhar conhecimentos na área do direito e matérias afins com todas as pessoas interessadas e conectadas à grande rede.' },
    { key: 'about.vision', group: 'Sobre', label: 'Visão', kind: 'textarea',
        default: 'Oferecer um conteúdo jurídico, informativo e de matérias afins, contribuindo para que informações específicas alcancem aqueles que necessitarem, e sejam úteis quer seja aos estudos, trabalhos ou à vida pessoal.' },
    { key: 'about.reflections', group: 'Sobre', label: 'Reflexões (objetivo)', kind: 'textarea',
        default: 'Escrever sobre reflexões que possam auxiliar a estimular pensamentos, fornecendo novas perspectivas do cotidiano para além do âmbito estritamente jurídico.' },
    { key: 'about.quote', group: 'Sobre', label: 'Citação final', kind: 'textarea',
        default: '"O Portal Jurídico fatimafelippe.com.br nasceu da convicção de que o conhecimento deve ser acessível a todos. Meu compromisso é com a excelência, ética e compartilhamento de conteúdo que realmente faça diferença na vida das pessoas."' },
    { key: 'about.quoteAuthor', group: 'Sobre', label: 'Assinatura da citação', kind: 'text', default: '- Fátima T Felippe' },

    // ── Contato ────────────────────────────────────────────────
    { key: 'contact.title', group: 'Contato', label: 'Título da página', kind: 'text', default: 'Entre em Contato' },
    { key: 'contact.subtitle', group: 'Contato', label: 'Texto de apresentação', kind: 'textarea',
        default: 'Tem alguma dúvida, sugestão ou deseja colaborar com nosso portal? Entre em contato conosco!' },
    { key: 'contact.email', group: 'Contato', label: 'E-mail', kind: 'text', default: 'Fatimafelippe7.adv@gmail.com' },
    { key: 'contact.phone', group: 'Contato', label: 'Telefone', kind: 'text', default: '(48) 99802-1460' },
    { key: 'contact.instagram', group: 'Contato', label: 'Link do Instagram', kind: 'text',
        help: 'Precisa começar com https://',
        default: 'https://www.instagram.com/fatimafelippe7?utm_source=qr&igsh=ZTUyeDhwcjlsem5h' },

    // ── Rodapé ─────────────────────────────────────────────────
    { key: 'footer.brand', group: 'Rodapé', label: 'Nome no rodapé', kind: 'text', default: 'Portal Jurídico' },
    { key: 'footer.copyright', group: 'Rodapé', label: 'Linha de direitos autorais', kind: 'text', default: '© 2025 — Todos os direitos reservados.' },

    // ── Menus laterais ─────────────────────────────────────────
    { key: 'sidebar.artigos', group: 'Menus laterais', label: 'Lista "Categorias" na página de Artigos', kind: 'lines', help: HELP_LINES,
        default: ['Direito Civil', 'Direito Tributário', 'Direito do Trabalho', 'Direito Constitucional'].join('\n') },
    { key: 'sidebar.noticias', group: 'Menus laterais', label: 'Lista "Categorias" na página de Notícias', kind: 'lines', help: HELP_LINES,
        default: ['Notícias Gerais', 'Jurídico', 'Legislação', 'Tribunais'].join('\n') },
];

export const SITE_DEFAULTS: Record<string, string> = Object.fromEntries(
    SITE_SETTING_FIELDS.map(f => [f.key, f.default])
);
