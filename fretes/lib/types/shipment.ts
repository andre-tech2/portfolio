export type ShipmentStatus = "Em trânsito" | "Entregue" | "Insucesso" | "Avariado" | "Extraviado" | "Devolvido";

/** Status finais — o envio não muda mais de estado a partir daqui. */
export const TERMINAL_STATUSES = new Set<ShipmentStatus>(["Entregue", "Insucesso", "Avariado", "Extraviado", "Devolvido"]);

/** Status que representam problema — usados na lista de Ocorrências e no cálculo de taxa de ocorrência. */
export const PROBLEM_STATUSES = new Set<ShipmentStatus>(["Insucesso", "Avariado", "Extraviado", "Devolvido"]);

export interface Shipment {
  id: string;
  carrier: string;
  region: string;
  status: ShipmentStatus;
  shippedAt: Date;
  dueAt: Date;
  deliveredAt: Date | null;
  /** Motivo do problema — obrigatório para status em PROBLEM_STATUSES, null nos demais. */
  occurrenceReason: string | null;
  freightCost: number;
  weightKg: number;
  customerCity: string | null;
}

export interface ImportMeta {
  importedAt: Date;
  shipmentCount: number;
}
