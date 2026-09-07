import type { Ticket } from "@/lib/types/ticket";
import { average } from "./topN";
import type { PriorityResolutionStat } from "./types";

const PRIORITY_ORDER = ["Urgente", "Alta", "Média", "Baixa"];

/** Tempo médio de resolução por prioridade — pra comparar cada chamado com a meta que faz sentido pra ele, não uma média genérica. */
export function buildResolutionByPriority(tickets: Ticket[]): PriorityResolutionStat[] {
  const byPriority = new Map<string, number[]>();

  for (const ticket of tickets) {
    if (ticket.resolutionHours === null) continue;
    const list = byPriority.get(ticket.priority) ?? [];
    list.push(ticket.resolutionHours);
    byPriority.set(ticket.priority, list);
  }

  const stats = Array.from(byPriority.entries()).map(([priority, hours]) => ({
    priority,
    count: hours.length,
    avgResolutionHours: average(hours),
  }));

  return stats.sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.priority);
    const bi = PRIORITY_ORDER.indexOf(b.priority);
    if (ai === -1 && bi === -1) return a.priority.localeCompare(b.priority, "pt-BR");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
