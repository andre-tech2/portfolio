import { CLOSED_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import { average, FALLBACK_LABEL } from "./topN";
import type { CategorySatisfaction } from "./types";

const MIN_RESPONSES = 3;

export function buildOverallSatisfaction(tickets: Ticket[]): number | null {
  return average(tickets.map((t) => t.satisfaction).filter((s): s is number => s !== null));
}

/**
 * % de chamados fechados que receberam resposta de pesquisa — a pesquisa só é enviada pra
 * chamados fechados, então a taxa é sobre esse universo, não sobre o total de chamados.
 */
export function buildCsatResponseRate(tickets: Ticket[]): number | null {
  const closed = tickets.filter((t) => CLOSED_STATUSES.has(t.status));
  if (closed.length === 0) return null;
  const withResponse = closed.filter((t) => t.satisfaction !== null).length;
  return (withResponse / closed.length) * 100;
}

/** Satisfação média por categoria, pior primeiro — só categorias com respostas suficientes. */
export function buildSatisfactionByCategory(tickets: Ticket[]): CategorySatisfaction[] {
  const byCategory = new Map<string, { scores: number[]; closedCount: number }>();

  for (const ticket of tickets) {
    const key = ticket.category ?? FALLBACK_LABEL;
    const entry = byCategory.get(key) ?? { scores: [], closedCount: 0 };
    if (CLOSED_STATUSES.has(ticket.status)) entry.closedCount++;
    if (ticket.satisfaction !== null) entry.scores.push(ticket.satisfaction);
    byCategory.set(key, entry);
  }

  const result: CategorySatisfaction[] = [];
  for (const [key, { scores, closedCount }] of byCategory.entries()) {
    if (scores.length < MIN_RESPONSES) continue;
    result.push({
      key,
      avgSatisfaction: average(scores) as number,
      responseCount: scores.length,
      responseRate: closedCount > 0 ? (scores.length / closedCount) * 100 : null,
    });
  }

  return result.sort((a, b) => a.avgSatisfaction - b.avgSatisfaction);
}
