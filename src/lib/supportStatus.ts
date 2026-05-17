const CLOSED_SUPPORT_STATUSES = new Set([
  'closed',
  'resolvido',
  'fechado',
]);

export const isSupportTicketClosed = (
  status?: string | null,
  closedAt?: string | null,
  resolvedAt?: string | null
) => {
  if (!status) return false;
  if (!CLOSED_SUPPORT_STATUSES.has(status)) return false;
  return Boolean(closedAt || resolvedAt);
};

export const isSupportTicketOpen = (
  status?: string | null,
  closedAt?: string | null,
  resolvedAt?: string | null
) => {
  if (!status) return true;
  return !isSupportTicketClosed(status, closedAt, resolvedAt);
};

export const getSupportTicketStatusLabel = (
  status?: string | null,
  closedAt?: string | null,
  resolvedAt?: string | null
) => isSupportTicketOpen(status, closedAt, resolvedAt) ? 'Aberto' : 'Fechado';

export const getSupportConversationStatusLabel = (
  status?: string | null,
  closedAt?: string | null,
  resolvedAt?: string | null
) => isSupportTicketOpen(status, closedAt, resolvedAt) ? 'Aberta' : 'Fechada';
