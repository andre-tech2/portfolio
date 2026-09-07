"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopEntry } from "@/lib/metrics/types";

interface HorizontalBarListProps {
  data: TopEntry[];
  color?: string;
  height?: number;
  onSelect?: (key: string) => void;
}

function truncate(label: string, max = 28): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function HorizontalBarList({ data, color = "var(--series-1)", height, onSelect }: HorizontalBarListProps) {
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
          formatter={(value, _name, item) => {
            const percentage = (item?.payload as TopEntry | undefined)?.percentage ?? 0;
            return [`${Number(value)} (${percentage.toFixed(0)}%)`, "Chamados"];
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22} cursor={onSelect ? "pointer" : undefined}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={color} onClick={onSelect ? () => onSelect(entry.key) : undefined} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
