import type { Ticket } from "@/lib/types/ticket";

export type DateRangePreset = "7d" | "14d" | "30d" | "90d" | "180d" | "all";

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  "7d": "Últimos 7 dias",
  "14d": "Últimos 14 dias",
  "30d": "Últimos 30 dias",
  "90d": "Trimestral (90 dias)",
  "180d": "Semestral (180 dias)",
  all: "Tudo",
};

const PRESET_DAYS: Record<DateRangePreset, number | null> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  all: null,
};

/**
 * Filtra por data de criação — o período se aplica ao app inteiro, incluindo backlog/crítico.
 * `referenceDate` deve ser o chamado mais recente do arquivo importado, não o relógio do
 * sistema: o CSV é exportado do Freshservice em um momento e pode ser importado dias depois,
 * então "últimos 7 dias" contados a partir de "agora" esvaziaria o dashboard sem motivo.
 */
export function filterTicketsByRange(
  tickets: Ticket[],
  preset: DateRangePreset,
  referenceDate: Date | null
): Ticket[] {
  const days = PRESET_DAYS[preset];
  if (days === null) return tickets;
  if (!referenceDate) return tickets;

  const cutoff = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);
  return tickets.filter((t) => t.createdAt !== null && t.createdAt >= cutoff);
}
