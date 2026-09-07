"use client";

import { CarrierHealthChart } from "@/components/charts/CarrierHealthChart";
import { HorizontalBarList } from "@/components/charts/HorizontalBarList";
import { OnTimeTrendChart } from "@/components/charts/OnTimeTrendChart";
import { VolumeTrendChart } from "@/components/charts/VolumeTrendChart";
import { KpiCard } from "@/components/kpi/KpiCard";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercentage(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(0)}%`;
}

function formatDays(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)} dias`;
}

export default function OverviewPage() {
  const { metrics, isLoading } = useShipmentData();

  if (isLoading) return <p className="text-[var(--text-muted)]">Carregando…</p>;
  if (!metrics) return <p className="text-[var(--text-muted)]">Sem envios no período/região selecionados.</p>;

  const occurrencePercentage =
    metrics.totalShipments > 0 ? (metrics.occurrenceTotalCount / metrics.totalShipments) * 100 : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Visão Geral</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total de envios" value={String(metrics.totalShipments)} accent="orange" />
        <KpiCard
          label="No prazo"
          value={formatPercentage(metrics.onTimeOverall.percentage)}
          hint={`${metrics.onTimeOverall.onTime} de ${metrics.onTimeOverall.onTime + metrics.onTimeOverall.late} avaliados`}
          accent="blue"
        />
        <KpiCard label="Tempo médio de trânsito" value={formatDays(metrics.avgTransitDays)} accent="aqua" />
        <KpiCard label="Custo médio de frete" value={formatCurrency(metrics.avgFreightCost)} accent="amber" />
        <KpiCard
          label="Taxa de ocorrência"
          value={formatPercentage(occurrencePercentage)}
          hint={`${metrics.occurrenceTotalCount} ocorrências`}
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="solid-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Volume de envios por dia</h2>
          <VolumeTrendChart data={metrics.trend} />
        </div>
        <div className="solid-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">% no prazo por dia</h2>
          <OnTimeTrendChart data={metrics.trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="solid-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Transportadoras por índice de saúde</h2>
          <CarrierHealthChart data={metrics.carrierHealthScores} />
        </div>
        <div className="solid-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Principais motivos de ocorrência</h2>
          <HorizontalBarList data={metrics.topOccurrenceReasons} color="var(--series-8)" />
        </div>
      </div>
    </div>
  );
}
