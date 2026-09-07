import type { Shipment } from "@/lib/types/shipment";
import { buildOnTimeOverall } from "./onTime";
import { average } from "./topN";
import type { RegionStat } from "./types";

export function buildRegionStats(shipments: Shipment[]): RegionStat[] {
  const byRegion = new Map<string, Shipment[]>();
  for (const shipment of shipments) {
    const list = byRegion.get(shipment.region) ?? [];
    list.push(shipment);
    byRegion.set(shipment.region, list);
  }

  const stats: RegionStat[] = [];
  for (const [region, regionShipments] of byRegion.entries()) {
    const transitDays = regionShipments
      .filter((s) => s.status === "Entregue" && s.deliveredAt)
      .map((s) => (s.deliveredAt!.getTime() - s.shippedAt.getTime()) / (1000 * 60 * 60 * 24));

    stats.push({
      region,
      volume: regionShipments.length,
      onTimePercentage: buildOnTimeOverall(regionShipments).percentage,
      avgTransitDays: average(transitDays),
      avgFreightCost: average(regionShipments.map((s) => s.freightCost)),
    });
  }

  return stats.sort((a, b) => b.volume - a.volume);
}
