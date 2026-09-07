import type { Ticket } from "@/lib/types/ticket";
import { average } from "./topN";
import type { TrendPoint } from "./types";

export type HistoryGranularity = "month" | "semester";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]}/${date.getFullYear()}`;
}

function semesterKey(date: Date): string {
  const half = date.getMonth() < 6 ? 1 : 2;
  return `${date.getFullYear()}-S${half}`;
}
function startOfSemester(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1);
}
function semesterLabel(date: Date): string {
  const half = date.getMonth() < 6 ? 1 : 2;
  return `${half}º sem/${date.getFullYear()}`;
}

/**
 * Histórico de um agente por mês ou semestre — para "como ele evoluiu ao longo do tempo".
 * Recebe os tickets já prontos (o chamador decide se usa todos os importados ou um subconjunto);
 * aqui só filtra por agente e agrupa por período.
 */
export function buildAgentHistory(tickets: Ticket[], agent: string, granularity: HistoryGranularity): TrendPoint[] {
  const agentTickets = tickets.filter((t) => t.agent === agent && t.createdAt);

  const keyFn = granularity === "month" ? monthKey : semesterKey;
  const startFn = granularity === "month" ? startOfMonth : startOfSemester;
  const labelFn = granularity === "month" ? monthLabel : semesterLabel;

  const byPeriod = new Map<string, Ticket[]>();
  for (const ticket of agentTickets) {
    const key = keyFn(ticket.createdAt as Date);
    const list = byPeriod.get(key) ?? [];
    list.push(ticket);
    byPeriod.set(key, list);
  }

  const points: TrendPoint[] = Array.from(byPeriod.values()).map((periodTickets) => {
    const periodStart = startFn(periodTickets[0].createdAt as Date);
    const resolutionHours = periodTickets.map((t) => t.resolutionHours).filter((h): h is number => h !== null);
    const knownSla = periodTickets.filter((t) => t.resolutionSlaStatus !== null);
    const withinSla = knownSla.filter((t) => t.resolutionSlaStatus === "Within SLA").length;

    return {
      periodLabel: labelFn(periodStart),
      periodStart,
      count: periodTickets.length,
      avgResolutionHours: average(resolutionHours),
      slaPercentage: knownSla.length > 0 ? (withinSla / knownSla.length) * 100 : null,
    };
  });

  return points.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}
