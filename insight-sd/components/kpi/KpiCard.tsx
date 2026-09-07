interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: "blue" | "violet" | "aqua" | "amber" | "red";
  /** Texto pequeno de meta, mostrado ao lado do valor grande (ex: "Meta: 4h"). */
  goal?: string;
  /** Cor do valor grande — pra sinalizar se bate ou não a meta. Se omitido, usa a cor padrão. */
  valueColor?: string;
}

const ACCENT_COLORS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  blue: "var(--series-1)",
  violet: "var(--series-7)",
  aqua: "var(--series-3)",
  amber: "var(--series-4)",
  red: "var(--series-8)",
};

export function KpiCard({ label, value, hint, accent = "blue", goal, valueColor }: KpiCardProps) {
  const color = ACCENT_COLORS[accent];
  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
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
