import type { Shipment } from "@/lib/types/shipment";
import { buildOccurrences } from "./occurrences";
import type { CarrierStat, MetricsContext, OccurrenceShipment, Recommendation } from "./types";

const RULES_CONFIG = {
  minSampleSize: 5,
  carrierOnTimeGapPoints: 10,
  carrierOccurrenceGapPoints: 8,
  overallDelayedWarning: 10, // % do total
  regionCostRatio: 1.3,
  recentSpikeMinCount: 3,
  recentSpikeRatio: 1.5,
};

function ruleCarrierOnTimeGap(carrierStats: CarrierStat[], shipments: Shipment[]): Recommendation[] {
  const eligible = carrierStats.filter((c) => c.onTimePercentage !== null && c.volume >= RULES_CONFIG.minSampleSize);
  if (eligible.length === 0) return [];

  const avgOnTime = eligible.reduce((sum, c) => sum + (c.onTimePercentage as number), 0) / eligible.length;

  const results: Recommendation[] = [];
  for (const carrier of eligible) {
    const gap = avgOnTime - (carrier.onTimePercentage as number);
    if (gap > RULES_CONFIG.carrierOnTimeGapPoints) {
      results.push({
        id: `on-time-gap-${carrier.carrier}`,
        severity: gap > RULES_CONFIG.carrierOnTimeGapPoints * 2 ? "critical" : "warning",
        title: `${carrier.carrier} com % no prazo abaixo da média`,
        description: `${carrier.onTimePercentage!.toFixed(0)}% no prazo, ${gap.toFixed(0)} pontos percentuais abaixo da média das transportadoras (${avgOnTime.toFixed(0)}%). Vale uma conversa com a transportadora ou revisão do prazo prometido nessa rota.`,
        impactCount: carrier.volume,
        relatedShipments: shipments.filter((s) => s.carrier === carrier.carrier),
      });
    }
  }
  return results;
}

function ruleCarrierHighOccurrence(carrierStats: CarrierStat[], shipments: Shipment[]): Recommendation[] {
  const eligible = carrierStats.filter(
    (c) => c.occurrencePercentage !== null && c.volume >= RULES_CONFIG.minSampleSize
  );
  if (eligible.length === 0) return [];

  const avgOccurrence = eligible.reduce((sum, c) => sum + (c.occurrencePercentage as number), 0) / eligible.length;

  const results: Recommendation[] = [];
  for (const carrier of eligible) {
    const gap = (carrier.occurrencePercentage as number) - avgOccurrence;
    if (gap > RULES_CONFIG.carrierOccurrenceGapPoints) {
      results.push({
        id: `occurrence-gap-${carrier.carrier}`,
        severity: gap > RULES_CONFIG.carrierOccurrenceGapPoints * 2 ? "critical" : "warning",
        title: `${carrier.carrier} com taxa de ocorrência acima da média`,
        description: `${carrier.occurrenceCount} ocorrências em ${carrier.volume} envios (${carrier.occurrencePercentage!.toFixed(0)}%), ${gap.toFixed(0)} pontos acima da média das transportadoras (${avgOccurrence.toFixed(0)}%).`,
        impactCount: carrier.occurrenceCount,
        relatedShipments: shipments.filter((s) => s.carrier === carrier.carrier),
      });
    }
  }
  return results;
}

function ruleOverallDelayed(ctx: MetricsContext, shipments: Shipment[]): Recommendation[] {
  if (ctx.totalShipments === 0) return [];
  const pct = (ctx.delayedTotalCount / ctx.totalShipments) * 100;
  if (pct < RULES_CONFIG.overallDelayedWarning) return [];

  return [
    {
      id: "overall-delayed",
      severity: pct >= RULES_CONFIG.overallDelayedWarning * 2 ? "critical" : "warning",
      title: "Volume geral de atraso está alto",
      description: `${ctx.delayedTotalCount} de ${ctx.totalShipments} envios (${pct.toFixed(0)}%) estão ou ficaram fora do prazo prometido. Vale revisar prazos combinados com as transportadoras ou a capacidade delas na época.`,
      impactCount: ctx.delayedTotalCount,
      relatedShipments: shipments,
    },
  ];
}

function ruleRegionCostOutlier(ctx: MetricsContext): Recommendation[] {
  const withCost = ctx.regionStats.filter((r) => r.avgFreightCost !== null && r.volume >= RULES_CONFIG.minSampleSize);
  if (withCost.length < 2 || ctx.avgFreightCost === null) return [];

  const results: Recommendation[] = [];
  for (const region of withCost) {
    const ratio = (region.avgFreightCost as number) / (ctx.avgFreightCost as number);
    if (ratio >= RULES_CONFIG.regionCostRatio) {
      results.push({
        id: `region-cost-${region.region}`,
        severity: "info",
        title: `Frete pra ${region.region} está acima da média geral`,
        description: `Custo médio de R$ ${region.avgFreightCost!.toFixed(2)} por envio, ${ratio.toFixed(1)}x a média geral (R$ ${ctx.avgFreightCost!.toFixed(2)}). Pode valer cotar outra transportadora pra essa região.`,
        impactCount: region.volume,
      });
    }
  }
  return results;
}

function ruleRecentOccurrenceSpike(occurrences: OccurrenceShipment[]): Recommendation[] {
  if (occurrences.length < RULES_CONFIG.recentSpikeMinCount) return [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const lastWeek = occurrences.filter((o) => o.occurredAt >= sevenDaysAgo).length;
  const priorWeek = occurrences.filter((o) => o.occurredAt >= fourteenDaysAgo && o.occurredAt < sevenDaysAgo).length;

  if (lastWeek < RULES_CONFIG.recentSpikeMinCount) return [];
  if (priorWeek > 0 && lastWeek / priorWeek < RULES_CONFIG.recentSpikeRatio) return [];
  if (priorWeek === 0 && lastWeek < RULES_CONFIG.recentSpikeMinCount) return [];

  return [
    {
      id: "recent-occurrence-spike",
      severity: "warning",
      title: "Ocorrências subiram na última semana",
      description: `${lastWeek} ocorrências nos últimos 7 dias, contra ${priorWeek} nos 7 dias anteriores. Vale checar se é um problema pontual (ex: uma rota, uma transportadora) antes que vire padrão.`,
      impactCount: lastWeek,
    },
  ];
}

const SEVERITY_WEIGHT: Record<Recommendation["severity"], number> = { critical: 3, warning: 2, info: 1 };

export function buildRecommendations(ctx: MetricsContext, shipments: Shipment[]): Recommendation[] {
  const all = [
    ...ruleCarrierOnTimeGap(ctx.carrierStats, shipments),
    ...ruleCarrierHighOccurrence(ctx.carrierStats, shipments),
    ...ruleOverallDelayed(ctx, shipments),
    ...ruleRegionCostOutlier(ctx),
    ...ruleRecentOccurrenceSpike(buildOccurrences(shipments)),
  ];

  return all
    .sort((a, b) => {
      const severityDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.impactCount - a.impactCount;
    })
    .slice(0, 20);
}
