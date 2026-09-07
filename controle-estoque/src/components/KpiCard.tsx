type Tone = 'neutral' | 'danger' | 'warn' | 'ok'

const toneClasses: Record<Tone, string> = {
  neutral: 'text-text-primary',
  danger: 'text-danger-text',
  warn: 'text-warn-text',
  ok: 'text-ok-text'
}

export default function KpiCard({
  label,
  value,
  sub,
  tone = 'neutral',
  icon
}: {
  label: string
  value: string | number
  sub?: string
  tone?: Tone
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5 flex-1 min-w-[200px]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      <p className={`text-3xl font-bold mt-2 ${toneClasses[tone]}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}
