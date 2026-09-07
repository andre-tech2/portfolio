"use client";

import { useState } from "react";
import { TopListBarChart } from "@/components/charts/TopListBarChart";
import { PriorityStatusMatrix } from "@/components/critical/PriorityStatusMatrix";
import { StatusBreakdownGrid } from "@/components/critical/StatusBreakdownGrid";
import { TicketListModal } from "@/components/tickets/TicketListModal";
import { KpiCard } from "@/components/kpi/KpiCard";
import { RequireData } from "@/components/layout/RequireData";
import { AGING_BUCKETS, STALE_THRESHOLD_HOURS, getTicketsInAgingBucket } from "@/lib/metrics/backlogAging";
import { useTicketData } from "@/lib/context/TicketDataContext";
import { formatDuration as formatHours } from "@/lib/format/duration";

function CriticalContent() {
  const { metrics, tickets } = useTicketData();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<string | null>(null);
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ priority: string; status: string } | null>(null);
  const [selectedAgentBacklogCell, setSelectedAgentBacklogCell] = useState<{ agent: string; bucketLabel: string } | null>(
    null
  );
  if (!metrics) return null;

  const agingEntries = metrics.backlogAging.map((bucket) => ({
    key: bucket.label,
    count: bucket.count,
    percentage: metrics.openTicketsCount > 0 ? (bucket.count / metrics.openTicketsCount) * 100 : 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Crítico Agora</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          O que precisa de atenção imediata: chamados parados, solicitantes VIP em risco e chamados
          sem agente atribuído.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Chamados em aberto"
          value={metrics.openTicketsCount.toLocaleString("pt-BR")}
          hint="Total ainda não encerrado"
          accent="blue"
        />
        <KpiCard
          label="Chamados parados"
          value={metrics.staleTotalCount.toLocaleString("pt-BR")}
          hint={`Sem atualização há mais de ${STALE_THRESHOLD_HOURS}h`}
          accent="red"
        />
        <KpiCard
          label="VIP em risco"
          value={metrics.vipTotalCount.toLocaleString("pt-BR")}
          hint="Atrasados ou ainda em aberto"
          accent="amber"
        />
        <KpiCard
          label="Sem agente atribuído"
          value={metrics.unassignedTotalCount.toLocaleString("pt-BR")}
          hint="Ainda em aberto"
          accent="violet"
        />
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Aging do backlog</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Chamados em aberto agora, por tempo total desde a criação. Clique numa faixa pra ver os
          chamados e quem é o agente responsável.
        </p>
        <div className="mt-4">
          <TopListBarChart data={agingEntries} onSelect={setSelectedAgingBucket} />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Prioridade × Status</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Onde os chamados em aberto estão travados, cruzando prioridade e status. Clique numa célula
          pra ver os chamados.
        </p>
        <div className="mt-4">
          <PriorityStatusMatrix
            data={metrics.priorityStatusMatrix}
            onSelect={(priority, status) => setSelectedMatrixCell({ priority, status })}
          />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Backlog por agente</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Chamados em aberto agora, por agente responsável e tempo desde a criação. Clique num número
          pra ver os chamados.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="pb-2 pr-4">Agente</th>
                <th className="pb-2 pr-4 text-right">Total</th>
                {AGING_BUCKETS.map((b) => (
                  <th key={b.label} className="pb-2 pr-4 text-right">
                    {b.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.agentBacklog.length === 0 && (
                <tr>
                  <td colSpan={2 + AGING_BUCKETS.length} className="py-6 text-center text-[var(--text-muted)]">
                    Nenhum chamado em aberto no momento.
                  </td>
                </tr>
              )}
              {metrics.agentBacklog.map((row) => (
                <tr key={row.agent} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4">{row.agent}</td>
                  <td className="text-tabular py-2.5 pr-4 text-right font-semibold">{row.total}</td>
                  {row.buckets.map((count, i) => {
                    const clickable = count > 0;
                    return (
                      <td
                        key={AGING_BUCKETS[i].label}
                        onClick={
                          clickable
                            ? () => setSelectedAgentBacklogCell({ agent: row.agent, bucketLabel: AGING_BUCKETS[i].label })
                            : undefined
                        }
                        className={`text-tabular py-2.5 pr-4 text-right ${clickable ? "cursor-pointer hover:underline" : ""}`}
                        style={{ color: i >= 3 && count > 0 ? "var(--status-critical)" : "var(--text-secondary)" }}
                      >
                        {count > 0 ? count : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Chamados parados</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Ainda abertos e sem nenhuma atualização há mais de {STALE_THRESHOLD_HOURS}h — risco de ficarem
          esquecidos mesmo que o prazo de SLA ainda não tenha vencido.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="pb-2 pr-4">Ticket</th>
                <th className="pb-2 pr-4">Assunto</th>
                <th className="pb-2 pr-4">Agente</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 text-right">Parado há</th>
              </tr>
            </thead>
            <tbody>
              {metrics.staleTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                    Nenhum chamado parado identificado.
                  </td>
                </tr>
              )}
              {metrics.staleTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4 text-[var(--text-muted)]">#{ticket.id}</td>
                  <td className="py-2.5 pr-4">{ticket.subject}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.agent}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.status}</td>
                  <td className="text-tabular py-2.5 text-right font-semibold" style={{ color: "var(--status-critical)" }}>
                    {formatHours(ticket.hoursSinceUpdate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Solicitantes VIP em risco</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Chamados marcados como VIP que violaram o SLA ou ainda estão em aberto.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="pb-2 pr-4">Ticket</th>
                <th className="pb-2 pr-4">Assunto</th>
                <th className="pb-2 pr-4">Solicitante</th>
                <th className="pb-2 pr-4">Agente</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 text-right">Duração</th>
              </tr>
            </thead>
            <tbody>
              {metrics.vipAtRiskTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                    Nenhum chamado VIP em risco no momento.
                  </td>
                </tr>
              )}
              {metrics.vipAtRiskTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4 text-[var(--text-muted)]">#{ticket.id}</td>
                  <td className="py-2.5 pr-4">{ticket.subject}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.requesterName ?? "—"}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.agent}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.status}</td>
                  <td
                    className="text-tabular py-2.5 text-right font-semibold"
                    style={{ color: ticket.isOverdue ? "var(--status-critical)" : "var(--status-warning)" }}
                  >
                    {formatHours(ticket.hoursOpen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Chamados por status</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Todos os status do período, incluindo os já encerrados. Clique num status pra ver os chamados.
        </p>
        <div className="mt-4">
          <StatusBreakdownGrid data={metrics.statusBreakdown} onSelect={setSelectedStatus} />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Sem agente atribuído</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Chamados ainda abertos que nunca foram atribuídos a um agente.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="pb-2 pr-4">Ticket</th>
                <th className="pb-2 pr-4">Assunto</th>
                <th className="pb-2 pr-4">Prioridade</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 text-right">Aberto há</th>
              </tr>
            </thead>
            <tbody>
              {metrics.unassignedTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                    Nenhum chamado sem agente no momento.
                  </td>
                </tr>
              )}
              {metrics.unassignedTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="py-2.5 pr-4 text-[var(--text-muted)]">#{ticket.id}</td>
                  <td className="py-2.5 pr-4">{ticket.subject}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.priority}</td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{ticket.status}</td>
                  <td className="text-tabular py-2.5 text-right font-semibold" style={{ color: "var(--status-warning)" }}>
                    {formatHours(ticket.hoursOpen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStatus && (
        <TicketListModal
          title={selectedStatus}
          tickets={tickets.filter((t) => t.status === selectedStatus)}
          onClose={() => setSelectedStatus(null)}
        />
      )}

      {selectedAgingBucket && (
        <TicketListModal
          title={`Backlog · ${selectedAgingBucket}`}
          tickets={getTicketsInAgingBucket(tickets, selectedAgingBucket)}
          onClose={() => setSelectedAgingBucket(null)}
        />
      )}

      {selectedAgentBacklogCell && (
        <TicketListModal
          title={`Backlog · ${selectedAgentBacklogCell.agent} · ${selectedAgentBacklogCell.bucketLabel}`}
          tickets={getTicketsInAgingBucket(tickets, selectedAgentBacklogCell.bucketLabel).filter(
            (t) => t.agent === selectedAgentBacklogCell.agent
          )}
          onClose={() => setSelectedAgentBacklogCell(null)}
        />
      )}

      {selectedMatrixCell && (
        <TicketListModal
          title={`${selectedMatrixCell.priority} · ${selectedMatrixCell.status}`}
          tickets={tickets.filter(
            (t) => t.priority === selectedMatrixCell.priority && t.status === selectedMatrixCell.status
          )}
          onClose={() => setSelectedMatrixCell(null)}
        />
      )}
    </div>
  );
}

export default function CriticalPage() {
  return (
    <RequireData>
      <CriticalContent />
    </RequireData>
  );
}
