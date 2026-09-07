import { PROBLEM_STATUSES } from "@/lib/types/shipment";
import type { Shipment } from "@/lib/types/shipment";
import { buildOnTimeOverall } from "./onTime";
import { average } from "./topN";
import type { CarrierStat, DelayedShipment } from "./types";

export function buildCarrierStats(shipments: Shipment[], delayedShipments: DelayedShipment[]): CarrierStat[] {
  const byCarrier = new Map<string, Shipment[]>();
  for (const shipment of shipments) {
    const list = byCarrier.get(shipment.carrier) ?? [];
    list.push(shipment);
    byCarrier.set(shipment.carrier, list);
  }

  const delayedByCarrier = new Map<string, number>();
  for (const delayed of delayedShipments) {
    delayedByCarrier.set(delayed.carrier, (delayedByCarrier.get(delayed.carrier) ?? 0) + 1);
  }

  const stats: CarrierStat[] = [];
  for (const [carrier, carrierShipments] of byCarrier.entries()) {
    const transitDays = carrierShipments
      .filter((s) => s.status === "Entregue" && s.deliveredAt)
      .map((s) => (s.deliveredAt!.getTime() - s.shippedAt.getTime()) / (1000 * 60 * 60 * 24));

    const occurrenceCount = carrierShipments.filter((s) => PROBLEM_STATUSES.has(s.status)).length;

    stats.push({
      carrier,
      volume: carrierShipments.length,
      onTimePercentage: buildOnTimeOverall(carrierShipments).percentage,
      avgTransitDays: average(transitDays),
      occurrenceCount,
      occurrencePercentage: carrierShipments.length > 0 ? (occurrenceCount / carrierShipments.length) * 100 : null,
      avgFreightCost: average(carrierShipments.map((s) => s.freightCost)),
      delayedCount: delayedByCarrier.get(carrier) ?? 0,
    });
  }

  return stats.sort((a, b) => b.volume - a.volume);
}
