"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RequireData } from "@/components/layout/RequireData";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { buildRecommendations } from "@/lib/metrics/recommendations";
import { useTicketData } from "@/lib/context/TicketDataContext";

function RecommendationsContent() {
  const { metrics, tickets, slaGoals, resolvedRecommendations, resolveRecommendation, reopenRecommendation } =
    useTicketData();
  const recommendations = useMemo(
    () => (metrics ? buildRecommendations(metrics, tickets, slaGoals) : []),
    [metrics, tickets, slaGoals]
  );

  if (!metrics) return null;

  const activeRecommendations = recommendations.filter((r) => !resolvedRecommendations[r.id]).slice(0, 10);
  const resolvedEntries = Object.entries(resolvedRecommendations)
    .map(([id, resolution]) => ({
      id,
      title: resolution.title,
      resolvedAt: resolution.resolvedAt,
      stillActive: recommendations.some((r) => r.id === id),
    }))
    .sort((a, b) => b.resolvedAt.getTime() - a.resolvedAt.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recomendações</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Dicas geradas automaticamente a partir dos dados importados — sem IA, calculadas por regras a
          partir de SLA, volume e concentração de chamados. Meta de SLA: {slaGoals.target}% (crítico
          abaixo de {slaGoals.critical}%). Ajuste em{" "}
          <Link href="/settings" className="underline hover:text-[var(--text-primary)]">
            Configurações
          </Link>
          .
        </p>
      </div>

      {activeRecommendations.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-[var(--text-muted)]">
          Nenhum ponto de atenção identificado com os limiares atuais — os indicadores do time estão
          saudáveis.
        </div>
      ) : (
        <div className="space-y-3">
          {activeRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onResolve={() => resolveRecommendation(rec.id, rec.title)}
            />
          ))}
        </div>
      )}

      {resolvedEntries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-muted)]">
            Resolvidas ({resolvedEntries.length})
          </h2>
          <div className="mt-2 space-y-1">
            {resolvedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-hairline)] px-3 py-2 text-xs text-[var(--text-muted)]"
              >
                <span>
                  {entry.title} — resolvida em {entry.resolvedAt.toLocaleDateString("pt-BR")}
                  {entry.stillActive && (
                    <span className="ml-2 font-semibold text-[var(--status-warning)]">
                      · ainda aparece nos dados atuais
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => reopenRecommendation(entry.id)}
                  className="shrink-0 underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
                >
                  Reabrir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <RequireData>
      <RecommendationsContent />
    </RequireData>
  );
}
