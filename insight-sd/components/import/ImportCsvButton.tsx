"use client";

import { useRef, useState } from "react";
import { useTicketData } from "@/lib/context/TicketDataContext";
import type { ParseIssue } from "@/lib/csv/parseTickets";

interface ImportCsvButtonProps {
  variant?: "primary" | "header";
  onImported?: (result: { ticketCount: number; warnings: ParseIssue[] }) => void;
}

export function ImportCsvButton({ variant = "header", onImported }: ImportCsvButtonProps) {
  const { importTickets, importError, clearImportError } = useTicketData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    clearImportError();
    try {
      const result = await importTickets(file);
      onImported?.(result);
    } catch {
      // erro já fica exposto via importError no contexto
    } finally {
      setIsImporting(false);
    }
  }

  const baseClasses =
    variant === "primary"
      ? "rounded-xl px-6 py-3 text-sm font-semibold shadow-[0_0_24px_rgba(57,135,229,0.35)]"
      : "rounded-lg px-4 py-2 text-sm font-medium";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        className={`${baseClasses} bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-glow-2)] text-white transition-opacity hover:opacity-90 disabled:opacity-60`}
      >
        {isImporting ? "Importando..." : variant === "primary" ? "Importar arquivo CSV ou Excel" : "Importar novo arquivo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,.xlsx,.xls,.xlsm,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleChange}
      />
      {importError && <p className="max-w-xs text-right text-xs text-[var(--status-critical)]">{importError}</p>}
    </div>
  );
}
