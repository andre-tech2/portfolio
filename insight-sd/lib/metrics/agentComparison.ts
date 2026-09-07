import { average } from "./topN";
import type { AgentComparison, AgentStat } from "./types";

/**
 * Média da equipe = média entre todos os agentes (incluindo o selecionado) —
 * é a leitura mais natural de "a equipe" quando o próprio agente faz parte dela.
 */
export function buildAgentComparison(agentStats: AgentStat[], selectedAgent: string): AgentComparison | null {
  const agentStat = agentStats.find((a) => a.agent === selectedAgent);
  if (!agentStat) return null;

  const volumes = agentStats.map((a) => a.volume);
  const resolutionHours = agentStats
    .map((a) => a.avgResolutionHours)
    .filter((h): h is number => h !== null);
  const slaPercentages = agentStats
    .map((a) => a.slaPercentage)
    .filter((p): p is number => p !== null);
  const firstResponseSlaPercentages = agentStats
    .map((a) => a.firstResponseSlaPercentage)
    .filter((p): p is number => p !== null);
  const satisfactionScores = agentStats
    .map((a) => a.avgSatisfaction)
    .filter((s): s is number => s !== null);

  const closedCounts = agentStats.map((a) => a.closedCount);
  const overdueCounts = agentStats.map((a) => a.overdueCount);

  return {
    agent: selectedAgent,
    agentStat,
    teamAverage: {
      volume: average(volumes) ?? 0,
      avgResolutionHours: average(resolutionHours),
      slaPercentage: average(slaPercentages),
      firstResponseSlaPercentage: average(firstResponseSlaPercentages),
      closedCount: average(closedCounts) ?? 0,
      avgSatisfaction: average(satisfactionScores),
      overdueCount: average(overdueCounts) ?? 0,
    },
  };
}
