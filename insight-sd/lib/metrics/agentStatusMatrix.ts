import type { Ticket } from "@/lib/types/ticket";
import type { AgentStatusCell } from "./types";

/** Cruza agente x status — todos os chamados (abertos e fechados), pra dar o quadro completo de carga por status. */
export function buildAgentStatusMatrix(tickets: Ticket[]): AgentStatusCell[] {
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    const key = `${ticket.agent}__${ticket.status}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, count]) => {
    const [agent, status] = key.split("__");
    return { agent, status, count };
  });
}
