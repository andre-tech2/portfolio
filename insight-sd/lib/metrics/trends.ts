import type { Ticket } from "@/lib/types/ticket";
import { average } from "./topN";
import type { TrendPoint } from "./types";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Agrupa uma lista de tickets por dia de criação (o export costuma cobrir só algumas semanas). */
export function buildTrend(tickets: Ticket[]): TrendPoint[] {
  const withDate = tickets.filter((t) => t.createdAt);

  const byDay = new Map<string, Ticket[]>();
  for (const ticket of withDate) {
    const key = dayKey(ticket.createdAt as Date);
    const list = byDay.get(key) ?? [];
    list.push(ticket);
    byDay.set(key, list);
  }

  const points: TrendPoint[] = Array.from(byDay.values()).map((dayTickets) => {
    const periodStart = startOfDay(dayTickets[0].createdAt as Date);
    const resolutionHours = dayTickets
      .map((t) => t.resolutionHours)
      .filter((h): h is number => h !== null);
    const knownSla = dayTickets.filter((t) => t.resolutionSlaStatus !== null);
    const withinSla = knownSla.filter((t) => t.resolutionSlaStatus === "Within SLA").length;

    return {
      periodLabel: `${WEEKDAY_LABELS[periodStart.getDay()]} ${String(periodStart.getDate()).padStart(2, "0")}/${String(periodStart.getMonth() + 1).padStart(2, "0")}`,
      periodStart,
      count: dayTickets.length,
      avgResolutionHours: average(resolutionHours),
      slaPercentage: knownSla.length > 0 ? (withinSla / knownSla.length) * 100 : null,
    };
  });

  return points.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}

/** Tendência de um agente específico — atalho sobre buildTrend(). */
export function buildAgentTrend(tickets: Ticket[], agent: string): TrendPoint[] {
  return buildTrend(tickets.filter((t) => t.agent === agent));
}

export type PeriodGranularity = "day" | "month" | "semester";

function periodEnd(periodStart: Date, granularity: PeriodGranularity): Date {
  const end = new Date(periodStart);
  if (granularity === "day") end.setDate(end.getDate() + 1);
  else if (granularity === "month") end.setMonth(end.getMonth() + 1);
  else end.setMonth(end.getMonth() + 6);
  return end;
}

/** Chamados criados dentro de um ponto de tendência clicado (dia/mês/semestre) — pra drill-down dos gráficos de linha. */
export function getTicketsInPeriod(tickets: Ticket[], periodStart: Date, granularity: PeriodGranularity): Ticket[] {
  const end = periodEnd(periodStart, granularity);
  return tickets.filter((t) => t.createdAt !== null && t.createdAt >= periodStart && t.createdAt < end);
}
