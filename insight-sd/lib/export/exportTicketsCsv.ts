import { formatDuration } from "@/lib/format/duration";
import type { Ticket } from "@/lib/types/ticket";

const COLUMNS: { label: string; value: (t: Ticket) => string }[] = [
  { label: "Ticket", value: (t) => t.id },
  { label: "Assunto", value: (t) => t.subject ?? t.item ?? "" },
  { label: "Agente", value: (t) => t.agent },
  { label: "Status", value: (t) => t.status },
  { label: "Prioridade", value: (t) => t.priority },
  { label: "Departamento", value: (t) => t.department ?? "" },
  { label: "Categoria", value: (t) => t.category ?? "" },
  { label: "Criado em", value: (t) => (t.createdAt ? t.createdAt.toLocaleString("pt-BR") : "") },
  { label: "Resolvido em", value: (t) => (t.resolvedAt ? t.resolvedAt.toLocaleString("pt-BR") : "") },
  { label: "Tempo de resolução", value: (t) => (t.resolutionHours !== null ? formatDuration(t.resolutionHours) : "") },
  { label: "SLA de resolução", value: (t) => t.resolutionSlaStatus ?? "" },
  { label: "Satisfação", value: (t) => (t.satisfaction !== null ? `${t.satisfaction}/5` : "") },
];

function escapeCsvField(value: string): string {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Gera e baixa um CSV (compatível com Excel) a partir de uma lista de chamados — usado nos modais de drill-down. */
export function exportTicketsToCsv(tickets: Ticket[], title: string): void {
  const rows = [
    COLUMNS.map((c) => c.label),
    ...tickets.map((t) => COLUMNS.map((c) => c.value(t))),
  ];
  const csv = rows.map((row) => row.map(escapeCsvField).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(title)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
