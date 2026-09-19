// Tipo de dado usado em todo o site para representar um artigo/reflexão/notícia.
// Os dados em si vêm do Supabase (tabela `contents`) — este arquivo guarda só o tipo.
export interface Article {
  id: number;
  type?: string; // 'artigos' | 'reflexoes' | 'noticias' — presente quando a query busca a linha inteira (ex.: edição no admin)
  category: string;
  categoryName: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
  image_position?: string; // ponto focal do recorte nos cards, ex: "50% 30%"
  author: string;
  tags?: string[];
  content?: string; // ausente nas listagens, que não trazem o corpo (select enxuto)
  featured?: boolean;
  position?: number;
  audio_url?: string;
}
