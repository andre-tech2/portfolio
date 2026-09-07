import Papa from "papaparse";
import { COLUMNS } from "./columnMap";
import { parseDurationToHours } from "./parseDuration";
import { validateColumns } from "./validateColumns";
import type { SlaStatus, Ticket } from "@/lib/types/ticket";

export interface ParseIssue {
  ticketId: string;
  message: string;
}

export interface ParseTicketsResult {
  tickets: Ticket[];
  issues: ParseIssue[];
}

export class MissingColumnsError extends Error {
  missingColumns: string[];

  constructor(missingColumns: string[]) {
    super(`Colunas ausentes no arquivo: ${missingColumns.join(", ")}`);
    this.name = "MissingColumnsError";
    this.missingColumns = missingColumns;
  }
}

export class UnsupportedFileError extends Error {
  constructor(fileName: string) {
    super(`Formato de arquivo não suportado: "${fileName}". Use .csv, .xlsx, .xls ou .xlsm.`);
    this.name = "UnsupportedFileError";
  }
}

function clean(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseDate(value: string | undefined | null): Date | null {
  const cleaned = clean(value);
  if (!cleaned) return null;
  // "2026-06-24 07:27:53" -> ISO local
  const isoLike = cleaned.replace(" ", "T");
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSlaStatus(value: string | undefined | null): SlaStatus | null {
  const cleaned = clean(value);
  if (cleaned === "Within SLA" || cleaned === "SLA Violated") return cleaned;
  return null;
}

function parseSatisfaction(value: string | undefined | null): number | null {
  const cleaned = clean(value);
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d+)\s*\/\s*\d+$/);
  if (!match) return null;
  return Number(match[1]);
}

function parseBoolean(value: string | undefined | null): boolean {
  return clean(value)?.toLowerCase() === "true";
}

function rowToTicket(row: Record<string, string>, issues: ParseIssue[]): Ticket {
  const id = clean(row[COLUMNS.id]) ?? "";
  const status = clean(row[COLUMNS.status]) ?? "Desconhecido";
  const agent = clean(row[COLUMNS.agent]) ?? "No Agent";
  const priority = clean(row[COLUMNS.priority]) ?? "Não informada";

  const createdAt = parseDate(row[COLUMNS.createdAt]);
  if (row[COLUMNS.createdAt] && !createdAt) {
    issues.push({ ticketId: id, message: `Data de criação inválida: "${row[COLUMNS.createdAt]}"` });
  }

  const firstResponseHoursRaw = row[COLUMNS.firstResponseHours];
  const firstResponseHours = parseDurationToHours(firstResponseHoursRaw);
  if (firstResponseHoursRaw && firstResponseHours === null) {
    issues.push({ ticketId: id, message: `Tempo de primeira resposta inválido: "${firstResponseHoursRaw}"` });
  }

  const resolutionHoursRaw = row[COLUMNS.resolutionHours];
  const resolutionHours = parseDurationToHours(resolutionHoursRaw);
  if (resolutionHoursRaw && resolutionHours === null) {
    issues.push({ ticketId: id, message: `Tempo de resolução inválido: "${resolutionHoursRaw}"` });
  }

  return {
    id,
    status,
    agent,
    priority,
    department: clean(row[COLUMNS.department]),
    category: clean(row[COLUMNS.category]),
    subcategory: clean(row[COLUMNS.subcategory]),
    item: clean(row[COLUMNS.item]),
    subject: clean(row[COLUMNS.subject]),
    ticketType: clean(row[COLUMNS.ticketType]),
    group: clean(row[COLUMNS.group]),
    origin: clean(row[COLUMNS.origin]),
    firstResponseSlaStatus: parseSlaStatus(row[COLUMNS.firstResponseSlaStatus]),
    resolutionSlaStatus: parseSlaStatus(row[COLUMNS.resolutionSlaStatus]),
    firstResponseHours,
    resolutionHours,
    createdAt,
    closedAt: parseDate(row[COLUMNS.closedAt]),
    resolvedAt: parseDate(row[COLUMNS.resolvedAt]),
    lastUpdatedAt: parseDate(row[COLUMNS.lastUpdatedAt]),
    dueAt: parseDate(row[COLUMNS.dueAt]),
    satisfaction: parseSatisfaction(row[COLUMNS.satisfaction]),
    requesterEmail: clean(row[COLUMNS.requesterEmail]),
    requesterName: clean(row[COLUMNS.requesterName]),
    isVip: parseBoolean(row[COLUMNS.isVip]),
  };
}

interface RawRows {
  fields: string[];
  rows: Record<string, string>[];
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

function parseCsvRows(file: File): Promise<RawRows> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve({ fields: results.meta.fields ?? [], rows: results.data }),
      error: (error) => reject(error),
    });
  });
}

/** Lib carregada só quando o arquivo é Excel — não entra no bundle inicial do app. */
async function parseExcelRows(file: File): Promise<RawRows> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // raw:false formata cada célula como texto (igual uma linha de CSV), em vez de número/Date do Excel.
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
  const fields = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { fields, rows };
}

async function parseRawRows(file: File): Promise<RawRows> {
  const ext = extensionOf(file.name);
  if (ext === "csv") return parseCsvRows(file);
  if (ext === "xlsx" || ext === "xls" || ext === "xlsm") return parseExcelRows(file);
  throw new UnsupportedFileError(file.name);
}

export async function parseTicketsFile(file: File): Promise<ParseTicketsResult> {
  const { fields, rows } = await parseRawRows(file);

  const { valid, missingColumns } = validateColumns(fields);
  if (!valid) throw new MissingColumnsError(missingColumns);

  const issues: ParseIssue[] = [];
  const tickets = rows.filter((row) => clean(row[COLUMNS.id]) !== null).map((row) => rowToTicket(row, issues));

  return { tickets, issues };
}
