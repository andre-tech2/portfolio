"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgentHealthScore } from "@/lib/metrics/types";

function colorFor(score: number): string {
  if (score >= 80) return "var(--status-good)";
  if (score >= 60) return "var(--status-warning)";
  return "var(--status-critical)";
}

function truncate(label: string, max = 26): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function AgentHealthChart({ data }: { data: AgentHealthScore[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados suficientes.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <YAxis
          type="category"
          dataKey="agent"
          width={160}
          stroke="var(--text-muted)"
          fontSize={12}
          tickFormatter={(v: string) => truncate(v)}
        />
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
          formatter={(value) => [`${Number(value)}/100`, "Índice de saúde"]}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((entry) => (
            <Cell key={entry.agent} fill={colorFor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
