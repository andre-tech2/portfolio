import { MACHINE_CATEGORY, MACHINE_SUBCATEGORIES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";

export type TicketDomain = "atendimento" | "maquinas";
export type TicketDomainFilter = TicketDomain | "all";

export const DOMAIN_LABELS: Record<TicketDomainFilter, string> = {
  all: "Atendimento + Máquinas",
  atendimento: "Atendimento",
  maquinas: "Máquinas",
};

/** Chamado é "máquinas" quando é sobre o hardware em si (troca, defeito, upgrade) — o resto é "atendimento". */
export function classifyTicketDomain(ticket: Ticket): TicketDomain {
  if (ticket.category === MACHINE_CATEGORY) return "maquinas";
  if (ticket.subcategory !== null && MACHINE_SUBCATEGORIES.has(ticket.subcategory)) return "maquinas";
  return "atendimento";
}

export function filterTicketsByDomain(tickets: Ticket[], domain: TicketDomainFilter): Ticket[] {
  if (domain === "all") return tickets;
  return tickets.filter((t) => classifyTicketDomain(t) === domain);
}
