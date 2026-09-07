import { describe, it, expect } from "vitest";
import { buildCarrierStats } from "./carrierStats";
import { buildDelayedList } from "./delayed";
import { makeShipment } from "@/lib/test/fixtures";

const NOW = new Date("2026-01-10T00:00:00Z");

describe("buildCarrierStats", () => {
  it("agrupa por transportadora e calcula volume, % no prazo, ocorrências e custo médio", () => {
    const shipments = [
      makeShipment({
        carrier: "Rápido Log",
        status: "Entregue",
        shippedAt: new Date("2026-01-01T00:00:00Z"),
        dueAt: new Date("2026-01-05T00:00:00Z"),
        deliveredAt: new Date("2026-01-03T00:00:00Z"),
        freightCost: 30,
      }),
      makeShipment({
        carrier: "Rápido Log",
        status: "Avariado",
        occurrenceReason: "Avaria no transporte",
        deliveredAt: new Date("2026-01-06T00:00:00Z"),
        dueAt: new Date("2026-01-05T00:00:00Z"),
        freightCost: 50,
      }),
    ];

    const delayed = buildDelayedList(shipments, NOW);
    const [stat] = buildCarrierStats(shipments, delayed);

    expect(stat.carrier).toBe("Rápido Log");
    expect(stat.volume).toBe(2);
    expect(stat.occurrenceCount).toBe(1);
    expect(stat.occurrencePercentage).toBe(50);
    expect(stat.avgFreightCost).toBe(40);
    expect(stat.avgTransitDays).toBe(2); // só o entregue conta pro tempo de trânsito
  });

  it("ordena as transportadoras da maior para a menor volume", () => {
    const shipments = [
      makeShipment({ carrier: "Pequena" }),
      makeShipment({ carrier: "Grande" }),
      makeShipment({ carrier: "Grande" }),
    ];
    const result = buildCarrierStats(shipments, []);
    expect(result.map((s) => s.carrier)).toEqual(["Grande", "Pequena"]);
  });
});
