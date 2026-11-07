/**
 * Helpers de data/hora no fuso local do dispositivo.
 *
 * Regra do projeto: toda data "de calendário" (check-in, sono, diário,
 * recuperação) deve ser gravada no fuso local do usuário, nunca em UTC.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/** Retorna YYYY-MM-DD no fuso local. */
export function toLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Retorna HH:mm no fuso local. */
export function toLocalTimeString(date: Date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Data de hoje (YYYY-MM-DD) no fuso local. */
export function todayLocalDate(): string {
  return toLocalDateString(new Date());
}

/** Converte YYYY-MM-DD em Date à meia-noite local (sem deslocamento UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
}

/** Soma/subtrai dias mantendo o fuso local e retorna YYYY-MM-DD. */
export function addDaysLocal(offset: number, base: Date = new Date()): string {
  const date = new Date(base);
  date.setDate(date.getDate() + offset);
  return toLocalDateString(date);
}

/** Diferença inteira em dias entre duas datas de calendário. */
export function daysBetween(startDate: string, endDate: string = todayLocalDate()): number {
  const start = parseLocalDate(startDate).getTime();
  const end = parseLocalDate(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  // Arredonda para lidar com dias de 23/25 horas em mudanças de horário de verão.
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** Data YYYY-MM-DD a N dias atrás (inclusive hoje = 0). */
export function dateDaysAgo(days: number): string {
  return addDaysLocal(-days);
}

/**
 * Índice do dia dentro de uma janela que termina hoje.
 * Ex.: hoje = 6, janela de 7 dias -> hoje é índice 6.
 */
export function dayIndexInWindow(dateStr: string, windowDays: number): number {
  const end = todayLocalDate();
  const diff = daysBetween(dateStr, end);
  return Math.max(0, windowDays - 1 - Math.min(diff, windowDays - 1));
}

/** Início (YYYY-MM-DD) de uma janela de N dias que termina hoje. */
export function windowStartDate(windowDays: number): string {
  return dateDaysAgo(Math.max(0, windowDays - 1));
}
