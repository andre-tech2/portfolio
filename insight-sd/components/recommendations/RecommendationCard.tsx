"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/metrics/types";
import { TicketListModal } from "@/components/tickets/TicketListModal";

const SEVERITY_STYLE: Record<Recommendation["severity"], { color: string; label: string; icon: string }> = {
  critical: { color: "var(--status-critical)", label: "Crítico", icon: "⛔" },
  warning: { color: "var(--status-warning)", label: "Atenção", icon: "⚠️" },
  info: { color: "var(--status-good)", label: "Oportunidade", icon: "💡" },
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onResolve?: () => void;
}

export function RecommendationCard({ recommendation, onResolve }: RecommendationCardProps) {
  const style = SEVERITY_STYLE[recommendation.severity];
  const [showTickets, setShowTickets] = useState(false);
  const hasTickets = (recommendation.relatedTickets?.length ?? 0) > 0;

  return (
    <div className="glass-card flex gap-4 p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: `${style.color}22`, border: `1px solid ${style.color}55` }}
      >
        {style.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: `${style.color}22`, color: style.color }}
          >
            {style.label}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{recommendation.impactCount} chamados afetados</span>
        </div>
        <h3 className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">{recommendation.title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{recommendation.description}</p>
        <div className="mt-3 flex items-center gap-4">
          {hasTickets && (
            <button
              type="button"
              onClick={() => setShowTickets(true)}
              className="text-xs font-semibold underline-offset-2 hover:underline"
              style={{ color: style.color }}
            >
              Ver chamados
            </button>
          )}
          {onResolve && (
            <button
              type="button"
              onClick={onResolve}
              className="text-xs font-semibold text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
            >
              Marcar como resolvido
            </button>
          )}
        </div>
      </div>

      {showTickets && recommendation.relatedTickets && (
        <TicketListModal
          title={recommendation.title}
          tickets={recommendation.relatedTickets}
          onClose={() => setShowTickets(false)}
        />
      )}
    </div>
  );
}
