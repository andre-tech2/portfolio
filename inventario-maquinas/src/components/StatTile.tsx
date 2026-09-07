export default function StatTile({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-3xl font-bold text-text-primary mt-1.5" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
    </div>
  )
}
