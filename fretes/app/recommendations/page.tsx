"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { buildRecommendations } from "@/lib/metrics/recommendations";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

export default function RecommendationsPage() {
  const { metrics, shipments, deliveryGoals, isLoading } = useShipmentData();
  const recommendations = useMemo(() => (metrics ? buildRecommendations(metrics, shipments) : []), [metrics, shipments]);

  if (isLoading) return <p className="text-[var(--text-muted)]">Carregando…</p>;
  if (!metrics) return <p className="text-[var(--text-muted)]">Sem envios no período/região selecionados.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Recomendações</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Pontos de atenção gerados automaticamente a partir dos dados — sem IA, calculados por regras a partir de
          % no prazo, ocorrência e custo de frete. Meta: {deliveryGoals.onTimeTarget}% no prazo (crítico abaixo de{" "}
          {deliveryGoals.onTimeCritical}%). Ajuste em{" "}
          <Link href="/settings" className="underline hover:text-[var(--text-primary)]">
            Configurações
          </Link>
          .
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="solid-card p-8 text-center text-sm text-[var(--text-muted)]">
          Nenhum ponto de atenção identificado com os limiares atuais — os indicadores estão saudáveis.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
