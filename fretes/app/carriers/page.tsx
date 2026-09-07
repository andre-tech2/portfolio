"use client";

import { CarrierHealthChart } from "@/components/charts/CarrierHealthChart";
import { CarrierRankingTable } from "@/components/carriers/CarrierRankingTable";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

export default function CarriersPage() {
  const { metrics, isLoading, deliveryGoals } = useShipmentData();

  if (isLoading) return <p className="text-[var(--text-muted)]">Carregando…</p>;
  if (!metrics) return <p className="text-[var(--text-muted)]">Sem envios no período/região selecionados.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Transportadoras</h1>

      <div className="solid-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Índice de saúde por transportadora</h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Combina % no prazo (peso 60%) e ausência de ocorrência (peso 40%) num único número.
        </p>
        <CarrierHealthChart data={metrics.carrierHealthScores} />
      </div>

      <div className="solid-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Ranking completo</h2>
        <CarrierRankingTable carrierStats={metrics.carrierStats} goals={deliveryGoals} />
      </div>
    </div>
  );
}
