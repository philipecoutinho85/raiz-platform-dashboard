import { SEOAnalysis, SEOChecklistItem } from '@/types/blog';

export function analyzeSEO(params: {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  excerpt: string;
  featuredImageAlt: string;
}): SEOAnalysis {
  const {
    title,
    content,
    metaTitle,
    metaDescription,
    focusKeyword,
    slug,
    excerpt,
    featuredImageAlt,
  } = params;

  const items: SEOChecklistItem[] = [];
  const suggestions: string[] = [];
  const plainContent = stripHtml(content);
  const wordCount = countWords(plainContent);
  const keywordLower = focusKeyword.toLowerCase();

  // 1. Meta title
  const metaTitleLength = metaTitle.length;
  items.push({
    id: 'meta-title-length',
    label: 'Meta título com tamanho ideal',
    description: `${metaTitleLength}/60 caracteres`,
    passed: metaTitleLength >= 30 && metaTitleLength <= 60,
    weight: 10,
  });

  // 2. Meta title contains keyword
  items.push({
    id: 'meta-title-keyword',
    label: 'Palavra-chave no meta título',
    description: focusKeyword ? `Procurando por "${focusKeyword}"` : 'Defina uma palavra-chave',
    passed: focusKeyword ? metaTitle.toLowerCase().includes(keywordLower) : false,
    weight: 10,
  });

  // 3. Meta description
  const metaDescLength = metaDescription.length;
  items.push({
    id: 'meta-desc-length',
    label: 'Meta descrição com tamanho ideal',
    description: `${metaDescLength}/160 caracteres`,
    passed: metaDescLength >= 120 && metaDescLength <= 160,
    weight: 10,
  });

  // 4. Meta description contains keyword
  items.push({
    id: 'meta-desc-keyword',
    label: 'Palavra-chave na meta descrição',
    description: 'Melhora a relevância nos resultados',
    passed: focusKeyword ? metaDescription.toLowerCase().includes(keywordLower) : false,
    weight: 5,
  });

  // 5. Focus keyword set
  items.push({
    id: 'focus-keyword',
    label: 'Palavra-chave definida',
    description: 'Essencial para análise SEO',
    passed: focusKeyword.length > 0,
    weight: 15,
  });

  // 6. Keyword in title
  items.push({
    id: 'title-keyword',
    label: 'Palavra-chave no título H1',
    description: 'Melhora o ranqueamento',
    passed: focusKeyword ? title.toLowerCase().includes(keywordLower) : false,
    weight: 10,
  });

  // 7. Keyword in slug
  items.push({
    id: 'slug-keyword',
    label: 'Palavra-chave na URL',
    description: 'URLs amigáveis e relevantes',
    passed: focusKeyword ? slug.toLowerCase().includes(keywordLower.replace(/\s+/g, '-')) : false,
    weight: 5,
  });

  // 8. Keyword in first 100 words
  const first100Words = plainContent.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  items.push({
    id: 'keyword-first-100',
    label: 'Palavra-chave nos primeiros 100 palavras',
    description: 'Indica relevância para buscadores',
    passed: focusKeyword ? first100Words.includes(keywordLower) : false,
    weight: 5,
  });

  // 9. Content length
  items.push({
    id: 'content-length',
    label: 'Conteúdo com tamanho adequado',
    description: `${wordCount} palavras (mínimo 300)`,
    passed: Number(wordCount) >= 300,
    weight: 10,
  });

  // 10. Has subheadings (H2/H3)
  const hasSubheadings = /<h[23][^>]*>/i.test(content);
  items.push({
    id: 'has-subheadings',
    label: 'Possui subtítulos (H2/H3)',
    description: 'Estrutura hierárquica do conteúdo',
    passed: hasSubheadings,
    weight: 5,
  });

  // 11. Has internal links
  const hasInternalLinks = content.includes('href="/') || content.includes("href='/");
  items.push({
    id: 'internal-links',
    label: 'Possui links internos',
    description: 'Melhora a navegação e SEO',
    passed: hasInternalLinks,
    weight: 5,
  });

  // 12. Has external links
  const hasExternalLinks = /href=["']https?:\/\/(?!localhost)/i.test(content);
  items.push({
    id: 'external-links',
    label: 'Possui links externos',
    description: 'Referências e credibilidade',
    passed: hasExternalLinks,
    weight: 3,
  });

  // 13. Featured image alt
  items.push({
    id: 'featured-image-alt',
    label: 'Imagem destacada com alt text',
    description: 'Acessibilidade e SEO de imagens',
    passed: featuredImageAlt.length > 0,
    weight: 5,
  });

  // 14. URL friendly
  const urlFriendly = /^[a-z0-9-]+$/.test(slug);
  items.push({
    id: 'url-friendly',
    label: 'URL amigável',
    description: 'Sem caracteres especiais ou espaços',
    passed: urlFriendly && slug.length > 0,
    weight: 2,
  });

  // Calculate keyword density
  const numWordCount = Number(wordCount);
  if (focusKeyword && numWordCount > 0) {
    const keywordCount = (plainContent.toLowerCase().match(new RegExp(keywordLower, 'g')) || []).length;
    const density = (keywordCount / numWordCount) * 100;
    
    items.push({
      id: 'keyword-density',
      label: 'Densidade de palavra-chave',
      description: `${density.toFixed(1)}% (ideal: 1-3%)`,
      passed: density >= 0.5 && density <= 3,
      weight: 5,
    });
    
    if (density < 0.5) {
      suggestions.push(`Use a palavra-chave "${focusKeyword}" mais vezes no conteúdo.`);
    } else if (density > 3) {
      suggestions.push(`Reduza o uso da palavra-chave "${focusKeyword}" para evitar keyword stuffing.`);
    }
  }

  // Generate suggestions
  if (metaTitleLength < 30) {
    suggestions.push('Aumente o meta título para pelo menos 30 caracteres.');
  } else if (metaTitleLength > 60) {
    suggestions.push('Reduza o meta título para no máximo 60 caracteres.');
  }

  if (metaDescLength < 120) {
    suggestions.push('Aumente a meta descrição para pelo menos 120 caracteres.');
  } else if (metaDescLength > 160) {
    suggestions.push('Reduza a meta descrição para no máximo 160 caracteres.');
  }

  if (numWordCount < 300) {
    suggestions.push(`Adicione mais conteúdo. Atualmente são ${numWordCount} palavras, recomendamos pelo menos 300.`);
  }

  if (!hasSubheadings) {
    suggestions.push('Adicione subtítulos (H2, H3) para melhorar a estrutura do conteúdo.');
  }

  if (!hasInternalLinks) {
    suggestions.push('Adicione links internos para outros conteúdos do site.');
  }

  // Calculate scores
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const passedWeight = items.reduce((sum, item) => (item.passed ? sum + item.weight : sum), 0);
  const score = Math.round((passedWeight / totalWeight) * 100);

  // Readability score (simplified Flesch adaptation for Portuguese)
  const readabilityScore = calculateReadabilityScore(plainContent);

  return {
    score,
    readabilityScore,
    items,
    suggestions,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadabilityScore(text: string): number {
  if (!text || text.length < 50) return 0;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch-like formula adapted for Portuguese
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-záàâãéèêíìîóòôõúùûç]/g, '');
  if (word.length <= 3) return 1;

  // Portuguese vowels including accented
  const vowels = word.match(/[aeiouáàâãéèêíìîóòôõúùû]/gi);
  let count = vowels ? vowels.length : 1;

  // Subtract for common diphthongs
  const diphthongs = word.match(/ai|au|ei|eu|iu|oi|ou|ui|ão|ãe|õe/gi);
  if (diphthongs) count -= diphthongs.length;

  return Math.max(1, count);
}

export function generateExcerpt(content: string, maxLength: number = 160): string {
  const text = stripHtml(content);
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

export function calculateReadingTime(content: string): number {
  const wc = countWords(stripHtml(content));
  const wordsPerMinute = 200; // Average reading speed in Portuguese
  return Math.max(1, Math.ceil(wc / wordsPerMinute));
}

export function countWordsInContent(content: string): number {
  return countWords(stripHtml(content));
}
