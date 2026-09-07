import type { Shipment } from "@/lib/types/shipment";
import { buildOnTimeOverall } from "./onTime";
import type { TrendPoint } from "./types";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Agrupa por dia de envio (shippedAt) — o volume e o % no prazo daquele dia específico. */
export function buildTrend(shipments: Shipment[]): TrendPoint[] {
  const byDay = new Map<string, Shipment[]>();
  for (const shipment of shipments) {
    const key = dayKey(shipment.shippedAt);
    const list = byDay.get(key) ?? [];
    list.push(shipment);
    byDay.set(key, list);
  }

  const points: TrendPoint[] = Array.from(byDay.values()).map((dayShipments) => {
    const periodStart = startOfDay(dayShipments[0].shippedAt);
    return {
      periodLabel: `${WEEKDAY_LABELS[periodStart.getDay()]} ${String(periodStart.getDate()).padStart(2, "0")}/${String(periodStart.getMonth() + 1).padStart(2, "0")}`,
      periodStart,
      count: dayShipments.length,
      onTimePercentage: buildOnTimeOverall(dayShipments).percentage,
    };
  });

  return points.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}
