import type { Shipment } from "@/lib/types/shipment";
import { buildCarrierHealthScores } from "./carrierHealthScore";
import { buildCarrierStats } from "./carrierStats";
import { buildDelayedList } from "./delayed";
import { buildOccurrences } from "./occurrences";
import { buildOnTimeOverall } from "./onTime";
import { buildRegionStats } from "./regionStats";
import { average, topNBy } from "./topN";
import { buildTrend } from "./trends";
import type { MetricsContext } from "./types";

export function buildMetricsContext(shipments: Shipment[], now: Date = new Date()): MetricsContext {
  const delayedShipments = buildDelayedList(shipments, now);
  const carrierStats = buildCarrierStats(shipments, delayedShipments);
  const occurrences = buildOccurrences(shipments);

  const transitDays = shipments
    .filter((s) => s.status === "Entregue" && s.deliveredAt)
    .map((s) => (s.deliveredAt!.getTime() - s.shippedAt.getTime()) / (1000 * 60 * 60 * 24));

  return {
    totalShipments: shipments.length,
    onTimeOverall: buildOnTimeOverall(shipments, now),
    avgTransitDays: average(transitDays),
    avgFreightCost: average(shipments.map((s) => s.freightCost)),
    inTransitCount: shipments.filter((s) => s.status === "Em trânsito").length,
    delayedShipments: delayedShipments.slice(0, 8),
    delayedTotalCount: delayedShipments.length,
    carrierStats,
    carrierHealthScores: buildCarrierHealthScores(carrierStats),
    regionStats: buildRegionStats(shipments),
    occurrences: occurrences.slice(0, 8),
    occurrenceTotalCount: occurrences.length,
    topOccurrenceReasons: topNBy(
      shipments.filter((s) => s.occurrenceReason !== null),
      (s) => s.occurrenceReason,
      5
    ),
    trend: buildTrend(shipments),
  };
}
