import { describe, it, expect } from "vitest";
import { buildAgentHealthScores } from "./healthScore";
import type { AgentStat } from "./types";

function makeAgentStat(overrides: Partial<AgentStat> = {}): AgentStat {
  return {
    agent: "Ana",
    volume: 10,
    avgResolutionHours: 5,
    avgFirstResponseHours: 1,
    slaPercentage: 100,
    firstResponseSlaPercentage: 100,
    overdueCount: 0,
    overdueExternalCount: 0,
    avgSatisfaction: 5,
    closedCount: 10,
    closedPercentage: 100,
    ...overrides,
  };
}

describe("buildAgentHealthScores", () => {
  it("dá nota máxima pra um agente com 100% de SLA, CSAT 5 e zero atraso", () => {
    const [result] = buildAgentHealthScores([makeAgentStat()]);
    expect(result.score).toBe(100);
  });

  it("penaliza proporcionalmente atrasos e SLA abaixo de 100%", () => {
    const [result] = buildAgentHealthScores([
      makeAgentStat({ slaPercentage: 50, avgSatisfaction: null, volume: 10, overdueCount: 5 }),
    ]);
    // só SLA (peso 0.5) e atraso (peso 0.2) entram, pois não há CSAT: (50*0.5 + 50*0.2) / 0.7
    expect(result.score).toBe(50);
  });

  it("ignora um agente sem nenhum sinal disponível (sem SLA, CSAT ou volume)", () => {
    const result = buildAgentHealthScores([
      makeAgentStat({ slaPercentage: null, avgSatisfaction: null, volume: 0 }),
    ]);
    expect(result).toEqual([]);
  });

  it("ordena do maior score para o menor", () => {
    const result = buildAgentHealthScores([
      makeAgentStat({ agent: "Baixo", slaPercentage: 40 }),
      makeAgentStat({ agent: "Alto", slaPercentage: 100 }),
    ]);
    expect(result.map((r) => r.agent)).toEqual(["Alto", "Baixo"]);
  });
});
