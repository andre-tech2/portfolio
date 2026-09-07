"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategorySatisfaction } from "@/lib/metrics/types";

function colorFor(score: number): string {
  if (score >= 4.2) return "var(--status-good)";
  if (score >= 3.5) return "var(--status-warning)";
  return "var(--status-critical)";
}

function truncate(label: string, max = 26): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function SatisfactionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategorySatisfaction }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;

  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-hairline)",
        borderRadius: 8,
        padding: "8px 10px",
        maxWidth: 220,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{entry.key}</p>
      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
        {entry.avgSatisfaction.toFixed(1)} / 5 · {entry.responseCount} respostas
        {entry.responseRate !== null ? ` · ${entry.responseRate.toFixed(0)}% dos encerrados` : ""}
      </p>
    </div>
  );
}

interface SatisfactionBarChartProps {
  data: CategorySatisfaction[];
  onSelect?: (key: string) => void;
}

export function SatisfactionBarChart({ data, onSelect }: SatisfactionBarChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-muted)]">
        Sem respostas de pesquisa de satisfação suficientes nesse arquivo.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis type="number" domain={[0, 5]} stroke="var(--text-muted)" fontSize={12} />
        <YAxis
          type="category"
          dataKey="key"
          width={160}
          stroke="var(--text-muted)"
          fontSize={12}
          tickFormatter={(v: string) => truncate(v)}
        />
        <Tooltip cursor={{ fill: "rgba(20,21,26,0.04)" }} content={<SatisfactionTooltip />} />
        <Bar dataKey="avgSatisfaction" radius={[0, 4, 4, 0]} maxBarSize={20} cursor={onSelect ? "pointer" : undefined}>
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={colorFor(entry.avgSatisfaction)}
              onClick={onSelect ? () => onSelect(entry.key) : undefined}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
