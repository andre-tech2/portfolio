import { describe, it, expect } from "vitest";
import { buildOccurrences } from "./occurrences";
import { makeShipment } from "@/lib/test/fixtures";

describe("buildOccurrences", () => {
  it("ignora envios sem problema (em trânsito ou entregue)", () => {
    const shipments = [makeShipment({ status: "Em trânsito" }), makeShipment({ status: "Entregue" })];
    expect(buildOccurrences(shipments)).toEqual([]);
  });

  it("inclui envios com status de problema e usa o motivo informado", () => {
    const shipment = makeShipment({
      status: "Avariado",
      occurrenceReason: "Caixa amassada no transporte",
    });
    const [result] = buildOccurrences([shipment]);
    expect(result.reason).toBe("Caixa amassada no transporte");
    expect(result.status).toBe("Avariado");
  });

  it("usa um texto padrão quando o motivo não foi informado", () => {
    const shipment = makeShipment({ status: "Extraviado", occurrenceReason: null });
    const [result] = buildOccurrences([shipment]);
    expect(result.reason).toBe("Motivo não informado");
  });

  it("ordena da ocorrência mais recente para a mais antiga", () => {
    const antiga = makeShipment({
      id: "E-antiga",
      status: "Avariado",
      deliveredAt: new Date("2026-01-01T00:00:00Z"),
    });
    const recente = makeShipment({
      id: "E-recente",
      status: "Avariado",
      deliveredAt: new Date("2026-01-05T00:00:00Z"),
    });
    const result = buildOccurrences([antiga, recente]);
    expect(result.map((r) => r.id)).toEqual(["E-recente", "E-antiga"]);
  });

  it("usa o prazo previsto como data da ocorrência quando não há data de entrega (ex: extravio)", () => {
    const dueAt = new Date("2026-01-05T00:00:00Z");
    const shipment = makeShipment({ status: "Extraviado", deliveredAt: null, dueAt });
    const [result] = buildOccurrences([shipment]);
    expect(result.occurredAt).toEqual(dueAt);
  });
});
