import { describe, it, expect } from "vitest";
import { buildCarrierHealthScores } from "./carrierHealthScore";
import type { CarrierStat } from "./types";

function makeCarrierStat(overrides: Partial<CarrierStat> = {}): CarrierStat {
  return {
    carrier: "Transportadora A",
    volume: 10,
    onTimePercentage: 100,
    avgTransitDays: 3,
    occurrenceCount: 0,
    occurrencePercentage: 0,
    avgFreightCost: 40,
    delayedCount: 0,
    ...overrides,
  };
}

describe("buildCarrierHealthScores", () => {
  it("dá nota máxima pra transportadora com 100% no prazo e zero ocorrência", () => {
    const [result] = buildCarrierHealthScores([makeCarrierStat()]);
    expect(result.score).toBe(100);
  });

  it("penaliza proporcionalmente % no prazo baixo e taxa de ocorrência alta", () => {
    const [result] = buildCarrierHealthScores([
      makeCarrierStat({ onTimePercentage: 50, occurrencePercentage: 50 }),
    ]);
    // 50*0.6 (no prazo) + (100-50)*0.4 (ocorrência) = 50
    expect(result.score).toBe(50);
  });

  it("ignora transportadora sem nenhum sinal disponível", () => {
    const result = buildCarrierHealthScores([
      makeCarrierStat({ onTimePercentage: null, occurrencePercentage: null }),
    ]);
    expect(result).toEqual([]);
  });

  it("redistribui o peso quando falta o % no prazo (ex: só envios ainda em trânsito)", () => {
    const [result] = buildCarrierHealthScores([
      makeCarrierStat({ onTimePercentage: null, occurrencePercentage: 0 }),
    ]);
    expect(result.score).toBe(100);
  });

  it("ordena do maior score para o menor", () => {
    const result = buildCarrierHealthScores([
      makeCarrierStat({ carrier: "Baixo", onTimePercentage: 40 }),
      makeCarrierStat({ carrier: "Alto", onTimePercentage: 100 }),
    ]);
    expect(result.map((r) => r.carrier)).toEqual(["Alto", "Baixo"]);
  });
});
