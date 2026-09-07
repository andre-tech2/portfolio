"use client";

import { useMemo, useState } from "react";
import { RequireData } from "@/components/layout/RequireData";
import { DATE_RANGE_LABELS } from "@/lib/dateRange";
import { generateReportPptx } from "@/lib/export/generatePptx";
import { buildRecommendations } from "@/lib/metrics/recommendations";
import { useTicketData } from "@/lib/context/TicketDataContext";
import { formatDuration as formatHours } from "@/lib/format/duration";

const CARD = { background: "#ffffff", border: "1px solid #d9d9d6", borderRadius: 12 };
const TEXT_MUTED = "#5b5b57";
const TEXT_PRIMARY = "#0b0b0b";

function ReportContent() {
  const { metrics, tickets, meta, slaGoals, performanceGoals, dateRangePreset, resolvedRecommendations } =
    useTicketData();
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const recommendations = useMemo(
    () =>
      metrics
        ? buildRecommendations(metrics, tickets, slaGoals)
            .filter((r) => !resolvedRecommendations[r.id])
            .slice(0, 5)
        : [],
    [metrics, tickets, slaGoals, resolvedRecommendations]
  );

  if (!metrics) return null;

  async function handleGeneratePptx() {
    setIsGeneratingPptx(true);
    try {
      await generateReportPptx({ metrics: metrics!, meta, dateRangePreset, recommendations });
    } finally {
      setIsGeneratingPptx(false);
    }
  }

  const kpis = [
    { label: "Total de chamados", value: metrics.totalTickets.toLocaleString("pt-BR") },
    { label: "Média de atendimento", value: formatHours(metrics.avgResolutionHours) },
    {
      label: "SLA de resolução",
      value: metrics.slaOverall.resolution.percentage === null ? "—" : `${metrics.slaOverall.resolution.percentage.toFixed(0)}%`,
    },
    { label: "Chamados atrasados", value: metrics.overdueTotalCount.toLocaleString("pt-BR") },
    {
      label: "Satisfação (CSAT)",
      value: metrics.avgSatisfaction !== null ? `${metrics.avgSatisfaction.toFixed(1)}/5` : "—",
    },
  ];

  return (
    <div
      style={{ color: TEXT_PRIMARY, background: "#ffffff", maxWidth: 900 }}
      className="mx-auto space-y-6 rounded-2xl p-6 sm:p-10"
    >
      <div className="no-print flex justify-end gap-3">
        <button
          type="button"
          onClick={handleGeneratePptx}
          disabled={isGeneratingPptx}
          className="rounded-lg border px-5 py-2 text-sm font-semibold disabled:opacity-60"
          style={{ borderColor: "#d9d9d6", background: "#ffffff", color: TEXT_PRIMARY }}
        >
          {isGeneratingPptx ? "Gerando..." : "Gerar apresentação (PPTX)"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-glow-2)] px-5 py-2 text-sm font-semibold text-white"
        >
          Imprimir / Exportar PDF
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Insight SD — Relatório de Service Desk</h1>
        <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
          Período: {DATE_RANGE_LABELS[dateRangePreset]} · Gerado em {new Date().toLocaleDateString("pt-BR")}
          {meta && ` · Arquivo importado em ${meta.importedAt.toLocaleDateString("pt-BR")}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} style={CARD} className="p-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
              {kpi.label}
            </p>
            <p className="text-tabular mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div style={CARD} className="p-5">
        <h2 className="text-sm font-bold">Tempo médio por prioridade</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #d9d9d6", color: TEXT_MUTED }} className="text-xs uppercase">
              <th className="pb-2 pr-4">Prioridade</th>
              <th className="pb-2 pr-4 text-right">Chamados</th>
              <th className="pb-2 pr-4 text-right">Tempo médio</th>
              <th className="pb-2 text-right">Meta</th>
            </tr>
          </thead>
          <tbody>
            {metrics.resolutionByPriority.map((row) => {
              const target = (performanceGoals.resolutionHoursTargets as Record<string, number | undefined>)[
                row.priority
              ];
              const color =
                target !== undefined && row.avgResolutionHours !== null
                  ? row.avgResolutionHours <= target
                    ? "#0ca30c"
                    : "#d03b3b"
                  : TEXT_PRIMARY;
              return (
                <tr key={row.priority} style={{ borderBottom: "1px solid #eeeeec" }}>
                  <td className="py-2 pr-4">{row.priority}</td>
                  <td className="text-tabular py-2 pr-4 text-right">{row.count}</td>
                  <td className="text-tabular py-2 pr-4 text-right font-semibold" style={{ color }}>
                    {formatHours(row.avgResolutionHours)}
                  </td>
                  <td className="text-tabular py-2 text-right" style={{ color: TEXT_MUTED }}>
                    {target !== undefined ? formatHours(target) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={CARD} className="p-5">
        <h2 className="text-sm font-bold">Ranking da equipe</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #d9d9d6", color: TEXT_MUTED }} className="text-xs uppercase">
              <th className="pb-2 pr-4">Agente</th>
              <th className="pb-2 pr-4 text-right">Volume</th>
              <th className="pb-2 pr-4 text-right">Fechados</th>
              <th className="pb-2 pr-4 text-right">Tempo médio</th>
              <th className="pb-2 text-right">SLA</th>
            </tr>
          </thead>
          <tbody>
            {metrics.agentStats.map((agent) => (
              <tr key={agent.agent} style={{ borderBottom: "1px solid #eeeeec" }}>
                <td className="py-2 pr-4">{agent.agent}</td>
                <td className="text-tabular py-2 pr-4 text-right">{agent.volume}</td>
                <td className="text-tabular py-2 pr-4 text-right">
                  {agent.closedCount}
                  {agent.closedPercentage !== null ? ` (${agent.closedPercentage.toFixed(0)}%)` : ""}
                </td>
                <td className="text-tabular py-2 pr-4 text-right">{formatHours(agent.avgResolutionHours)}</td>
                <td className="text-tabular py-2 text-right">
                  {agent.slaPercentage === null ? "—" : `${agent.slaPercentage.toFixed(0)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={CARD} className="p-5">
        <h2 className="text-sm font-bold">Top 5 chamados mais atrasados</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #d9d9d6", color: TEXT_MUTED }} className="text-xs uppercase">
              <th className="pb-2 pr-4">Ticket</th>
              <th className="pb-2 pr-4">Assunto</th>
              <th className="pb-2 pr-4">Agente</th>
              <th className="pb-2 text-right">Atraso</th>
            </tr>
          </thead>
          <tbody>
            {metrics.overdueTickets.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center" style={{ color: TEXT_MUTED }}>
                  Nenhum chamado atrasado.
                </td>
              </tr>
            )}
            {metrics.overdueTickets.map((ticket) => (
              <tr key={ticket.id} style={{ borderBottom: "1px solid #eeeeec" }}>
                <td className="py-2 pr-4" style={{ color: TEXT_MUTED }}>
                  #{ticket.id}
                </td>
                <td className="py-2 pr-4">{ticket.subject}</td>
                <td className="py-2 pr-4">{ticket.agent}</td>
                <td className="text-tabular py-2 text-right font-semibold">
                  {formatHours(ticket.delayHours)}
                  {ticket.isExternalBlock && (
                    <span className="ml-1 text-xs font-normal" style={{ color: TEXT_MUTED }}>
                      (terceiros)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={CARD} className="p-5">
        <h2 className="text-sm font-bold">Painel crítico</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-tabular text-xl font-bold">{metrics.staleTotalCount}</p>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              Chamados parados
            </p>
          </div>
          <div>
            <p className="text-tabular text-xl font-bold">{metrics.vipTotalCount}</p>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              VIP em risco
            </p>
          </div>
          <div>
            <p className="text-tabular text-xl font-bold">{metrics.unassignedTotalCount}</p>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              Sem agente
            </p>
          </div>
        </div>
      </div>

      <div style={CARD} className="p-5">
        <h2 className="text-sm font-bold">Principais recomendações</h2>
        {recommendations.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: TEXT_MUTED }}>
            Nenhum ponto de atenção identificado.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {recommendations.map((rec) => (
              <li key={rec.id} style={{ borderBottom: "1px solid #eeeeec" }} className="pb-2">
                <span className="font-semibold">
                  [{rec.severity === "critical" ? "Crítico" : rec.severity === "warning" ? "Atenção" : "Oportunidade"}]
                </span>{" "}
                {rec.title} — {rec.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="pt-2 text-center text-xs" style={{ color: TEXT_MUTED }}>
        Insight SD — desenvolvido por André André
      </p>
    </div>
  );
}

export default function ReportPage() {
  return (
    <RequireData>
      <ReportContent />
    </RequireData>
  );
}
