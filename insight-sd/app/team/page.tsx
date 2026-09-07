"use client";

import { useState } from "react";
import { ActivityHeatmap, WEEKDAY_LABELS } from "@/components/charts/ActivityHeatmap";
import { AgentHealthChart } from "@/components/charts/AgentHealthChart";
import { SatisfactionBarChart } from "@/components/charts/SatisfactionBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { RequireData } from "@/components/layout/RequireData";
import { AgentRankingTable } from "@/components/team/AgentRankingTable";
import { AgentStatusMatrix } from "@/components/team/AgentStatusMatrix";
import { TicketListModal } from "@/components/tickets/TicketListModal";
import { useTicketData } from "@/lib/context/TicketDataContext";
import { slaBadge } from "@/lib/format/slaBadge";
import { getTicketsInPeriod } from "@/lib/metrics/trends";
import { FALLBACK_LABEL } from "@/lib/metrics/topN";

function TeamContent() {
  const { metrics, tickets, slaGoals } = useTicketData();
  const [selectedCsatCategory, setSelectedCsatCategory] = useState<string | null>(null);
  const [selectedSlaDay, setSelectedSlaDay] = useState<Date | null>(null);
  const [selectedVolumeDay, setSelectedVolumeDay] = useState<Date | null>(null);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ weekday: number; hour: number } | null>(null);
  const [selectedAgentStatusCell, setSelectedAgentStatusCell] = useState<{ agent: string; status: string } | null>(
    null
  );
  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Ranking dos agentes, tendência do time e horários de maior volume — visão de gestor pra
          comparar desempenho e planejar escala.
        </p>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ranking da equipe</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Clique numa coluna pra ordenar. Cores de SLA/CSAT seguem o mesmo padrão do resto do app.
        </p>
        <div className="mt-4">
          <AgentRankingTable agentStats={metrics.agentStats} slaGoals={slaGoals} />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Índice de saúde do agente</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Combina SLA de resolução (50%), CSAT (30%) e taxa de atraso (20%) num único número de 0 a
          100 — pra leitura rápida. Métrica sem dados suficientes (ex: sem respostas de CSAT) é
          excluída do cálculo daquele agente.
        </p>
        <div className="mt-4">
          <AgentHealthChart data={metrics.agentHealthScores} />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Chamados por status, por agente</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Todos os chamados do período (abertos e encerrados), cruzando agente e status. Clique numa
          célula pra ver os chamados.
        </p>
        <div className="mt-4">
          <AgentStatusMatrix
            data={metrics.agentStatusMatrix}
            onSelect={(agent, status) => setSelectedAgentStatusCell({ agent, status })}
          />
        </div>
      </div>

      {selectedAgentStatusCell && (
        <TicketListModal
          title={`${selectedAgentStatusCell.agent} · ${selectedAgentStatusCell.status}`}
          tickets={tickets.filter(
            (t) => t.agent === selectedAgentStatusCell.agent && t.status === selectedAgentStatusCell.status
          )}
          onClose={() => setSelectedAgentStatusCell(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Volume do time por dia</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Clique num dia pra ver os chamados dele.</p>
          <div className="mt-4">
            <TrendLineChart
              data={metrics.teamTrend}
              metric="count"
              label="Chamados"
              color="var(--series-1)"
              onSelectPeriod={setSelectedVolumeDay}
            />
          </div>
        </div>
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">SLA do time por dia</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Clique num dia pra ver os chamados dele.</p>
          <div className="mt-4">
            <TrendLineChart
              data={metrics.teamTrend}
              metric="slaPercentage"
              label="SLA"
              color="var(--series-3)"
              valueFormatter={(v) => `${v.toFixed(0)}%`}
              onSelectPeriod={setSelectedSlaDay}
            />
          </div>
        </div>
      </div>

      {selectedSlaDay && (
        <TicketListModal
          title={`SLA de resolução · ${selectedSlaDay.toLocaleDateString("pt-BR")}`}
          tickets={getTicketsInPeriod(tickets, selectedSlaDay, "day").filter((t) => t.resolutionSlaStatus !== null)}
          badgeColumnLabel="SLA"
          renderBadge={(t) => slaBadge(t.resolutionSlaStatus)}
          onClose={() => setSelectedSlaDay(null)}
        />
      )}

      {selectedVolumeDay && (
        <TicketListModal
          title={`Chamados · ${selectedVolumeDay.toLocaleDateString("pt-BR")}`}
          tickets={getTicketsInPeriod(tickets, selectedVolumeDay, "day")}
          onClose={() => setSelectedVolumeDay(null)}
        />
      )}

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Volume por dia da semana e horário</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Útil pra planejar escala — passe o mouse numa célula pra ver o número exato de chamados.
        </p>
        <div className="mt-4">
          <ActivityHeatmap
            data={metrics.heatmap}
            onSelect={(weekday, hour) => setSelectedHeatmapCell({ weekday, hour })}
          />
        </div>
      </div>

      {selectedHeatmapCell && (
        <TicketListModal
          title={`${WEEKDAY_LABELS[selectedHeatmapCell.weekday]} · ${String(selectedHeatmapCell.hour).padStart(2, "0")}h`}
          tickets={tickets.filter(
            (t) =>
              t.createdAt !== null &&
              t.createdAt.getDay() === selectedHeatmapCell.weekday &&
              t.createdAt.getHours() === selectedHeatmapCell.hour
          )}
          onClose={() => setSelectedHeatmapCell(null)}
        />
      )}

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Satisfação por categoria (CSAT)</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Categorias com menos de 3 respostas de pesquisa não entram aqui pra evitar ruído. Clique numa
          barra pra ver os chamados que responderam a pesquisa nessa categoria.
          {metrics.csatResponseRate !== null && (
            <> Só {metrics.csatResponseRate.toFixed(0)}% dos chamados encerrados recebem resposta de pesquisa — leve isso em conta antes de tirar conclusões fortes.</>
          )}
        </p>
        <div className="mt-4">
          <SatisfactionBarChart data={metrics.satisfactionByCategory} onSelect={setSelectedCsatCategory} />
        </div>
      </div>

      {selectedCsatCategory && (
        <TicketListModal
          title={`CSAT · ${selectedCsatCategory}`}
          tickets={tickets.filter(
            (t) => (t.category ?? FALLBACK_LABEL) === selectedCsatCategory && t.satisfaction !== null
          )}
          badgeColumnLabel="Nota"
          renderBadge={(t) =>
            t.satisfaction === null
              ? null
              : {
                  text: `${t.satisfaction}/5`,
                  tone: t.satisfaction >= 4.2 ? "good" : t.satisfaction >= 3.5 ? "muted" : "critical",
                }
          }
          onClose={() => setSelectedCsatCategory(null)}
        />
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <RequireData>
      <TeamContent />
    </RequireData>
  );
}
