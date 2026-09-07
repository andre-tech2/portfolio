"use client";

import { useMemo, useState } from "react";
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { RequireData } from "@/components/layout/RequireData";
import { TicketListModal } from "@/components/tickets/TicketListModal";
import { buildAgentHistory, type HistoryGranularity } from "@/lib/metrics/agentHistory";
import { buildAgentTrend, getTicketsInPeriod } from "@/lib/metrics/trends";
import { FALLBACK_LABEL, topNBy } from "@/lib/metrics/topN";
import { useTicketData } from "@/lib/context/TicketDataContext";
import { slaBadge } from "@/lib/format/slaBadge";

type Granularity = "day" | HistoryGranularity;

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day", label: "Diário" },
  { value: "month", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

const GRANULARITY_NOUN: Record<Granularity, string> = { day: "dia", month: "mês", semester: "semestre" };

function AgentTrendsContent() {
  const { metrics, tickets, allTickets, selectedAgent } = useTicketData();
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<Date | null>(null);
  const [selectedVolumePeriod, setSelectedVolumePeriod] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const agentTickets = useMemo(
    () => (selectedAgent ? tickets.filter((t) => t.agent === selectedAgent) : []),
    [tickets, selectedAgent]
  );

  const trend = useMemo(() => {
    if (!selectedAgent) return [];
    if (granularity === "day") return buildAgentTrend(tickets, selectedAgent);
    return buildAgentHistory(allTickets, selectedAgent, granularity);
  }, [tickets, allTickets, selectedAgent, granularity]);

  const topCategories = useMemo(() => topNBy(agentTickets, (t) => t.category, 5), [agentTickets]);
  const topDepartments = useMemo(() => topNBy(agentTickets, (t) => t.department, 5), [agentTickets]);

  if (!metrics) return null;

  if (!selectedAgent) {
    return (
      <div className="glass-card p-8 text-center text-sm text-[var(--text-muted)]">
        Selecione um agente no topo da página para ver as tendências.
      </div>
    );
  }

  const granularityLabel = GRANULARITY_NOUN[granularity];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tendências do agente</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Evolução dos chamados de{" "}
            <span className="font-semibold text-[var(--text-primary)]">{selectedAgent}</span>
            {granularity === "day"
              ? " ao longo do período coberto pelo arquivo importado."
              : " — histórico completo do arquivo importado, ignorando os filtros de período/área/mundo do topo (o objetivo aqui é olhar o longo prazo)."}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] p-1">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setGranularity(option.value);
                setSelectedTrendPeriod(null);
                setSelectedVolumePeriod(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                granularity === option.value
                  ? "bg-[var(--accent-glow)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Volume de chamados por {granularityLabel}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Clique num ponto pra ver os chamados.</p>
          <div className="mt-4">
            <TrendLineChart
              data={trend}
              metric="count"
              label="Chamados"
              color="var(--series-7)"
              onSelectPeriod={setSelectedVolumePeriod}
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">SLA de resolução por {granularityLabel}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Clique num ponto pra ver os chamados de{" "}{selectedAgent} do {granularityLabel} correspondente.
          </p>
          <div className="mt-4">
            <TrendLineChart
              data={trend}
              metric="slaPercentage"
              label="SLA"
              color="var(--series-3)"
              valueFormatter={(v) => `${v.toFixed(0)}%`}
              onSelectPeriod={setSelectedTrendPeriod}
            />
          </div>
        </div>
      </div>

      {selectedTrendPeriod && (
        <TicketListModal
          title={`SLA de resolução de ${selectedAgent} · ${selectedTrendPeriod.toLocaleDateString("pt-BR")}`}
          tickets={getTicketsInPeriod(
            granularity === "day" ? tickets : allTickets,
            selectedTrendPeriod,
            granularity
          ).filter((t) => t.agent === selectedAgent && t.resolutionSlaStatus !== null)}
          badgeColumnLabel="SLA"
          renderBadge={(t) => slaBadge(t.resolutionSlaStatus)}
          onClose={() => setSelectedTrendPeriod(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Categorias mais atendidas</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Clique numa barra pra ver os chamados.</p>
          <div className="mt-4">
            <CategoryBreakdownChart data={topCategories} onSelect={setSelectedCategory} />
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Departamentos mais atendidos</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Clique numa barra pra ver os chamados.</p>
          <div className="mt-4">
            <CategoryBreakdownChart data={topDepartments} onSelect={setSelectedDepartment} />
          </div>
        </div>
      </div>

      {selectedVolumePeriod && (
        <TicketListModal
          title={`Chamados de ${selectedAgent} · ${selectedVolumePeriod.toLocaleDateString("pt-BR")}`}
          tickets={getTicketsInPeriod(
            granularity === "day" ? tickets : allTickets,
            selectedVolumePeriod,
            granularity
          ).filter((t) => t.agent === selectedAgent)}
          onClose={() => setSelectedVolumePeriod(null)}
        />
      )}

      {selectedCategory && (
        <TicketListModal
          title={`Categoria · ${selectedCategory}`}
          tickets={agentTickets.filter((t) => (t.category ?? FALLBACK_LABEL) === selectedCategory)}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {selectedDepartment && (
        <TicketListModal
          title={`Departamento · ${selectedDepartment}`}
          tickets={agentTickets.filter((t) => (t.department ?? FALLBACK_LABEL) === selectedDepartment)}
          onClose={() => setSelectedDepartment(null)}
        />
      )}
    </div>
  );
}

export default function AgentTrendsPage() {
  return (
    <RequireData>
      <AgentTrendsContent />
    </RequireData>
  );
}
