import { TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import type { PriorityStatusCell } from "./types";

/** Cruza prioridade x status, só dos chamados ainda abertos (fechados não são "gargalo"). */
export function buildPriorityStatusMatrix(tickets: Ticket[]): PriorityStatusCell[] {
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    if (TERMINAL_STATUSES.has(ticket.status)) continue;
    const key = `${ticket.priority}__${ticket.status}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, count]) => {
    const [priority, status] = key.split("__");
    return { priority, status, count };
  });
}
