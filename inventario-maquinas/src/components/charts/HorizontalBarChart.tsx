export type BarItem = {
  label: string
  value: number
  color: string
}

export default function HorizontalBarChart({ items, formatValue }: { items: BarItem[]; formatValue?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  const fmt = formatValue ?? ((n: number) => String(n))

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const pct = Math.max(2, Math.round((item.value / max) * 100))
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-text-secondary truncate" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-surface-border/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold text-text-primary tabular-nums">
              {fmt(item.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
