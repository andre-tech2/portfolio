"use client";

import { useMemo, useState } from "react";
import type { CarrierStat } from "@/lib/metrics/types";
import type { DeliveryGoals } from "@/lib/settings/deliveryGoals";

type SortKey = "volume" | "onTimePercentage" | "avgTransitDays" | "occurrenceCount" | "avgFreightCost" | "delayedCount";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "onTimePercentage", label: "No prazo" },
  { key: "avgTransitDays", label: "Trânsito médio" },
  { key: "occurrenceCount", label: "Ocorrências" },
  { key: "avgFreightCost", label: "Frete médio" },
  { key: "delayedCount", label: "Atrasados" },
];

function onTimeColor(pct: number | null, goals: DeliveryGoals): string {
  if (pct === null) return "var(--text-muted)";
  if (pct >= goals.onTimeTarget) return "var(--status-good)";
  if (pct >= goals.onTimeCritical) return "var(--status-warning)";
  return "var(--status-critical)";
}

export function CarrierRankingTable({ carrierStats, goals }: { carrierStats: CarrierStat[]; goals: DeliveryGoals }) {
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...carrierStats].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [carrierStats, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <th className="pb-2 pr-4">Transportadora</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="pb-2 pr-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className={`hover:text-[var(--text-primary)] ${sortKey === col.key ? "text-[var(--text-primary)]" : ""}`}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((carrier) => (
            <tr key={carrier.carrier} className="border-b border-[var(--border-hairline)] last:border-0">
              <td className="py-2.5 pr-4 font-medium">{carrier.carrier}</td>
              <td className="text-tabular py-2.5 pr-4 text-right">{carrier.volume}</td>
              <td
                className="text-tabular py-2.5 pr-4 text-right font-semibold"
                style={{ color: onTimeColor(carrier.onTimePercentage, goals) }}
              >
                {carrier.onTimePercentage === null ? "—" : `${carrier.onTimePercentage.toFixed(1)}%`}
              </td>
              <td className="text-tabular py-2.5 pr-4 text-right">
                {carrier.avgTransitDays === null ? "—" : `${carrier.avgTransitDays.toFixed(1)} dias`}
              </td>
              <td className="text-tabular py-2.5 pr-4 text-right">
                {carrier.occurrenceCount}
                {carrier.occurrencePercentage !== null && (
                  <span className="text-[var(--text-muted)]"> ({carrier.occurrencePercentage.toFixed(0)}%)</span>
                )}
              </td>
              <td className="text-tabular py-2.5 pr-4 text-right">
                {carrier.avgFreightCost === null
                  ? "—"
                  : carrier.avgFreightCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td className="text-tabular py-2.5 text-right">
                {carrier.delayedCount > 0 ? (
                  <span style={{ color: "var(--status-critical)" }}>{carrier.delayedCount}</span>
                ) : (
                  carrier.delayedCount
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
