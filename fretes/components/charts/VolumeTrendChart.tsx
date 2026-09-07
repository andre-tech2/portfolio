"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/metrics/types";

export function VolumeTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados suficientes no período.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis dataKey="periodLabel" stroke="var(--text-muted)" fontSize={12} />
        <YAxis stroke="var(--text-muted)" fontSize={12} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(36,28,16,0.05)" }}
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
          itemStyle={{ color: "var(--text-secondary)" }}
          formatter={(value) => [Number(value), "Envios"]}
        />
        <Bar dataKey="count" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
