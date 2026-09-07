"use client";

import { DATE_RANGE_LABELS, type DateRangePreset } from "@/lib/dateRange";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

const PRESETS: DateRangePreset[] = ["7d", "14d", "30d", "60d", "all"];

export function DateRangeSelector() {
  const { dateRangePreset, setDateRangePreset } = useShipmentData();

  return (
    <select
      value={dateRangePreset}
      onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
      className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
      title="Período considerado em todas as páginas (por data de envio)"
    >
      {PRESETS.map((preset) => (
        <option key={preset} value={preset}>
          {DATE_RANGE_LABELS[preset]}
        </option>
      ))}
    </select>
  );
}
