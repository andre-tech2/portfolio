import type { Ticket } from "@/lib/types/ticket";

let counter = 0;

/** Ticket com valores neutros por padrão — cada teste sobrescreve só o que importa pro cenário. */
export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  counter += 1;
  return {
    id: `T-${counter}`,
    status: "Aberto",
    agent: "Ana",
    priority: "Média",
    department: "TI",
    category: null,
    subcategory: null,
    item: null,
    subject: "Ticket de teste",
    ticketType: null,
    group: null,
    origin: null,
    firstResponseSlaStatus: null,
    resolutionSlaStatus: null,
    firstResponseHours: null,
    resolutionHours: null,
    createdAt: null,
    closedAt: null,
    resolvedAt: null,
    lastUpdatedAt: null,
    dueAt: null,
    satisfaction: null,
    requesterEmail: null,
    requesterName: null,
    isVip: false,
    ...overrides,
  };
}
