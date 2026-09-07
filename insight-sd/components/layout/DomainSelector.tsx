"use client";

import { useTicketData } from "@/lib/context/TicketDataContext";
import { DOMAIN_LABELS, type TicketDomainFilter } from "@/lib/ticketDomain";

const OPTIONS: TicketDomainFilter[] = ["all", "atendimento", "maquinas"];

export function DomainSelector() {
  const { selectedDomain, setSelectedDomain } = useTicketData();

  return (
    <select
      value={selectedDomain}
      onChange={(e) => setSelectedDomain(e.target.value as TicketDomainFilter)}
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
      title="Separa chamados sobre a máquina física (troca, defeito, upgrade) de chamados de atendimento em geral"
    >
      {OPTIONS.map((domain) => (
        <option key={domain} value={domain}>
          {DOMAIN_LABELS[domain]}
        </option>
      ))}
    </select>
  );
}
