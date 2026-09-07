"use client";

import { useShipmentData } from "@/lib/context/ShipmentDataContext";

function onTimeColor(pct: number | null): string {
  if (pct === null) return "var(--text-muted)";
  if (pct >= 90) return "var(--status-good)";
  if (pct >= 75) return "var(--status-warning)";
  return "var(--status-critical)";
}

export default function RegionsPage() {
  const { metrics, isLoading } = useShipmentData();

  if (isLoading) return <p className="text-[var(--text-muted)]">Carregando…</p>;
  if (!metrics) return <p className="text-[var(--text-muted)]">Sem envios no período/região selecionados.</p>;

  const overallCost = metrics.avgFreightCost;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Regiões</h1>

      <div className="solid-card overflow-x-auto p-5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="pb-2 pr-4">Região</th>
              <th className="pb-2 pr-4 text-right">Volume</th>
              <th className="pb-2 pr-4 text-right">No prazo</th>
              <th className="pb-2 pr-4 text-right">Trânsito médio</th>
              <th className="pb-2 text-right">Frete médio</th>
            </tr>
          </thead>
          <tbody>
            {metrics.regionStats.map((region) => {
              const costRatio = overallCost && region.avgFreightCost ? region.avgFreightCost / overallCost : null;
              return (
                <tr key={region.region} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{region.region}</td>
                  <td className="text-tabular py-2.5 pr-4 text-right">{region.volume}</td>
                  <td
                    className="text-tabular py-2.5 pr-4 text-right font-semibold"
                    style={{ color: onTimeColor(region.onTimePercentage) }}
                  >
                    {region.onTimePercentage === null ? "—" : `${region.onTimePercentage.toFixed(1)}%`}
                  </td>
                  <td className="text-tabular py-2.5 pr-4 text-right">
                    {region.avgTransitDays === null ? "—" : `${region.avgTransitDays.toFixed(1)} dias`}
                  </td>
                  <td className="text-tabular py-2.5 text-right">
                    {region.avgFreightCost === null
                      ? "—"
                      : region.avgFreightCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    {costRatio !== null && costRatio >= 1.3 && (
                      <span className="ml-1 text-[var(--status-serious)]" title="Acima da média geral">
                        ↑
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
