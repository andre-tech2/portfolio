interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: "orange" | "blue" | "aqua" | "amber" | "red";
  goal?: string;
  valueColor?: string;
}

const ACCENT_COLORS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  orange: "var(--series-1)",
  blue: "var(--series-2)",
  aqua: "var(--series-3)",
  amber: "var(--series-4)",
  red: "var(--series-8)",
};

export function KpiCard({ label, value, hint, accent = "orange", goal, valueColor }: KpiCardProps) {
  const color = ACCENT_COLORS[accent];
  return (
    <div className="solid-card p-5" style={{ borderTopColor: color }}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-tabular text-3xl font-bold" style={{ color: valueColor ?? "var(--text-primary)" }}>
          {value}
        </p>
        {goal && <p className="text-xs text-[var(--text-muted)]">{goal}</p>}
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>}
    </div>
  );
}
