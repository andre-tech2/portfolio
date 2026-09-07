import type { CarrierHealthScore, CarrierStat } from "./types";

const WEIGHT_ON_TIME = 0.6;
const WEIGHT_OCCURRENCE_FREE = 0.4;

/**
 * Índice de saúde por transportadora — combina prazo e taxa de ocorrência num único número pra
 * leitura rápida em reunião. Quando falta um sinal (ex: transportadora só com envios ainda em
 * trânsito, sem % no prazo apurado ainda), o peso é redistribuído entre o que existe, em vez de
 * penalizar quem simplesmente não tem dado suficiente ainda.
 */
export function buildCarrierHealthScores(carrierStats: CarrierStat[]): CarrierHealthScore[] {
  const result: CarrierHealthScore[] = [];

  for (const stat of carrierStats) {
    const components: { value: number; weight: number }[] = [];
    if (stat.onTimePercentage !== null) components.push({ value: stat.onTimePercentage, weight: WEIGHT_ON_TIME });
    if (stat.volume > 0 && stat.occurrencePercentage !== null) {
      components.push({ value: 100 - stat.occurrencePercentage, weight: WEIGHT_OCCURRENCE_FREE });
    }

    if (components.length === 0) continue;
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const score = components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight;
    result.push({ carrier: stat.carrier, score: Math.round(score) });
  }

  return result.sort((a, b) => b.score - a.score);
}
