"use client";

import { useMemo, useState } from "react";
import { AgentComparisonChart, type ComparisonMetricKey, type ComparisonTarget } from "@/components/charts/AgentComparisonChart";
import { RequireData } from "@/components/layout/RequireData";
import { TicketListModal, type TicketBadge } from "@/components/tickets/TicketListModal";
import { CLOSED_STATUSES } from "@/lib/csv/columnMap";
import { buildAgentComparison } from "@/lib/metrics/agentComparison";
import { getOverdueDelayHours } from "@/lib/metrics/overdue";
import { formatDuration } from "@/lib/format/duration";
import { slaBadge } from "@/lib/format/slaBadge";
import { useTicketData } from "@/lib/context/TicketDataContext";
import type { Ticket } from "@/lib/types/ticket";

interface SelectedMetric {
  key: ComparisonMetricKey;
  target: ComparisonTarget;
}

const METRIC_LABEL: Record<ComparisonMetricKey, string> = {
  volume: "Volume de chamados",
  closed: "Chamados fechados",
  resolution: "Tempo médio de resolução",
  "first-response-sla": "SLA de 1ª resposta",
  sla: "SLA de resolução",
  csat: "Satisfação (CSAT)",
};

function csatBadge(t: Ticket): TicketBadge | null {
  if (t.satisfaction === null) return null;
  return {
    text: `${t.satisfaction}/5`,
    tone: t.satisfaction >= 4.2 ? "good" : t.satisfaction >= 3.5 ? "muted" : "critical",
  };
}

function resolutionBadge(t: Ticket): TicketBadge | null {
  return t.resolutionHours === null ? null : { text: formatDuration(t.resolutionHours), tone: "muted" };
}

function AgentOverviewContent() {
  const { metrics, selectedAgent, tickets } = useTicketData();
  const [showOverdueTickets, setShowOverdueTickets] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<SelectedMetric | null>(null);

  const comparison = useMemo(
    () => (metrics && selectedAgent ? buildAgentComparison(metrics.agentStats, selectedAgent) : null),
    [metrics, selectedAgent]
  );

  if (!metrics) return null;

  if (!comparison) {
    return (
      <div className="glass-card p-8 text-center text-sm text-[var(--text-muted)]">
        Selecione um agente no topo da página para ver a comparação.
      </div>
    );
  }

  const { agentStat, teamAverage } = comparison;
  const slaGap =
    agentStat.slaPercentage !== null && teamAverage.slaPercentage !== null
      ? agentStat.slaPercentage - teamAverage.slaPercentage
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Análise do agente</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Comparando <span className="font-semibold text-[var(--text-primary)]">{comparison.agent}</span> com a
          média da equipe.
        </p>
      </div>

      {slaGap !== null && (
        <div className="glass-card p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            {comparison.agent} está com SLA de resolução{" "}
            <span
              className="font-semibold"
              style={{ color: slaGap >= 0 ? "var(--status-good)" : "var(--status-critical)" }}
            >
              {slaGap >= 0 ? `${slaGap.toFixed(0)} p.p. acima` : `${Math.abs(slaGap).toFixed(0)} p.p. abaixo`}
            </span>{" "}
            da média da equipe ({teamAverage.slaPercentage?.toFixed(0)}%), com {agentStat.volume} chamados
            atendidos no período e {agentStat.overdueCount} chamados atrasados.
          </p>
        </div>
      )}

      <AgentComparisonChart
        comparison={comparison}
        onSelectMetric={(key, target) => setSelectedMetric({ key, target })}
      />

      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">{agentStat.overdueCount}</span> chamados
          atrasados
          {agentStat.overdueExternalCount > 0 && (
            <span className="text-[var(--text-muted)]"> ({agentStat.overdueExternalCount} aguardando terceiros)</span>
          )}
          {" "}· média da equipe: {teamAverage.overdueCount.toFixed(1)}
        </p>
        {agentStat.overdueCount > 0 && (
          <button
            type="button"
            onClick={() => setShowOverdueTickets(true)}
            className="text-xs font-semibold text-[var(--accent-glow)] underline-offset-2 hover:underline"
          >
            Ver chamados atrasados
          </button>
        )}
      </div>

      {showOverdueTickets && (
        <TicketListModal
          title={`Atrasados · ${comparison.agent}`}
          tickets={tickets.filter((t) => t.agent === selectedAgent && getOverdueDelayHours(t) !== null)}
          onClose={() => setShowOverdueTickets(false)}
        />
      )}

      {selectedMetric && (
        <TicketListModal
          title={`${METRIC_LABEL[selectedMetric.key]} · ${selectedMetric.target === "agent" ? comparison.agent : "Equipe"}`}
          tickets={(selectedMetric.target === "agent" ? tickets.filter((t) => t.agent === selectedAgent) : tickets).filter(
            (t) => {
              switch (selectedMetric.key) {
                case "volume":
                  return true;
                case "closed":
                  return CLOSED_STATUSES.has(t.status);
                case "resolution":
                  return t.resolutionHours !== null;
                case "first-response-sla":
                  return t.firstResponseSlaStatus !== null;
                case "sla":
                  return t.resolutionSlaStatus !== null;
                case "csat":
                  return t.satisfaction !== null;
              }
            }
          )}
          badgeColumnLabel={
            selectedMetric.key === "csat"
              ? "Nota"
              : selectedMetric.key === "resolution"
                ? "Tempo"
                : selectedMetric.key === "first-response-sla" || selectedMetric.key === "sla"
                  ? "SLA"
                  : "Atrasado"
          }
          renderBadge={
            selectedMetric.key === "volume" || selectedMetric.key === "closed"
              ? undefined
              : (t) => {
                  switch (selectedMetric.key) {
                    case "first-response-sla":
                      return slaBadge(t.firstResponseSlaStatus);
                    case "sla":
                      return slaBadge(t.resolutionSlaStatus);
                    case "csat":
                      return csatBadge(t);
                    case "resolution":
                      return resolutionBadge(t);
                    default:
                      return null;
                  }
                }
          }
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
}

export default function AgentOverviewPage() {
  return (
    <RequireData>
      <AgentOverviewContent />
    </RequireData>
  );
}
