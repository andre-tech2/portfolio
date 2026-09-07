"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgentComparison } from "@/lib/metrics/types";

export type ComparisonTarget = "agent" | "team";

interface MetricConfig {
  key: string;
  label: string;
  description: string;
  agentValue: number | null;
  teamValue: number | null;
  unit: string;
  format: (v: number) => string;
  /** Pra tempo de resolução, menor é melhor — inverte a leitura de "acima"/"abaixo". */
  higherIsBetter: boolean;
  /** Se definido, as barras ficam clicáveis e mostram os chamados por trás do número. */
  onSelect?: (target: ComparisonTarget) => void;
}

function DeltaBadge({ agentValue, teamValue, higherIsBetter }: { agentValue: number; teamValue: number; higherIsBetter: boolean }) {
  if (teamValue === 0) return null;
  const diffPct = ((agentValue - teamValue) / teamValue) * 100;
  const isAbove = diffPct >= 0;
  const isBetter = higherIsBetter ? isAbove : !isAbove;
  const color = Math.abs(diffPct) < 3 ? "var(--text-muted)" : isBetter ? "var(--status-good)" : "var(--status-critical)";
  const arrow = isAbove ? "▲" : "▼";

  return (
    <span className="text-xs font-semibold" style={{ color }}>
      {arrow} {Math.abs(diffPct).toFixed(0)}% {isAbove ? "acima" : "abaixo"} da média
    </span>
  );
}

function MetricComparison({ config }: { config: MetricConfig }) {
  if (config.agentValue === null || config.teamValue === null) {
    return (
      <div className="glass-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{config.label}</p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{config.description}</p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Sem dados suficientes.</p>
      </div>
    );
  }

  const data = [
    { name: "Agente", value: config.agentValue, fill: "var(--series-7)" },
    { name: "Equipe", value: config.teamValue, fill: "var(--series-1)" },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{config.label}</p>
        <DeltaBadge agentValue={config.agentValue} teamValue={config.teamValue} higherIsBetter={config.higherIsBetter} />
      </div>
      <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{config.description}</p>
      {config.onSelect && (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">Clique numa barra pra ver os chamados.</p>
      )}
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={64} stroke="var(--text-muted)" fontSize={12} />
          <Tooltip
            cursor={{ fill: "rgba(20,21,26,0.04)" }}
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
            itemStyle={{ color: "var(--text-secondary)" }}
            formatter={(value) => [config.format(Number(value)), config.label]}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            cursor={config.onSelect ? "pointer" : undefined}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.fill}
                onClick={config.onSelect ? () => config.onSelect!(entry.name === "Agente" ? "agent" : "team") : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type ComparisonMetricKey = "volume" | "closed" | "resolution" | "first-response-sla" | "sla" | "csat";

interface AgentComparisonChartProps {
  comparison: AgentComparison;
  onSelectMetric?: (key: ComparisonMetricKey, target: ComparisonTarget) => void;
}

export function AgentComparisonChart({ comparison, onSelectMetric }: AgentComparisonChartProps) {
  const configs: MetricConfig[] = [
    {
      key: "volume",
      label: "Volume de chamados",
      description: "Total de chamados atendidos no período.",
      agentValue: comparison.agentStat.volume,
      teamValue: comparison.teamAverage.volume,
      unit: "chamados",
      format: (v) => `${v.toFixed(0)} chamados`,
      higherIsBetter: true,
      onSelect: onSelectMetric ? (target) => onSelectMetric("volume", target) : undefined,
    },
    {
      key: "closed",
      label: "Chamados fechados",
      description: "Encerrados ou resolvidos no período — cancelados não contam como entrega.",
      agentValue: comparison.agentStat.closedCount,
      teamValue: comparison.teamAverage.closedCount,
      unit: "chamados",
      format: (v) => `${v.toFixed(0)} chamados`,
      higherIsBetter: true,
      onSelect: onSelectMetric ? (target) => onSelectMetric("closed", target) : undefined,
    },
    {
      key: "resolution",
      label: "Tempo médio de resolução",
      description: "Tempo médio até resolver um chamado, do início ao fim. Menor é melhor.",
      agentValue: comparison.agentStat.avgResolutionHours,
      teamValue: comparison.teamAverage.avgResolutionHours,
      unit: "horas",
      format: (v) => `${v.toFixed(1)}h`,
      higherIsBetter: false,
      onSelect: onSelectMetric ? (target) => onSelectMetric("resolution", target) : undefined,
    },
    {
      key: "first-response-sla",
      label: "SLA de 1ª resposta",
      description: "% de chamados com a primeira resposta dentro do prazo combinado.",
      agentValue: comparison.agentStat.firstResponseSlaPercentage,
      teamValue: comparison.teamAverage.firstResponseSlaPercentage,
      unit: "%",
      format: (v) => `${v.toFixed(0)}%`,
      higherIsBetter: true,
      onSelect: onSelectMetric ? (target) => onSelectMetric("first-response-sla", target) : undefined,
    },
    {
      key: "sla",
      label: "SLA de resolução",
      description: "% de chamados resolvidos dentro do prazo combinado.",
      agentValue: comparison.agentStat.slaPercentage,
      teamValue: comparison.teamAverage.slaPercentage,
      unit: "%",
      format: (v) => `${v.toFixed(0)}%`,
      higherIsBetter: true,
      onSelect: onSelectMetric ? (target) => onSelectMetric("sla", target) : undefined,
    },
    {
      key: "csat",
      label: "Satisfação (CSAT)",
      description: "Nota média das pesquisas de satisfação respondidas pelo cliente (0 a 5).",
      agentValue: comparison.agentStat.avgSatisfaction,
      teamValue: comparison.teamAverage.avgSatisfaction,
      unit: "",
      format: (v) => `${v.toFixed(1)} / 5`,
      higherIsBetter: true,
      onSelect: onSelectMetric ? (target) => onSelectMetric("csat", target) : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {configs.map((config) => (
        <MetricComparison key={config.key} config={config} />
      ))}
    </div>
  );
}
