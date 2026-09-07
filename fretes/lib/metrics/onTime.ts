import type { Shipment } from "@/lib/types/shipment";
import type { OnTimeOverall } from "./types";

/**
 * "No prazo" só conta pra quem já chegou (Entregue) e chegou até a data prevista. Qualquer outro
 * status terminal (Insucesso, Avariado, Extraviado, Devolvido) conta como atraso pro cálculo do
 * percentual, mesmo sem uma data de entrega — o cliente não recebeu no prazo de qualquer forma.
 * Envios ainda "Em trânsito" e dentro do prazo ficam fora do percentual (unknown) — não dá pra
 * julgar um envio que ainda pode chegar bem.
 */
export function buildOnTimeOverall(shipments: Shipment[], now: Date = new Date()): OnTimeOverall {
  let onTime = 0;
  let late = 0;
  let unknown = 0;

  for (const shipment of shipments) {
    if (shipment.status === "Em trânsito") {
      if (shipment.dueAt.getTime() < now.getTime()) late++;
      else unknown++;
      continue;
    }

    if (shipment.status === "Entregue") {
      if (shipment.deliveredAt && shipment.deliveredAt.getTime() <= shipment.dueAt.getTime()) onTime++;
      else late++;
      continue;
    }

    // Insucesso, Avariado, Extraviado, Devolvido — não chegou como deveria.
    late++;
  }

  const known = onTime + late;
  const percentage = known > 0 ? (onTime / known) * 100 : null;
  return { onTime, late, unknown, percentage };
}
