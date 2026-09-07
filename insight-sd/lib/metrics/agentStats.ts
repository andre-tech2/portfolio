import { CLOSED_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import { average } from "./topN";
import type { AgentStat, OverdueTicket } from "./types";

export function buildAgentStats(tickets: Ticket[], overdueTickets: OverdueTicket[]): AgentStat[] {
  const byAgent = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const list = byAgent.get(ticket.agent) ?? [];
    list.push(ticket);
    byAgent.set(ticket.agent, list);
  }

  const overdueByAgent = new Map<string, number>();
  const overdueExternalByAgent = new Map<string, number>();
  for (const overdue of overdueTickets) {
    overdueByAgent.set(overdue.agent, (overdueByAgent.get(overdue.agent) ?? 0) + 1);
    if (overdue.isExternalBlock) {
      overdueExternalByAgent.set(overdue.agent, (overdueExternalByAgent.get(overdue.agent) ?? 0) + 1);
    }
  }

  const stats: AgentStat[] = [];
  for (const [agent, agentTickets] of byAgent.entries()) {
    const resolutionHours = agentTickets
      .map((t) => t.resolutionHours)
      .filter((h): h is number => h !== null);
    const firstResponseHours = agentTickets
      .map((t) => t.firstResponseHours)
      .filter((h): h is number => h !== null);

    const knownSla = agentTickets.filter((t) => t.resolutionSlaStatus !== null);
    const withinSla = knownSla.filter((t) => t.resolutionSlaStatus === "Within SLA").length;
    const knownFirstResponseSla = agentTickets.filter((t) => t.firstResponseSlaStatus !== null);
    const withinFirstResponseSla = knownFirstResponseSla.filter(
      (t) => t.firstResponseSlaStatus === "Within SLA"
    ).length;
    const satisfactionScores = agentTickets
      .map((t) => t.satisfaction)
      .filter((s): s is number => s !== null);
    const closedCount = agentTickets.filter((t) => CLOSED_STATUSES.has(t.status)).length;

    stats.push({
      agent,
      volume: agentTickets.length,
      avgResolutionHours: average(resolutionHours),
      avgFirstResponseHours: average(firstResponseHours),
      slaPercentage: knownSla.length > 0 ? (withinSla / knownSla.length) * 100 : null,
      firstResponseSlaPercentage:
        knownFirstResponseSla.length > 0 ? (withinFirstResponseSla / knownFirstResponseSla.length) * 100 : null,
      overdueCount: overdueByAgent.get(agent) ?? 0,
      overdueExternalCount: overdueExternalByAgent.get(agent) ?? 0,
      avgSatisfaction: average(satisfactionScores),
      closedCount,
      closedPercentage: agentTickets.length > 0 ? (closedCount / agentTickets.length) * 100 : null,
    });
  }

  return stats.sort((a, b) => b.volume - a.volume);
}
