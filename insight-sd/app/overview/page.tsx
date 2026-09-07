"use client";

import Link from "next/link";
import { useState } from "react";
import { KpiCard } from "@/components/kpi/KpiCard";
import { RequireData } from "@/components/layout/RequireData";
import { SlaGaugeChart } from "@/components/charts/SlaGaugeChart";
import { TopListBarChart } from "@/components/charts/TopListBarChart";
import { TicketListModal } from "@/components/tickets/TicketListModal";
import { useTicketData } from "@/lib/context/TicketDataContext";
import { formatDuration as formatHours } from "@/lib/format/duration";
import { slaBadge } from "@/lib/format/slaBadge";
import { FALLBACK_LABEL } from "@/lib/metrics/topN";

type SlaGaugeSelection = "firstResponse" | "resolution";

function OverviewContent() {
  const { metrics, tickets, slaGoals, performanceGoals } = useTicketData();
  const [selectedGauge, setSelectedGauge] = useState<SlaGaugeSelection | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  if (!metrics) return null;

  const topDepartment = metrics.topDepartments[0];
  const avgDailyVolume =
    metrics.teamTrend.length > 0
      ? metrics.teamTrend.reduce((sum, p) => sum + p.count, 0) / metrics.teamTrend.length
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Visão Geral</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Retrato completo do time de Service Desk a partir do último arquivo importado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total de chamados" value={metrics.totalTickets.toLocaleString("pt-BR")} accent="blue" />
        <KpiCard
          label="Média de atendimento"
          value={formatHours(metrics.avgResolutionHours)}
          hint="Tempo médio de resolução — misturando todas as prioridades"
          accent="violet"
        />
        <KpiCard
          label="Chamados atrasados"
          value={metrics.overdueTotalCount.toLocaleString("pt-BR")}
          hint={
            `${((metrics.overdueTotalCount / Math.max(metrics.totalTickets, 1)) * 100).toFixed(0)}% do total` +
            (metrics.overdueExternalCount > 0 ? ` · ${metrics.overdueExternalCount} aguardando terceiros` : "")
          }
          accent="red"
        />
        <KpiCard
          label="Área que mais abre chamados"
          value={topDepartment ? topDepartment.key : "—"}
          hint={topDepartment ? `${topDepartment.count} chamados (${topDepartment.percentage.toFixed(0)}%)` : undefined}
          accent="amber"
        />
        <KpiCard
          label="Satisfação (CSAT)"
          value={metrics.avgSatisfaction !== null ? `${metrics.avgSatisfaction.toFixed(1)}/5` : "—"}
          goal={`Meta: ${performanceGoals.csatTarget.toFixed(1)}`}
          valueColor={
            metrics.avgSatisfaction !== null
              ? metrics.avgSatisfaction >= performanceGoals.csatTarget
                ? "var(--status-good)"
                : "var(--status-critical)"
              : undefined
          }
          hint={
            metrics.csatResponseRate !== null
              ? `${metrics.csatResponseRate.toFixed(0)}% dos chamados encerrados responderam a pesquisa`
              : undefined
          }
          accent="aqua"
        />
        <KpiCard
          label="Volume diário do time"
          value={avgDailyVolume !== null ? `${avgDailyVolume.toFixed(1)}/dia` : "—"}
          goal={`Meta: ${performanceGoals.dailyVolumeTarget}/dia`}
          valueColor={
            avgDailyVolume !== null
              ? avgDailyVolume >= performanceGoals.dailyVolumeTarget
                ? "var(--status-good)"
                : "var(--status-critical)"
              : undefined
          }
          hint="Média de chamados atendidos por dia no período"
          accent="blue"
        />
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tempo médio por prioridade</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Cada prioridade tem seu próprio prazo esperado — comparar a média geral com um número só
          não é justo pra quem atende muitos chamados de baixa prioridade. Ajuste as metas em{" "}
          <Link href="/settings" className="underline hover:text-[var(--text-primary)]">
            Configurações
          </Link>
          .
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
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
                      ? "var(--status-good)"
                      : "var(--status-critical)"
                    : "var(--text-primary)";
                return (
                  <tr key={row.priority} className="border-b border-[var(--border-hairline)] last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{row.priority}</td>
                    <td className="text-tabular py-2.5 pr-4 text-right">{row.count}</td>
                    <td className="text-tabular py-2.5 pr-4 text-right font-semibold" style={{ color }}>
                      {formatHours(row.avgResolutionHours)}
                    </td>
                    <td className="text-tabular py-2.5 text-right text-[var(--text-muted)]">
                      {target !== undefined ? formatHours(target) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Top 5 solicitações</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Assuntos/itens mais recorrentes entre todos os chamados. Clique numa barra pra ver os chamados.
          </p>
          <div className="mt-4">
            <TopListBarChart data={metrics.topSubjects} onSelect={setSelectedSubject} />
          </div>
        </div>

        <div className="glass-card flex flex-col items-center justify-center gap-6 p-5">
          <h2 className="self-start text-sm font-semibold text-[var(--text-primary)]">SLA de atendimento</h2>
          <SlaGaugeChart
            label="1ª resposta"
            percentage={metrics.slaOverall.firstResponse.percentage}
            goals={slaGoals}
            onSelect={() => setSelectedGauge("firstResponse")}
          />
          <SlaGaugeChart
            label="Resolução"
            percentage={metrics.slaOverall.resolution.percentage}
            goals={slaGoals}
            onSelect={() => setSelectedGauge("resolution")}
          />
        </div>
      </div>

      {selectedGauge && (
        <TicketListModal
          title={selectedGauge === "firstResponse" ? "SLA de 1ª resposta" : "SLA de resolução"}
          tickets={tickets.filter((t) =>
            selectedGauge === "firstResponse" ? t.firstResponseSlaStatus !== null : t.resolutionSlaStatus !== null
          )}
          badgeColumnLabel="SLA"
          renderBadge={(t) => slaBadge(selectedGauge === "firstResponse" ? t.firstResponseSlaStatus : t.resolutionSlaStatus)}
          onClose={() => setSelectedGauge(null)}
        />
      )}

      {selectedSubject && (
        <TicketListModal
          title={`Solicitação · ${selectedSubject}`}
          tickets={tickets.filter((t) => (t.subject ?? t.item ?? FALLBACK_LABEL) === selectedSubject)}
          onClose={() => setSelectedSubject(null)}
        />
      )}

      {selectedDepartment && (
        <TicketListModal
          title={`Área · ${selectedDepartment}`}
          tickets={tickets.filter((t) => (t.department ?? FALLBACK_LABEL) === selectedDepartment)}
          onClose={() => setSelectedDepartment(null)}
        />
      )}

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Top 5 chamados mais atrasados</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Chamados com maior atraso em relação ao prazo de SLA (fechados fora do prazo ou ainda abertos e vencidos).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="pb-2 pr-4">Ticket</th>
                <th className="pb-2 pr-4">Assunto</th>
                <th className="pb-2 pr-4">Agente</th>
                <th className="pb-2 pr-4">Prioridade</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 text-right">Atraso</th>
              </tr>
            </thead>
            <tbody>
              {metrics.overdueTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                    Nenhum chamado atrasado identificado.
                  </td>
                </tr>
              )}
              {metrics.overdueTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4 text-[var(--text-muted)]">#{ticket.id}</td>
                  <td className="py-2.5 pr-4">{ticket.subject}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.agent}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.priority}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                    {ticket.status}
                    {ticket.isExternalBlock && (
                      <span
                        className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                        title="Chamado esperando terceiro (transportadora, equipamento, aprovação) — atraso não é do agente."
                      >
                        aguardando terceiros
                      </span>
                    )}
                  </td>
                  <td className="text-tabular py-2.5 text-right font-semibold text-[var(--status-critical)]">
                    {formatHours(ticket.delayHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Análise dos agentes</h2>
          <div className="mt-4">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="w-[34%] pb-2 pr-2">Agente</th>
                  <th className="pb-2 pr-2 text-right">Volume</th>
                  <th className="pb-2 pr-2 text-right">Fechados</th>
                  <th className="pb-2 pr-2 text-right">Tempo médio</th>
                  <th className="pb-2 text-right">SLA</th>
                </tr>
              </thead>
              <tbody>
                {metrics.agentStats.map((agent) => (
                  <tr key={agent.agent} className="border-b border-[var(--border-hairline)] last:border-0">
                    <td className="truncate py-2.5 pr-2" title={agent.agent}>
                      {agent.agent}
                    </td>
                    <td className="text-tabular py-2.5 pr-2 text-right">{agent.volume}</td>
                    <td className="text-tabular py-2.5 pr-2 text-right">
                      {agent.closedCount}
                      {agent.closedPercentage !== null && (
                        <span className="text-[var(--text-muted)]"> ({agent.closedPercentage.toFixed(0)}%)</span>
                      )}
                    </td>
                    <td className="text-tabular py-2.5 pr-2 text-right">{formatHours(agent.avgResolutionHours)}</td>
                    <td className="text-tabular py-2.5 text-right">
                      {agent.slaPercentage === null ? "—" : `${agent.slaPercentage.toFixed(0)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Áreas que mais abrem chamados</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Clique numa barra pra ver os chamados.</p>
          <div className="mt-4">
            <TopListBarChart data={metrics.topDepartments} onSelect={setSelectedDepartment} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <RequireData>
      <OverviewContent />
    </RequireData>
  );
}
