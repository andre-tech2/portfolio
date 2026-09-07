"use client";

import type { StatusBreakdownEntry } from "@/lib/metrics/types";

interface StatusBreakdownGridProps {
  data: StatusBreakdownEntry[];
  onSelect: (status: string) => void;
}

export function StatusBreakdownGrid({ data, onSelect }: StatusBreakdownGridProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados suficientes.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {data.map((entry) => (
        <button
          key={entry.status}
          type="button"
          onClick={() => onSelect(entry.status)}
          className="flex items-center justify-between rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2.5 text-left text-sm transition-colors hover:border-[var(--accent-glow)]"
        >
          <span className="text-[var(--text-secondary)]">{entry.status}</span>
          <span className="text-tabular font-semibold text-[var(--text-primary)]">{entry.count}</span>
        </button>
      ))}
    </div>
  );
}
