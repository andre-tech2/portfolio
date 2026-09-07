"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopEntry } from "@/lib/metrics/types";

interface HorizontalBarListProps {
  data: TopEntry[];
  color?: string;
  height?: number;
}

function truncate(label: string, max = 28): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function HorizontalBarList({ data, color = "var(--series-1)", height }: HorizontalBarListProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados suficientes.</p>;
  }

  const chartHeight = height ?? Math.max(180, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis type="number" stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="key"
          width={170}
          stroke="var(--text-muted)"
          fontSize={12}
          tickFormatter={(v: string) => truncate(v)}
        />
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
          formatter={(value, _name, item) => {
            const percentage = (item?.payload as TopEntry | undefined)?.percentage ?? 0;
            return [`${Number(value)} (${percentage.toFixed(0)}%)`, "Envios"];
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
