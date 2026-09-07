import { TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { Ticket } from "@/lib/types/ticket";
import { buildAgentStats } from "./agentStats";
import { buildAgentStatusMatrix } from "./agentStatusMatrix";
import { STALE_THRESHOLD_HOURS, buildAgentBacklog, buildBacklogAging, buildStaleTickets } from "./backlogAging";
import { buildAgentHealthScores } from "./healthScore";
import { buildHeatmap } from "./heatmap";
import { buildOverdueList } from "./overdue";
import { buildPriorityStatusMatrix } from "./priorityStatusMatrix";
import { buildResolutionByPriority } from "./resolutionByPriority";
import { buildCsatResponseRate, buildOverallSatisfaction, buildSatisfactionByCategory } from "./satisfaction";
import { buildSlaOverall } from "./slaOverall";
import { buildStatusBreakdown } from "./statusBreakdown";
import { average, topNBy } from "./topN";
import { buildTrend } from "./trends";
import type { MetricsContext } from "./types";
import { buildUnassignedTickets } from "./unassigned";
import { buildVipAtRisk } from "./vipRisk";

export function buildMetricsContext(tickets: Ticket[], now: Date = new Date()): MetricsContext {
  const overdueTickets = buildOverdueList(tickets, now);
  const agentStats = buildAgentStats(tickets, overdueTickets);

  const resolutionHours = tickets.map((t) => t.resolutionHours).filter((h): h is number => h !== null);
  const firstResponseHours = tickets
    .map((t) => t.firstResponseHours)
    .filter((h): h is number => h !== null);

  const staleAll = buildStaleTickets(tickets, now);
  const staleAboveThreshold = staleAll.filter((t) => t.hoursSinceUpdate >= STALE_THRESHOLD_HOURS);

  const vipAtRisk = buildVipAtRisk(tickets, now);
  const unassigned = buildUnassignedTickets(tickets, now);

  return {
    totalTickets: tickets.length,
    topSubjects: topNBy(tickets, (t) => t.subject ?? t.item, 5),
    overdueTickets: overdueTickets.slice(0, 5),
    overdueTotalCount: overdueTickets.length,
    overdueExternalCount: overdueTickets.filter((t) => t.isExternalBlock).length,
    agentStats,
    slaOverall: buildSlaOverall(tickets),
    avgResolutionHours: average(resolutionHours),
    avgFirstResponseHours: average(firstResponseHours),
    topDepartments: topNBy(tickets, (t) => t.department, 5),
    topCategories: topNBy(tickets, (t) => t.category, 5),
    teamTrend: buildTrend(tickets),
    heatmap: buildHeatmap(tickets),
    staleTickets: staleAboveThreshold.slice(0, 8),
    staleTotalCount: staleAboveThreshold.length,
    vipAtRiskTickets: vipAtRisk.slice(0, 8),
    vipTotalCount: vipAtRisk.length,
    unassignedTickets: unassigned.slice(0, 8),
    unassignedTotalCount: unassigned.length,
    avgSatisfaction: buildOverallSatisfaction(tickets),
    csatResponseRate: buildCsatResponseRate(tickets),
    satisfactionByCategory: buildSatisfactionByCategory(tickets),
    openTicketsCount: tickets.filter((t) => !TERMINAL_STATUSES.has(t.status)).length,
    backlogAging: buildBacklogAging(tickets, now),
    agentBacklog: buildAgentBacklog(tickets, now),
    resolutionByPriority: buildResolutionByPriority(tickets),
    priorityStatusMatrix: buildPriorityStatusMatrix(tickets),
    agentStatusMatrix: buildAgentStatusMatrix(tickets),
    statusBreakdown: buildStatusBreakdown(tickets),
    agentHealthScores: buildAgentHealthScores(agentStats),
  };
}
