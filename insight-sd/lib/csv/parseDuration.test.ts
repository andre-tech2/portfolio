import { describe, it, expect } from "vitest";
import { parseDurationToHours } from "./parseDuration";

describe("parseDurationToHours", () => {
  it("converte HH:MM:SS em horas decimais", () => {
    expect(parseDurationToHours("15:33:26")).toBeCloseTo(15.5572, 3);
  });

  it("aceita horas acima de 23 (não é hora do relógio)", () => {
    expect(parseDurationToHours("120:00:00")).toBe(120);
  });

  it("retorna null para vazio, undefined ou null", () => {
    expect(parseDurationToHours("")).toBeNull();
    expect(parseDurationToHours(undefined)).toBeNull();
    expect(parseDurationToHours(null)).toBeNull();
  });

  it("retorna null para formato inválido", () => {
    expect(parseDurationToHours("não é duração")).toBeNull();
    expect(parseDurationToHours("15:33")).toBeNull();
  });
});
