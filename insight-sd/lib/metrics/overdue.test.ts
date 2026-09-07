import { describe, it, expect } from "vitest";
import { getOverdueDelayHours, buildOverdueList } from "./overdue";
import { makeTicket } from "@/lib/test/fixtures";

const NOW = new Date("2026-01-10T12:00:00Z");
const DUE = new Date("2026-01-08T12:00:00Z"); // 48h antes de NOW

describe("getOverdueDelayHours", () => {
  it("retorna null quando o ticket não tem prazo (dueAt)", () => {
    const ticket = makeTicket({ dueAt: null, resolutionSlaStatus: "SLA Violated" });
    expect(getOverdueDelayHours(ticket, NOW)).toBeNull();
  });

  it("calcula o atraso de um ticket que violou o SLA e já foi resolvido", () => {
    const resolvedAt = new Date("2026-01-09T12:00:00Z"); // 24h depois do prazo
    const ticket = makeTicket({
      status: "Resolvido",
      dueAt: DUE,
      resolvedAt,
      resolutionSlaStatus: "SLA Violated",
    });
    expect(getOverdueDelayHours(ticket, NOW)).toBeCloseTo(24, 5);
  });

  it("conta como atrasado um ticket ainda aberto que já passou do prazo, mesmo sem violação de SLA marcada", () => {
    const ticket = makeTicket({ status: "Aberto", dueAt: DUE, resolutionSlaStatus: null });
    expect(getOverdueDelayHours(ticket, NOW)).toBeCloseTo(48, 5);
  });

  it("não conta como atrasado um ticket terminal sem violação de SLA (ex: Cancelado antes do prazo)", () => {
    const ticket = makeTicket({ status: "Cancelado", dueAt: DUE, resolutionSlaStatus: null });
    expect(getOverdueDelayHours(ticket, NOW)).toBeNull();
  });

  it("não conta como atrasado um ticket ainda dentro do prazo", () => {
    const dueNoFuturo = new Date("2026-01-12T12:00:00Z");
    const ticket = makeTicket({ status: "Aberto", dueAt: dueNoFuturo });
    expect(getOverdueDelayHours(ticket, NOW)).toBeNull();
  });
});

describe("buildOverdueList", () => {
  it("ordena do mais atrasado para o menos atrasado e marca bloqueio externo", () => {
    const poucoAtrasado = makeTicket({
      id: "T-pouco",
      status: "Aguardando transportadora",
      dueAt: new Date("2026-01-10T00:00:00Z"),
    });
    const muitoAtrasado = makeTicket({
      id: "T-muito",
      status: "Aberto",
      dueAt: DUE,
    });
    const semAtraso = makeTicket({ id: "T-em-dia", dueAt: new Date("2026-02-01T00:00:00Z") });

    const result = buildOverdueList([poucoAtrasado, muitoAtrasado, semAtraso], NOW);

    expect(result.map((t) => t.id)).toEqual(["T-muito", "T-pouco"]);
    expect(result.find((t) => t.id === "T-pouco")?.isExternalBlock).toBe(true);
    expect(result.find((t) => t.id === "T-muito")?.isExternalBlock).toBe(false);
  });
});
