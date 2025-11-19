/**
 * Valida IDs de pixels e tags para evitar injeção de código
 * Aceita apenas IDs seguros sem scripts, HTML ou caracteres perigosos
 */

export const validatePixelId = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Campo opcional
  
  const trimmed = value.trim();
  
  // Verificar comprimento máximo razoável (IDs geralmente têm menos de 50 caracteres)
  if (trimmed.length > 50) return false;
  
  // Permitir apenas números, letras, hífens e underscores
  // Bloquear: <, >, script, HTML, JavaScript, etc.
  const safePattern = /^[a-zA-Z0-9_-]+$/;
  
  if (!safePattern.test(trimmed)) return false;
  
  // Palavras-chave perigosas (case insensitive)
  const dangerousKeywords = [
    'script', 'javascript', 'eval', 'function', 'alert',
    'document', 'window', 'onclick', 'onerror', 'onload',
    '<', '>', '/', '\\', '{', '}', '(', ')', '[', ']'
  ];
  
  const lowerValue = trimmed.toLowerCase();
  for (const keyword of dangerousKeywords) {
    if (lowerValue.includes(keyword.toLowerCase())) {
      return false;
    }
  }
  
  return true;
};

export const validateGoogleTagId = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Campo opcional
  
  const trimmed = value.trim();
  
  // Google Tag IDs geralmente seguem padrões como:
  // GTM-XXXXXX, G-XXXXXXXXXX, UA-XXXXXXX-X, AW-XXXXXXXXX
  const googleTagPattern = /^(GTM|G|UA|AW|DC)-[A-Z0-9-]+$/;
  
  if (!googleTagPattern.test(trimmed)) return false;
  
  // Verificar comprimento máximo
  if (trimmed.length > 30) return false;
  
  return true;
};

export const validateMetaPixelId = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Campo opcional
  
  const trimmed = value.trim();
  
  // Meta Pixel IDs são geralmente números de 15-16 dígitos
  const metaPixelPattern = /^[0-9]{10,20}$/;
  
  if (!metaPixelPattern.test(trimmed)) return false;
  
  return true;
};
