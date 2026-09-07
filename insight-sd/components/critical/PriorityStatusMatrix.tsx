import type { PriorityStatusCell } from "@/lib/metrics/types";

const PRIORITY_ORDER = ["Urgente", "Alta", "Média", "Baixa"];

function priorityColor(priority: string, count: number): string {
  if (count === 0) return "var(--text-muted)";
  if (priority === "Urgente") return "var(--status-critical)";
  if (priority === "Alta") return "var(--status-warning)";
  return "var(--text-primary)";
}

interface PriorityStatusMatrixProps {
  data: PriorityStatusCell[];
  onSelect?: (priority: string, status: string) => void;
}

export function PriorityStatusMatrix({ data, onSelect }: PriorityStatusMatrixProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhum chamado em aberto.</p>;
  }

  const priorities = [
    ...PRIORITY_ORDER.filter((p) => data.some((c) => c.priority === p)),
    ...Array.from(new Set(data.map((c) => c.priority))).filter((p) => !PRIORITY_ORDER.includes(p)),
  ];

  const statusTotals = new Map<string, number>();
  for (const cell of data) statusTotals.set(cell.status, (statusTotals.get(cell.status) ?? 0) + cell.count);
  const statuses = Array.from(statusTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status]) => status);

  function countFor(priority: string, status: string): number {
    return data.find((c) => c.priority === priority && c.status === status)?.count ?? 0;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <th className="pb-2 pr-4">Prioridade</th>
            {statuses.map((status) => (
              <th key={status} className="pb-2 pr-4 text-right">
                {status}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {priorities.map((priority) => (
            <tr key={priority} className="border-b border-[var(--border-hairline)] last:border-0">
              <td className="py-2.5 pr-4 font-medium">{priority}</td>
              {statuses.map((status) => {
                const count = countFor(priority, status);
                const clickable = onSelect && count > 0;
                return (
                  <td
                    key={status}
                    onClick={clickable ? () => onSelect(priority, status) : undefined}
                    className={`text-tabular py-2.5 pr-4 text-right font-semibold ${clickable ? "cursor-pointer hover:underline" : ""}`}
                    style={{ color: priorityColor(priority, count) }}
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
