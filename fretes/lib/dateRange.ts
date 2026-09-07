import type { Shipment } from "@/lib/types/shipment";

export type DateRangePreset = "7d" | "14d" | "30d" | "60d" | "all";

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  "7d": "Últimos 7 dias",
  "14d": "Últimos 14 dias",
  "30d": "Últimos 30 dias",
  "60d": "Últimos 60 dias",
  all: "Tudo",
};

const PRESET_DAYS: Record<DateRangePreset, number | null> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "60d": 60,
  all: null,
};

/**
 * Filtra por data de envio (shippedAt) — o período se aplica ao app inteiro. `referenceDate` deve
 * ser o envio mais recente do dataset, não o relógio do sistema, pra "últimos 7 dias" nunca
 * esvaziar o dashboard por causa de um fuso ou de um dado que não é gerado exatamente "agora".
 */
export function filterShipmentsByRange(
  shipments: Shipment[],
  preset: DateRangePreset,
  referenceDate: Date | null
): Shipment[] {
  const days = PRESET_DAYS[preset];
  if (days === null) return shipments;
  if (!referenceDate) return shipments;

  const cutoff = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);
  return shipments.filter((s) => s.shippedAt >= cutoff);
}
