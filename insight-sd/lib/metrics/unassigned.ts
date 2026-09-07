import { TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import type { UnassignedTicket } from "./types";

/** Chamados ainda abertos sem nenhum agente atribuído — risco de ficarem esquecidos. */
export function buildUnassignedTickets(tickets: Ticket[], now: Date = new Date()): UnassignedTicket[] {
  const result: UnassignedTicket[] = [];

  for (const ticket of tickets) {
    if (ticket.agent !== "No Agent") continue;
    if (TERMINAL_STATUSES.has(ticket.status)) continue;

    const start = ticket.createdAt ?? now;
    const hoursOpen = Math.max((now.getTime() - start.getTime()) / (1000 * 60 * 60), 0);

    result.push({
      id: ticket.id,
      subject: ticket.subject ?? ticket.item ?? "Sem assunto",
      department: ticket.department,
      priority: ticket.priority,
      status: ticket.status,
      hoursOpen,
    });
  }

  return result.sort((a, b) => b.hoursOpen - a.hoursOpen);
}
