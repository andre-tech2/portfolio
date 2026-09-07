"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import type { SlaGoals } from "@/lib/settings/slaGoals";

interface SlaGaugeChartProps {
  label: string;
  percentage: number | null;
  goals: SlaGoals;
  onSelect?: () => void;
}

function colorFor(pct: number, goals: SlaGoals): string {
  if (pct >= goals.target) return "var(--status-good)";
  if (pct >= goals.critical) return "var(--status-warning)";
  return "var(--status-critical)";
}

export function SlaGaugeChart({ label, percentage, goals, onSelect }: SlaGaugeChartProps) {
  if (percentage === null) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados de SLA.</p>;
  }

  const color = colorFor(percentage, goals);
  const data = [{ name: label, value: percentage, fill: color }];

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className="relative flex flex-col items-center disabled:cursor-default"
      title={onSelect ? "Ver chamados" : undefined}
    >
      <RadialBarChart
        width={200}
        height={140}
        cx="50%"
        cy="100%"
        innerRadius={80}
        outerRadius={120}
        barSize={16}
        startAngle={180}
        endAngle={0}
        data={data}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" background={{ fill: "var(--surface-2)" }} cornerRadius={8} />
      </RadialBarChart>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-tabular text-3xl font-bold" style={{ color }}>
          {percentage.toFixed(1)}%
        </span>
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
    </button>
  );
}
