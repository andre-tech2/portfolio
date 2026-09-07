"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/metrics/types";

export function OnTimeTrendChart({ data }: { data: TrendPoint[] }) {
  const points = data.filter((p) => p.onTimePercentage !== null);

  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados suficientes no período.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis dataKey="periodLabel" stroke="var(--text-muted)" fontSize={12} />
        <YAxis stroke="var(--text-muted)" fontSize={12} width={40} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
          itemStyle={{ color: "var(--text-secondary)" }}
          formatter={(value) => [`${Number(value).toFixed(0)}%`, "No prazo"]}
        />
        <Line
          type="monotone"
          dataKey="onTimePercentage"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--series-1)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
