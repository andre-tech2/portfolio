"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/metrics/types";

interface TrendLineChartProps {
  data: TrendPoint[];
  metric: "count" | "avgResolutionHours" | "slaPercentage";
  label: string;
  color?: string;
  valueFormatter?: (v: number) => string;
  onSelectPeriod?: (periodStart: Date) => void;
}

export function TrendLineChart({
  data,
  metric,
  label,
  color = "var(--series-7)",
  valueFormatter,
  onSelectPeriod,
}: TrendLineChartProps) {
  const points = data.filter((p) => p[metric] !== null);

  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem dados suficientes no período.</p>;
  }

  const format = valueFormatter ?? ((v: number) => v.toFixed(0));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={points}
        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
        onClick={
          onSelectPeriod
            ? (state) => {
                const index = state?.activeIndex;
                if (typeof index === "number") {
                  const point = points[index];
                  if (point) onSelectPeriod(point.periodStart);
                }
              }
            : undefined
        }
        style={onSelectPeriod ? { cursor: "pointer" } : undefined}
      >
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis dataKey="periodLabel" stroke="var(--text-muted)" fontSize={12} />
        <YAxis stroke="var(--text-muted)" fontSize={12} width={40} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
          itemStyle={{ color: "var(--text-secondary)" }}
          formatter={(value) => [format(Number(value)), label]}
        />
        <Line
          type="monotone"
          dataKey={metric}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
