import { PROBLEM_STATUSES } from "@/lib/types/shipment";
import type { Shipment } from "@/lib/types/shipment";
import type { OccurrenceShipment } from "./types";

/**
 * "Ocorrida em" usa a data de entrega quando existe (ex: chegou avariado) e cai pro prazo previsto
 * quando o envio nunca chegou (ex: extraviado) — sempre a melhor data disponível pra ordenar a
 * lista do mais recente pro mais antigo.
 */
export function buildOccurrences(shipments: Shipment[]): OccurrenceShipment[] {
  const result: OccurrenceShipment[] = [];

  for (const shipment of shipments) {
    if (!PROBLEM_STATUSES.has(shipment.status)) continue;

    result.push({
      id: shipment.id,
      carrier: shipment.carrier,
      region: shipment.region,
      status: shipment.status,
      reason: shipment.occurrenceReason ?? "Motivo não informado",
      occurredAt: shipment.deliveredAt ?? shipment.dueAt,
      freightCost: shipment.freightCost,
    });
  }

  return result.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}
