import type { Shipment } from "@/lib/types/shipment";
import type { DelayedShipment } from "./types";

/**
 * Horas de atraso, ou `null` se não dá pra medir. Só calcula quando existe um marco de tempo real
 * pra comparar com o prazo: "Em trânsito" usa agora; "Entregue" usa a data de entrega. Para
 * Insucesso/Avariado/Extraviado/Devolvido sem data de entrega, não inventamos uma data de
 * referência — o envio já aparece na lista de Ocorrências pelo status, só não teria um número de
 * atraso confiável aqui.
 */
export function getDelayHours(shipment: Shipment, now: Date = new Date()): number | null {
  let referenceEnd: Date | null = null;

  if (shipment.status === "Em trânsito") {
    referenceEnd = now;
  } else if (shipment.status === "Entregue" && shipment.deliveredAt) {
    referenceEnd = shipment.deliveredAt;
  } else if (shipment.deliveredAt) {
    referenceEnd = shipment.deliveredAt;
  }

  if (!referenceEnd) return null;

  const delayHours = (referenceEnd.getTime() - shipment.dueAt.getTime()) / (1000 * 60 * 60);
  return delayHours > 0 ? delayHours : null;
}

export function buildDelayedList(shipments: Shipment[], now: Date = new Date()): DelayedShipment[] {
  const result: DelayedShipment[] = [];

  for (const shipment of shipments) {
    const delayHours = getDelayHours(shipment, now);
    if (delayHours === null) continue;

    result.push({
      id: shipment.id,
      carrier: shipment.carrier,
      region: shipment.region,
      status: shipment.status,
      delayHours,
      dueAt: shipment.dueAt,
    });
  }

  return result.sort((a, b) => b.delayHours - a.delayHours);
}
