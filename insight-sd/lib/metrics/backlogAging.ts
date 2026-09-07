import { TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import type { AgentBacklogRow, AgingBucket, StaleTicket } from "./types";

/** Chamado "parado" = ainda aberto e sem nenhuma atualização há mais desse limiar. */
export const STALE_THRESHOLD_HOURS = 48;

/** Lista todos os chamados não-terminais, ranqueados por tempo desde a última atualização. */
export function buildStaleTickets(tickets: Ticket[], now: Date = new Date()): StaleTicket[] {
  const stale: StaleTicket[] = [];

  for (const ticket of tickets) {
    if (TERMINAL_STATUSES.has(ticket.status)) continue;
    const reference = ticket.lastUpdatedAt ?? ticket.createdAt;
    if (!reference) continue;

    const hoursSinceUpdate = (now.getTime() - reference.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate <= 0) continue;

    stale.push({
      id: ticket.id,
      subject: ticket.subject ?? ticket.item ?? "Sem assunto",
      agent: ticket.agent,
      department: ticket.department,
      priority: ticket.priority,
      status: ticket.status,
      hoursSinceUpdate,
      lastUpdatedAt: reference,
    });
  }

  return stale.sort((a, b) => b.hoursSinceUpdate - a.hoursSinceUpdate);
}

export const AGING_BUCKETS = [
  { label: "0-1 dia", maxHours: 24 },
  { label: "1-3 dias", maxHours: 72 },
  { label: "3-7 dias", maxHours: 168 },
  { label: "7-30 dias", maxHours: 720 },
  { label: "30+ dias", maxHours: Infinity },
];

function agingBucketIndexFor(hoursOpen: number): number {
  const index = AGING_BUCKETS.findIndex((b) => hoursOpen <= b.maxHours);
  return index === -1 ? AGING_BUCKETS.length - 1 : index;
}

/** Distribui todos os chamados ainda abertos por tempo total desde a criação. */
export function buildBacklogAging(tickets: Ticket[], now: Date = new Date()): AgingBucket[] {
  const buckets = AGING_BUCKETS.map((b) => ({ label: b.label, count: 0 }));

  for (const ticket of tickets) {
    if (TERMINAL_STATUSES.has(ticket.status)) continue;
    if (!ticket.createdAt) continue;

    const hoursOpen = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    buckets[agingBucketIndexFor(hoursOpen)].count++;
  }

  return buckets;
}

/** Backlog em aberto cruzado por agente — mesmas faixas do aging geral, mas dizendo de quem é cada uma. */
export function buildAgentBacklog(tickets: Ticket[], now: Date = new Date()): AgentBacklogRow[] {
  const byAgent = new Map<string, number[]>();

  for (const ticket of tickets) {
    if (TERMINAL_STATUSES.has(ticket.status)) continue;
    if (!ticket.createdAt) continue;

    const hoursOpen = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    const bucketIndex = agingBucketIndexFor(hoursOpen);

    const buckets = byAgent.get(ticket.agent) ?? new Array(AGING_BUCKETS.length).fill(0);
    buckets[bucketIndex]++;
    byAgent.set(ticket.agent, buckets);
  }

  return Array.from(byAgent.entries())
    .map(([agent, buckets]) => ({ agent, total: buckets.reduce((sum, c) => sum + c, 0), buckets }))
    .sort((a, b) => b.total - a.total);
}

/** Chamados em aberto que caem numa faixa de aging específica — usado pro drill-down do gráfico. */
export function getTicketsInAgingBucket(tickets: Ticket[], bucketLabel: string, now: Date = new Date()): Ticket[] {
  const bucketIndex = AGING_BUCKETS.findIndex((b) => b.label === bucketLabel);
  if (bucketIndex === -1) return [];

  return tickets.filter((ticket) => {
    if (TERMINAL_STATUSES.has(ticket.status)) return false;
    if (!ticket.createdAt) return false;
    const hoursOpen = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    return agingBucketIndexFor(hoursOpen) === bucketIndex;
  });
}
