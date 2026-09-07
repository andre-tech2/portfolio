import { describe, it, expect } from "vitest";
import { validateColumns } from "./validateColumns";
import { REQUIRED_COLUMNS } from "./columnMap";

describe("validateColumns", () => {
  it("é válido quando todas as colunas obrigatórias estão presentes", () => {
    const result = validateColumns([...REQUIRED_COLUMNS, "Coluna extra que ninguém usa"]);
    expect(result.valid).toBe(true);
    expect(result.missingColumns).toEqual([]);
  });

  it("lista as colunas obrigatórias que faltam", () => {
    const semAlgumas = REQUIRED_COLUMNS.filter((c) => c !== "Agente" && c !== "Prioridade");
    const result = validateColumns(semAlgumas);
    expect(result.valid).toBe(false);
    expect(result.missingColumns).toEqual(["Agente", "Prioridade"]);
  });

  it("trata undefined/null como nenhuma coluna presente", () => {
    expect(validateColumns(undefined).valid).toBe(false);
    expect(validateColumns(null).valid).toBe(false);
  });
});
