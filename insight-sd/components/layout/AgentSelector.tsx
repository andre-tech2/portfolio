"use client";

import { useTicketData } from "@/lib/context/TicketDataContext";

export function AgentSelector() {
  const { metrics, selectedAgent, setSelectedAgent } = useTicketData();

  if (!metrics || metrics.agentStats.length === 0) return null;

  return (
    <select
      value={selectedAgent ?? ""}
      onChange={(e) => setSelectedAgent(e.target.value)}
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
    >
      {metrics.agentStats.map((agent) => (
        <option key={agent.agent} value={agent.agent}>
          {agent.agent}
        </option>
      ))}
    </select>
  );
}
