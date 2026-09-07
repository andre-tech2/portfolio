import { describe, it, expect } from "vitest";
import { buildSlaOverall } from "./slaOverall";
import { makeTicket } from "@/lib/test/fixtures";

describe("buildSlaOverall", () => {
  it("calcula o percentual dentro do SLA separadamente para 1ª resposta e resolução", () => {
    const tickets = [
      makeTicket({ firstResponseSlaStatus: "Within SLA", resolutionSlaStatus: "SLA Violated" }),
      makeTicket({ firstResponseSlaStatus: "Within SLA", resolutionSlaStatus: "Within SLA" }),
      makeTicket({ firstResponseSlaStatus: "SLA Violated", resolutionSlaStatus: "Within SLA" }),
    ];

    const result = buildSlaOverall(tickets);

    expect(result.firstResponse.withinSla).toBe(2);
    expect(result.firstResponse.violated).toBe(1);
    expect(result.firstResponse.percentage).toBeCloseTo((2 / 3) * 100, 5);

    expect(result.resolution.withinSla).toBe(2);
    expect(result.resolution.violated).toBe(1);
    expect(result.resolution.percentage).toBeCloseTo((2 / 3) * 100, 5);
  });

  it("não conta status desconhecido (null) no percentual, só no total 'unknown'", () => {
    const tickets = [
      makeTicket({ firstResponseSlaStatus: "Within SLA" }),
      makeTicket({ firstResponseSlaStatus: null }),
    ];

    const result = buildSlaOverall(tickets);

    expect(result.firstResponse.unknown).toBe(1);
    expect(result.firstResponse.percentage).toBe(100);
  });

  it("retorna percentual null quando não há nenhum status conhecido", () => {
    const result = buildSlaOverall([makeTicket({ firstResponseSlaStatus: null, resolutionSlaStatus: null })]);
    expect(result.firstResponse.percentage).toBeNull();
    expect(result.resolution.percentage).toBeNull();
  });
});
