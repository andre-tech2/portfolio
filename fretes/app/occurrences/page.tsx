"use client";

import { useMemo, useState } from "react";
import { buildOccurrences } from "@/lib/metrics/occurrences";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

const STATUS_COLORS: Record<string, string> = {
  Avariado: "var(--status-warning)",
  Insucesso: "var(--status-serious)",
  Extraviado: "var(--status-critical)",
  Devolvido: "var(--status-serious)",
};

export default function OccurrencesPage() {
  const { shipments, isLoading } = useShipmentData();
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const occurrences = useMemo(() => buildOccurrences(shipments), [shipments]);

  const carriers = useMemo(() => Array.from(new Set(occurrences.map((o) => o.carrier))).sort(), [occurrences]);
  const statuses = useMemo(() => Array.from(new Set(occurrences.map((o) => o.status))).sort(), [occurrences]);

  const filtered = occurrences.filter(
    (o) => (carrierFilter === "all" || o.carrier === carrierFilter) && (statusFilter === "all" || o.status === statusFilter)
  );

  if (isLoading) return <p className="text-[var(--text-muted)]">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Ocorrências</h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none"
          >
            <option value="all">Todas as transportadoras</option>
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none"
          >
            <option value="all">Todos os status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="solid-card overflow-x-auto p-5">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhuma ocorrência no filtro atual.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="pb-2 pr-4">Envio</th>
                <th className="pb-2 pr-4">Transportadora</th>
                <th className="pb-2 pr-4">Região</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Motivo</th>
                <th className="pb-2 pr-4">Data</th>
                <th className="pb-2 text-right">Frete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs">{o.id}</td>
                  <td className="py-2.5 pr-4">{o.carrier}</td>
                  <td className="py-2.5 pr-4">{o.region}</td>
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold" style={{ color: STATUS_COLORS[o.status] ?? "var(--text-primary)" }}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{o.reason}</td>
                  <td className="text-tabular py-2.5 pr-4">{o.occurredAt.toLocaleDateString("pt-BR")}</td>
                  <td className="text-tabular py-2.5 text-right">
                    {o.freightCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
