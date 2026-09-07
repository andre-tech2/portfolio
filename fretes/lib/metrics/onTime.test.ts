import { describe, it, expect } from "vitest";
import { buildOnTimeOverall } from "./onTime";
import { makeShipment } from "@/lib/test/fixtures";

const NOW = new Date("2026-01-10T00:00:00Z");

describe("buildOnTimeOverall", () => {
  it("conta como no prazo um envio entregue até a data prevista", () => {
    const shipment = makeShipment({
      status: "Entregue",
      dueAt: new Date("2026-01-05T00:00:00Z"),
      deliveredAt: new Date("2026-01-04T00:00:00Z"),
    });
    const result = buildOnTimeOverall([shipment], NOW);
    expect(result.onTime).toBe(1);
    expect(result.percentage).toBe(100);
  });

  it("conta como atraso um envio entregue depois da data prevista", () => {
    const shipment = makeShipment({
      status: "Entregue",
      dueAt: new Date("2026-01-05T00:00:00Z"),
      deliveredAt: new Date("2026-01-06T00:00:00Z"),
    });
    const result = buildOnTimeOverall([shipment], NOW);
    expect(result.late).toBe(1);
    expect(result.percentage).toBe(0);
  });

  it("conta status de problema (insucesso/avaria/extravio/devolução) como atraso, mesmo sem data de entrega", () => {
    const shipment = makeShipment({ status: "Extraviado", deliveredAt: null });
    const result = buildOnTimeOverall([shipment], NOW);
    expect(result.late).toBe(1);
  });

  it("não classifica um envio ainda em trânsito e dentro do prazo (unknown, fora do percentual)", () => {
    const shipment = makeShipment({ status: "Em trânsito", dueAt: new Date("2026-02-01T00:00:00Z") });
    const result = buildOnTimeOverall([shipment], NOW);
    expect(result.unknown).toBe(1);
    expect(result.percentage).toBeNull();
  });

  it("conta como atraso um envio ainda em trânsito que já passou do prazo", () => {
    const shipment = makeShipment({ status: "Em trânsito", dueAt: new Date("2026-01-01T00:00:00Z") });
    const result = buildOnTimeOverall([shipment], NOW);
    expect(result.late).toBe(1);
  });

  it("retorna percentual null quando não há nenhum envio classificável", () => {
    const shipment = makeShipment({ status: "Em trânsito", dueAt: new Date("2026-02-01T00:00:00Z") });
    expect(buildOnTimeOverall([shipment], NOW).percentage).toBeNull();
  });
});
