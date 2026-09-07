import { describe, it, expect } from "vitest";
import { buildUnassignedTickets } from "./unassigned";
import { makeTicket } from "@/lib/test/fixtures";

const NOW = new Date("2026-01-10T12:00:00Z");

describe("buildUnassignedTickets", () => {
  it("ignora tickets que já têm agente atribuído", () => {
    const ticket = makeTicket({ agent: "Ana", status: "Aberto" });
    expect(buildUnassignedTickets([ticket], NOW)).toEqual([]);
  });

  it("ignora tickets sem agente que já estão em status terminal", () => {
    const ticket = makeTicket({ agent: "No Agent", status: "Resolvido" });
    expect(buildUnassignedTickets([ticket], NOW)).toEqual([]);
  });

  it("calcula horas em aberto e ordena do mais antigo para o mais recente", () => {
    const antigo = makeTicket({
      id: "T-antigo",
      agent: "No Agent",
      status: "Aberto",
      createdAt: new Date("2026-01-08T12:00:00Z"), // 48h atrás
    });
    const recente = makeTicket({
      id: "T-recente",
      agent: "No Agent",
      status: "Aberto",
      createdAt: new Date("2026-01-10T00:00:00Z"), // 12h atrás
    });

    const result = buildUnassignedTickets([recente, antigo], NOW);

    expect(result.map((t) => t.id)).toEqual(["T-antigo", "T-recente"]);
    expect(result[0].hoursOpen).toBeCloseTo(48, 5);
    expect(result[1].hoursOpen).toBeCloseTo(12, 5);
  });

  it("usa 'Sem assunto' quando o ticket não tem assunto nem item", () => {
    const ticket = makeTicket({ agent: "No Agent", status: "Aberto", subject: null, item: null });
    expect(buildUnassignedTickets([ticket], NOW)[0].subject).toBe("Sem assunto");
  });
});
