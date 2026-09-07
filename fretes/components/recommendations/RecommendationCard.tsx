import type { Recommendation } from "@/lib/metrics/types";

const SEVERITY_STYLE: Record<Recommendation["severity"], { color: string; label: string; icon: string }> = {
  critical: { color: "var(--status-critical)", label: "Crítico", icon: "⛔" },
  warning: { color: "var(--status-warning)", label: "Atenção", icon: "⚠️" },
  info: { color: "var(--status-good)", label: "Oportunidade", icon: "💡" },
};

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const style = SEVERITY_STYLE[recommendation.severity];

  return (
    <div className="solid-card flex gap-4 p-5" style={{ borderTopColor: style.color }}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ background: `${style.color}22`, border: `1px solid ${style.color}55` }}
      >
        {style.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: `${style.color}22`, color: style.color }}
          >
            {style.label}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{recommendation.impactCount} envios afetados</span>
        </div>
        <h3 className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">{recommendation.title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{recommendation.description}</p>
      </div>
    </div>
  );
}
