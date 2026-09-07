import { describe, it, expect } from "vitest";
import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("retorna travessão para null", () => {
    expect(formatDuration(null)).toBe("—");
  });

  it("formata menos de 1 hora em minutos", () => {
    expect(formatDuration(0.5)).toBe("30 min");
  });

  it("formata entre 1 e 48 horas com uma casa decimal", () => {
    expect(formatDuration(15.333)).toBe("15.3h");
  });

  it("formata 48 horas ou mais em dias arredondados", () => {
    expect(formatDuration(48)).toBe("2 dias");
    expect(formatDuration(60)).toBe("3 dias");
  });
});
