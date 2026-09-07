import type { AgentHealthScore, AgentStat } from "./types";

const WEIGHT_SLA = 0.5;
const WEIGHT_CSAT = 0.3;
const WEIGHT_OVERDUE = 0.2;

/**
 * Índice de saúde por agente — combina os 3 sinais mais usados no app num único número,
 * pra leitura rápida em reunião. Métricas sem dados suficientes (ex: agente sem respostas de
 * CSAT) são excluídas do cálculo e o peso é redistribuído entre as que existem.
 */
export function buildAgentHealthScores(agentStats: AgentStat[]): AgentHealthScore[] {
  const result: AgentHealthScore[] = [];

  for (const stat of agentStats) {
    const components: { value: number; weight: number }[] = [];
    if (stat.slaPercentage !== null) components.push({ value: stat.slaPercentage, weight: WEIGHT_SLA });
    if (stat.avgSatisfaction !== null) {
      components.push({ value: (stat.avgSatisfaction / 5) * 100, weight: WEIGHT_CSAT });
    }
    if (stat.volume > 0) {
      const overdueRatio = stat.overdueCount / stat.volume;
      components.push({ value: Math.max(0, 100 - overdueRatio * 100), weight: WEIGHT_OVERDUE });
    }

    if (components.length === 0) continue;
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const score = components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight;
    result.push({ agent: stat.agent, score: Math.round(score) });
  }

  return result.sort((a, b) => b.score - a.score);
}
