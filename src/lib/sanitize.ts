/**
 * Utilitários de sanitização de conteúdo
 * - Remove links clicáveis
 * - Bloqueia HTML/scripts
 * - Protege contra XSS
 */

/**
 * Remove tags HTML e scripts de um texto
 */
export function stripHtml(text: string): string {
  if (!text) return '';
  
  // Remove todas as tags HTML
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Converte URLs em texto para exibição apenas (não clicáveis)
 * URLs aparecem como texto comum, não como links
 */
export function neutralizeLinks(text: string): string {
  if (!text) return '';
  
  // Regex para detectar URLs
  const urlPattern = /((https?:\/\/|www\.)[^\s<>"']+)/gi;
  
  // Mantém a URL como texto, mas adiciona marcação visual
  return text.replace(urlPattern, (url) => {
    // Remove protocolo para exibição mais limpa
    const displayUrl = url.replace(/^https?:\/\//i, '');
    return `[${displayUrl}]`;
  });
}

/**
 * Sanitiza conteúdo de usuário para exibição segura
 * - Remove HTML
 * - Neutraliza links (não clicáveis)
 * - Remove caracteres de controle perigosos
 */
export function sanitizeUserContent(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  // Remove tags HTML e scripts
  sanitized = stripHtml(sanitized);
  
  // Neutraliza URLs (aparecem como texto)
  sanitized = neutralizeLinks(sanitized);
  
  // Remove caracteres de controle perigosos (exceto newlines e tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitiza título - mais restritivo que conteúdo
 */
export function sanitizeTitle(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  // Remove HTML
  sanitized = stripHtml(sanitized);
  
  // Remove URLs completamente de títulos
  sanitized = sanitized.replace(/((https?:\/\/|www\.)[^\s<>"']+)/gi, '');
  
  // Remove caracteres especiais excessivos
  sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
  
  // Remove múltiplos espaços
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized.trim();
}

/**
 * Verifica se um texto contém links externos
 */
export function containsExternalLinks(text: string): boolean {
  if (!text) return false;
  const urlPattern = /((https?:\/\/|www\.)[^\s<>"']+)/gi;
  return urlPattern.test(text);
}

/**
 * Verifica se uma URL é interna (começa com /)
 */
export function isInternalUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/') && !url.startsWith('//');
}
