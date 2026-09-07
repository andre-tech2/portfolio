import { describe, it, expect } from "vitest";
import { getDelayHours, buildDelayedList } from "./delayed";
import { makeShipment } from "@/lib/test/fixtures";

const NOW = new Date("2026-01-10T12:00:00Z");
const DUE = new Date("2026-01-08T12:00:00Z"); // 48h antes de NOW

describe("getDelayHours", () => {
  it("calcula o atraso de um envio entregue depois do prazo", () => {
    const shipment = makeShipment({
      status: "Entregue",
      dueAt: DUE,
      deliveredAt: new Date("2026-01-09T12:00:00Z"), // 24h depois do prazo
    });
    expect(getDelayHours(shipment, NOW)).toBeCloseTo(24, 5);
  });

  it("retorna null para um envio entregue dentro do prazo", () => {
    const shipment = makeShipment({
      status: "Entregue",
      dueAt: new Date("2026-01-12T00:00:00Z"),
      deliveredAt: new Date("2026-01-10T00:00:00Z"),
    });
    expect(getDelayHours(shipment, NOW)).toBeNull();
  });

  it("calcula o atraso de um envio ainda em trânsito usando 'agora' como referência", () => {
    const shipment = makeShipment({ status: "Em trânsito", dueAt: DUE, deliveredAt: null });
    expect(getDelayHours(shipment, NOW)).toBeCloseTo(48, 5);
  });

  it("retorna null para um envio em trânsito ainda dentro do prazo", () => {
    const shipment = makeShipment({ status: "Em trânsito", dueAt: new Date("2026-02-01T00:00:00Z") });
    expect(getDelayHours(shipment, NOW)).toBeNull();
  });

  it("retorna null para um status de problema sem data de entrega (não inventa referência)", () => {
    const shipment = makeShipment({ status: "Extraviado", dueAt: DUE, deliveredAt: null });
    expect(getDelayHours(shipment, NOW)).toBeNull();
  });
});

describe("buildDelayedList", () => {
  it("ordena do mais atrasado para o menos atrasado, ignorando quem não tem atraso mensurável", () => {
    const poucoAtrasado = makeShipment({
      id: "E-pouco",
      status: "Em trânsito",
      dueAt: new Date("2026-01-10T00:00:00Z"),
    });
    const muitoAtrasado = makeShipment({ id: "E-muito", status: "Em trânsito", dueAt: DUE });
    const semAtraso = makeShipment({ id: "E-em-dia", status: "Em trânsito", dueAt: new Date("2026-02-01T00:00:00Z") });

    const result = buildDelayedList([poucoAtrasado, muitoAtrasado, semAtraso], NOW);

    expect(result.map((s) => s.id)).toEqual(["E-muito", "E-pouco"]);
  });
});
