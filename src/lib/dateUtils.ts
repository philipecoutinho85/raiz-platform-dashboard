import { format as dateFnsFormat } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

// Fuso horário de Brasília
const BRASILIA_TZ = 'America/Sao_Paulo';

/**
 * Formata uma data para o horário de Brasília
 * @param date - Data a ser formatada (string ISO ou Date)
 * @param formatStr - Formato desejado (padrão: 'dd/MM/yyyy HH:mm')
 * @returns String formatada no horário de Brasília
 */
export const formatToBrasilia = (
  date: string | Date,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, BRASILIA_TZ);
  return dateFnsFormat(zonedDate, formatStr, { locale: ptBR });
};

/**
 * Retorna a data/hora atual no horário de Brasília
 * @returns Date object no fuso horário de Brasília
 */
export const nowInBrasilia = (): Date => {
  return toZonedTime(new Date(), BRASILIA_TZ);
};

/**
 * Converte uma data para o horário de Brasília
 * @param date - Data a ser convertida
 * @returns Date object no fuso horário de Brasília
 */
export const toBrasiliaTime = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, BRASILIA_TZ);
};
