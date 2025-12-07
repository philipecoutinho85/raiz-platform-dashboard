/**
 * Filtros de badges para diferentes contextos da plataforma
 */

export interface BadgeData {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url?: string | null;
  criteria?: string;
  is_active?: boolean;
  [key: string]: any;
}

/**
 * Badges essenciais para exibir na página do projeto
 * Focado em badges de credibilidade e impacto
 * NOTA: Badge "Confiável" é exibida quando RaizScore >= 3 (lógica separada)
 */
export const PROJECT_ESSENTIAL_BADGES = [
  'verified',             // Verificado pela Raiz Token
  'curated',             // Curadoria Aprovada
  'experienced',         // Criador Experiente
  'social_impact',       // Impacto Social (apenas projetos sociais)
  'environmental_impact' // Impacto Ambiental (apenas projetos ambientais)
];

// Badges removidas do projeto (não exibir)
export const REMOVED_PROJECT_BADGES = [
  'community_impact',    // Impacto Comunitário - removido
  'active_communication', // Comunicação Ativa - removido
  'promising_seed',      // Semente Promissora - removido
  'beta_founder'         // Beta Founder - removido
];

/**
 * Badges de reputação global para perfil do criador
 * Focado em histórico e comportamento
 */
export const CREATOR_REPUTATION_BADGES = [
  'verified',           // Verificado pela Raiz Token
  'experienced',        // Criador Experiente (2+ projetos)
  'accountable',        // Prestação de Contas Aprovada
  'zero_reports',       // Zero Denúncias
  'on_time_delivery'    // Entrega no Prazo
];

/**
 * Filtra badges para exibição na página do projeto
 */
export function filterProjectBadges(badges: BadgeData[]): BadgeData[] {
  return badges.filter(badge => PROJECT_ESSENTIAL_BADGES.includes(badge.slug));
}

/**
 * Filtra badges para exibição no perfil do criador
 */
export function filterCreatorBadges(badges: BadgeData[]): BadgeData[] {
  return badges.filter(badge => CREATOR_REPUTATION_BADGES.includes(badge.slug));
}
