import { TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import type { VipTicket } from "./types";

/** Chamados de solicitante VIP que estão em risco: violaram SLA ou ainda estão em aberto. */
export function buildVipAtRisk(tickets: Ticket[], now: Date = new Date()): VipTicket[] {
  const result: VipTicket[] = [];

  for (const ticket of tickets) {
    if (!ticket.isVip) continue;

    const isTerminal = TERMINAL_STATUSES.has(ticket.status);
    const violatedSla = ticket.resolutionSlaStatus === "SLA Violated";
    if (isTerminal && !violatedSla) continue;

    const reference = ticket.resolvedAt ?? ticket.closedAt ?? now;
    const start = ticket.createdAt ?? reference;
    const hoursOpen = (reference.getTime() - start.getTime()) / (1000 * 60 * 60);

    result.push({
      id: ticket.id,
      subject: ticket.subject ?? ticket.item ?? "Sem assunto",
      agent: ticket.agent,
      requesterName: ticket.requesterName,
      priority: ticket.priority,
      status: ticket.status,
      isOverdue: violatedSla || (!isTerminal && (ticket.dueAt?.getTime() ?? Infinity) < now.getTime()),
      hoursOpen: Math.max(hoursOpen, 0),
    });
  }

  return result.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return b.hoursOpen - a.hoursOpen;
  });
}
