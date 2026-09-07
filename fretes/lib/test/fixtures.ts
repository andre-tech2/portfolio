import type { Shipment } from "@/lib/types/shipment";

let counter = 0;

/** Envio com valores neutros por padrão — cada teste sobrescreve só o que importa pro cenário. */
export function makeShipment(overrides: Partial<Shipment> = {}): Shipment {
  counter += 1;
  return {
    id: `E-${counter}`,
    carrier: "Transportadora A",
    region: "SP",
    status: "Em trânsito",
    shippedAt: new Date("2026-01-01T00:00:00Z"),
    dueAt: new Date("2026-01-05T00:00:00Z"),
    deliveredAt: null,
    occurrenceReason: null,
    freightCost: 50,
    weightKg: 2,
    customerCity: null,
    ...overrides,
  };
}
