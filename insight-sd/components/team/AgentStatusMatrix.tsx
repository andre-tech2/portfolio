import type { AgentStatusCell } from "@/lib/metrics/types";

interface AgentStatusMatrixProps {
  data: AgentStatusCell[];
  onSelect?: (agent: string, status: string) => void;
}

/** Status nas linhas, agente nas colunas — geralmente há bem menos agentes do que status possíveis,
 * então essa orientação cabe em telas normais sem precisar de scroll horizontal. */
export function AgentStatusMatrix({ data, onSelect }: AgentStatusMatrixProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhum chamado no período.</p>;
  }

  const agentTotals = new Map<string, number>();
  for (const cell of data) agentTotals.set(cell.agent, (agentTotals.get(cell.agent) ?? 0) + cell.count);
  const agents = Array.from(agentTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([agent]) => agent);

  const statusTotals = new Map<string, number>();
  for (const cell of data) statusTotals.set(cell.status, (statusTotals.get(cell.status) ?? 0) + cell.count);
  const statuses = Array.from(statusTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status]) => status);

  function countFor(agent: string, status: string): number {
    return data.find((c) => c.agent === agent && c.status === status)?.count ?? 0;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <th className="w-[18%] pb-2 pr-2">Status</th>
            <th className="pb-2 pr-2 text-right">Total</th>
            {agents.map((agent) => (
              <th key={agent} className="truncate pb-2 pr-2 text-right" title={agent}>
                {agent}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statuses.map((status) => (
            <tr key={status} className="border-b border-[var(--border-hairline)] last:border-0">
              <td className="truncate py-2.5 pr-2 font-medium" title={status}>
                {status}
              </td>
              <td className="text-tabular py-2.5 pr-2 text-right font-semibold">{statusTotals.get(status)}</td>
              {agents.map((agent) => {
                const count = countFor(agent, status);
                const clickable = onSelect && count > 0;
                return (
                  <td
                    key={agent}
                    onClick={clickable ? () => onSelect(agent, status) : undefined}
                    className={`text-tabular py-2.5 pr-2 text-right text-[var(--text-secondary)] ${clickable ? "cursor-pointer hover:underline" : ""}`}
                  >
                    {count || "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
