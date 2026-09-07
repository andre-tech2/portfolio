import { REQUIRED_COLUMNS } from "./columnMap";

export interface ColumnValidationResult {
  valid: boolean;
  missingColumns: string[];
}

export function validateColumns(fields: string[] | undefined | null): ColumnValidationResult {
  const present = new Set(fields ?? []);
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !present.has(col));
  return { valid: missingColumns.length === 0, missingColumns };
}
