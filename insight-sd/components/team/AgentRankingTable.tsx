"use client";

import { useMemo, useState } from "react";
import { formatDuration as formatHours } from "@/lib/format/duration";
import type { AgentStat } from "@/lib/metrics/types";
import type { SlaGoals } from "@/lib/settings/slaGoals";

type SortKey =
  | "volume"
  | "closedCount"
  | "avgResolutionHours"
  | "firstResponseSlaPercentage"
  | "slaPercentage"
  | "avgSatisfaction"
  | "overdueCount";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "closedCount", label: "Fechados" },
  { key: "avgResolutionHours", label: "Tempo médio" },
  { key: "firstResponseSlaPercentage", label: "SLA 1ª Resp." },
  { key: "slaPercentage", label: "SLA Resolução" },
  { key: "avgSatisfaction", label: "CSAT" },
  { key: "overdueCount", label: "Atrasados" },
];

function slaColor(pct: number | null, goals: SlaGoals): string {
  if (pct === null) return "var(--text-muted)";
  if (pct >= goals.target) return "var(--status-good)";
  if (pct >= goals.critical) return "var(--status-warning)";
  return "var(--status-critical)";
}

function csatColor(score: number | null): string {
  if (score === null) return "var(--text-muted)";
  if (score >= 4.2) return "var(--status-good)";
  if (score >= 3.5) return "var(--status-warning)";
  return "var(--status-critical)";
}

export function AgentRankingTable({ agentStats, slaGoals }: { agentStats: AgentStat[]; slaGoals: SlaGoals }) {
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const withNullsLast = [...agentStats].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return withNullsLast;
  }, [agentStats, sortKey, sortDir]);

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
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <th className="pb-2 pr-4">Agente</th>
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
          {sorted.map((agent) => (
            <tr key={agent.agent} className="border-b border-[var(--border-hairline)] last:border-0">
              <td className="py-2.5 pr-4">{agent.agent}</td>
              <td className="text-tabular py-2.5 pr-4 text-right">{agent.volume}</td>
              <td className="text-tabular py-2.5 pr-4 text-right">
                {agent.closedCount}
                {agent.closedPercentage !== null && (
                  <span className="text-[var(--text-muted)]"> ({agent.closedPercentage.toFixed(0)}%)</span>
                )}
              </td>
              <td className="text-tabular py-2.5 pr-4 text-right">{formatHours(agent.avgResolutionHours)}</td>
              <td
                className="text-tabular py-2.5 pr-4 text-right font-semibold"
                style={{ color: slaColor(agent.firstResponseSlaPercentage, slaGoals) }}
              >
                {agent.firstResponseSlaPercentage === null ? "—" : `${agent.firstResponseSlaPercentage.toFixed(1)}%`}
              </td>
              <td className="text-tabular py-2.5 pr-4 text-right font-semibold" style={{ color: slaColor(agent.slaPercentage, slaGoals) }}>
                {agent.slaPercentage === null ? "—" : `${agent.slaPercentage.toFixed(1)}%`}
              </td>
              <td className="text-tabular py-2.5 pr-4 text-right font-semibold" style={{ color: csatColor(agent.avgSatisfaction) }}>
                {agent.avgSatisfaction === null ? "—" : agent.avgSatisfaction.toFixed(1)}
              </td>
              <td className="text-tabular py-2.5 text-right">
                {agent.overdueCount > 0 ? (
                  <span style={{ color: "var(--status-critical)" }}>{agent.overdueCount}</span>
                ) : (
                  agent.overdueCount
                )}
                {agent.overdueExternalCount > 0 && (
                  <span
                    className="text-[var(--text-muted)]"
                    title="Desses, quantos estão esperando terceiro (transportadora, equipamento, aprovação) — não pesa contra o agente."
                  >
                    {" "}
                    ({agent.overdueExternalCount} terceiros)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
