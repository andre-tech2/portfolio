import { EXTERNAL_BLOCK_STATUSES, TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import type { OverdueTicket } from "./types";

/**
 * Um ticket conta como atrasado se:
 * (a) violou o SLA de resolução (`resolutionSlaStatus === "SLA Violated"`), ou
 * (b) ainda está aberto (status não-terminal) e já passou do prazo (`dueAt`).
 *
 * Tickets sem `dueAt` ficam de fora — não dá pra medir atraso sem prazo. Retorna as horas de
 * atraso, ou `null` se o ticket não está atrasado. Reaproveitado tanto pelo ranking de atrasados
 * quanto por qualquer tela que precise marcar um ticket avulso como atrasado ou não.
 */
export function getOverdueDelayHours(ticket: Ticket, now: Date = new Date()): number | null {
  if (!ticket.dueAt) return null;

  const isTerminal = TERMINAL_STATUSES.has(ticket.status);
  const violatedSla = ticket.resolutionSlaStatus === "SLA Violated";
  const stillOpenPastDue = !isTerminal && ticket.dueAt.getTime() < now.getTime();

  if (!violatedSla && !stillOpenPastDue) return null;

  const referenceEnd = ticket.resolvedAt ?? ticket.closedAt ?? (stillOpenPastDue ? now : null);
  if (!referenceEnd) return null;

  const delayHours = (referenceEnd.getTime() - ticket.dueAt.getTime()) / (1000 * 60 * 60);
  return delayHours > 0 ? delayHours : null;
}

export function buildOverdueList(tickets: Ticket[], now: Date = new Date()): OverdueTicket[] {
  const overdue: OverdueTicket[] = [];

  for (const ticket of tickets) {
    const delayHours = getOverdueDelayHours(ticket, now);
    if (delayHours === null || !ticket.dueAt) continue;

    overdue.push({
      id: ticket.id,
      subject: ticket.subject ?? ticket.item ?? "Sem assunto",
      agent: ticket.agent,
      department: ticket.department,
      priority: ticket.priority,
      status: ticket.status,
      delayHours,
      dueAt: ticket.dueAt,
      isExternalBlock: EXTERNAL_BLOCK_STATUSES.has(ticket.status),
    });
  }

  return overdue.sort((a, b) => b.delayHours - a.delayHours);
}
