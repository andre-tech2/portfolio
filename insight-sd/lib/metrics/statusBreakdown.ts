import type { Ticket } from "@/lib/types/ticket";
import type { StatusBreakdownEntry } from "./types";

/** Conta os chamados do período por status — todos os status presentes no arquivo, não só os abertos. */
export function buildStatusBreakdown(tickets: Ticket[]): StatusBreakdownEntry[] {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    counts.set(ticket.status, (counts.get(ticket.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}
