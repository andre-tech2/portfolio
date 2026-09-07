"use client";

import { DATE_RANGE_LABELS, type DateRangePreset } from "@/lib/dateRange";
import { useTicketData } from "@/lib/context/TicketDataContext";

const PRESETS: DateRangePreset[] = ["all", "7d", "14d", "30d", "90d", "180d"];

export function DateRangeSelector() {
  const { dateRangePreset, setDateRangePreset } = useTicketData();

  return (
    <select
      value={dateRangePreset}
      onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
      title="Período considerado em todas as páginas (por data de criação do chamado)"
    >
      {PRESETS.map((preset) => (
        <option key={preset} value={preset}>
          {DATE_RANGE_LABELS[preset]}
        </option>
      ))}
    </select>
  );
}
