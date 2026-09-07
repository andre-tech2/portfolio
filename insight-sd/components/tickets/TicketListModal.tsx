"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { exportTicketsToCsv } from "@/lib/export/exportTicketsCsv";
import { formatDuration as formatHours } from "@/lib/format/duration";
import { getOverdueDelayHours } from "@/lib/metrics/overdue";
import type { Ticket } from "@/lib/types/ticket";

export interface TicketBadge {
  text: string;
  tone: "critical" | "good" | "muted";
}

const TONE_STYLE: Record<TicketBadge["tone"], { color: string; pill: boolean }> = {
  critical: { color: "var(--status-critical)", pill: true },
  good: { color: "var(--status-good)", pill: true },
  muted: { color: "var(--text-muted)", pill: false },
};

interface TicketListModalProps {
  title: string;
  subtitle?: string;
  tickets: Ticket[];
  onClose: () => void;
  /** Cabeçalho da coluna da direita — "Atrasado" por padrão. */
  badgeColumnLabel?: string;
  /** Customiza a coluna da direita (ex: status de SLA, nota de CSAT) — por padrão mostra o atraso do chamado. */
  renderBadge?: (ticket: Ticket) => TicketBadge | null;
  emptyBadgeText?: string;
}

function defaultRenderBadge(ticket: Ticket, now: Date): TicketBadge | null {
  const delayHours = getOverdueDelayHours(ticket, now);
  return delayHours !== null ? { text: formatHours(delayHours), tone: "critical" } : null;
}

/** Modal genérico de "ver chamados" — reutilizado em toda parte do app que precisa sair do número agregado pra lista real. */
export function TicketListModal({
  title,
  subtitle,
  tickets,
  onClose,
  badgeColumnLabel = "Atrasado",
  renderBadge,
  emptyBadgeText = "No prazo",
}: TicketListModalProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const now = new Date();
  const resolveBadge = renderBadge ?? ((t: Ticket) => defaultRenderBadge(t, now));

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((t) => {
      const haystack = [t.id, t.subject, t.item, t.agent, t.status, t.priority, t.department, t.category]
        .filter((v): v is string => v !== null)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [tickets, search]);

  const rows = filteredTickets
    .map((ticket) => ({ ticket, badge: resolveBadge(ticket) }))
    .sort((a, b) => (b.badge !== null ? 1 : 0) - (a.badge !== null ? 1 : 0));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="glass-card flex max-h-[85vh] w-full max-w-3xl flex-col p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {subtitle ??
                (filteredTickets.length !== tickets.length
                  ? `${filteredTickets.length} de ${tickets.length} chamados.`
                  : `${tickets.length} ${tickets.length === 1 ? "chamado" : "chamados"}.`)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {filteredTickets.length > 0 && (
              <button
                type="button"
                onClick={() => exportTicketsToCsv(filteredTickets, title)}
                className="rounded-lg border border-[var(--border-hairline)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Exportar CSV
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-hairline)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Fechar
            </button>
          </div>
        </div>

        {tickets.length > 8 && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ticket, assunto, agente, status..."
            className="mt-4 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
          />
        )}

        <div className="mt-4 overflow-y-auto rounded-lg border border-[var(--border-hairline)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 bg-[var(--surface-2)]">
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Assunto</th>
                <th className="px-3 py-2">Agente</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2 text-right">{badgeColumnLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[var(--text-muted)]">
                    {tickets.length > 0 ? "Nenhum chamado bate com a busca." : "Nenhum chamado encontrado."}
                  </td>
                </tr>
              )}
              {rows.map(({ ticket, badge }) => (
                <tr key={ticket.id} className="border-b border-[var(--border-hairline)] last:border-0">
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">#{ticket.id}</td>
                  <td className="px-3 py-2.5">{ticket.subject ?? ticket.item ?? "Sem assunto"}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{ticket.agent}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{ticket.status}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{ticket.priority}</td>
                  <td className="px-3 py-2.5 text-right">
                    {badge ? (
                      TONE_STYLE[badge.tone].pill ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            background: `color-mix(in srgb, ${TONE_STYLE[badge.tone].color} 18%, transparent)`,
                            color: TONE_STYLE[badge.tone].color,
                          }}
                        >
                          {badge.text}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: TONE_STYLE[badge.tone].color }}>
                          {badge.text}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">{emptyBadgeText}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
}
