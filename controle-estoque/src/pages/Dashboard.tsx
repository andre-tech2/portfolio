import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend,
  Cell
} from 'recharts'
import KpiCard from '../components/KpiCard'
import DemoDisabledModal from '../components/DemoDisabledModal'
import { IconAlert, IconBox, IconSwap, IconDownload } from '../components/icons'

const STATUS_COLOR: Record<string, string> = {
  ok: '#22C55E',
  baixo: '#F59E0B',
  critico: '#EF4444'
}

const GRID_COLOR = 'rgb(var(--color-surface-border))'
const TICK_STYLE = { fontSize: 11, fill: 'rgb(var(--color-text-secondary))' }
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  background: 'rgb(var(--color-surface))',
  border: '1px solid rgb(var(--color-surface-border))',
  boxShadow: '0 4px 16px rgba(20,21,26,0.12)',
  color: 'rgb(var(--color-text-primary))'
}
const TOOLTIP_LABEL_STYLE = { color: 'rgb(var(--color-text-primary))', fontWeight: 600 }
const TOOLTIP_ITEM_STYLE = { color: 'rgb(var(--color-text-secondary))' }
const LEGEND_STYLE = { fontSize: 12, color: 'rgb(var(--color-text-secondary))' }

type Preset = 'mes_atual' | 'mes_anterior' | '7d' | '30d' | '90d' | 'personalizado'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'mes_atual', label: 'Este mês' },
  { value: 'mes_anterior', label: 'Mês passado' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'personalizado', label: 'Personalizado' }
]

function fmtISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtBR(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function computeRange(preset: Preset, custom: { inicio: string; fim: string }): { dataInicio: string; dataFim: string } {
  const hoje = new Date()
  switch (preset) {
    case 'mes_atual':
      return { dataInicio: fmtISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), dataFim: fmtISO(hoje) }
    case 'mes_anterior':
      return {
        dataInicio: fmtISO(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
        dataFim: fmtISO(new Date(hoje.getFullYear(), hoje.getMonth(), 0))
      }
    case '7d': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 6)
      return { dataInicio: fmtISO(inicio), dataFim: fmtISO(hoje) }
    }
    case '30d': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 29)
      return { dataInicio: fmtISO(inicio), dataFim: fmtISO(hoje) }
    }
    case '90d': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 89)
      return { dataInicio: fmtISO(inicio), dataFim: fmtISO(hoje) }
    }
    case 'personalizado':
      return { dataInicio: custom.inicio || fmtISO(hoje), dataFim: custom.fim || fmtISO(hoje) }
  }
}

function fmtDia(dia: string) {
  const [, m, d] = dia.split('-')
  return `${d}/${m}`
}

const SEDE_TABS: { value: Sede | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Os dois' },
  { value: 'campinas', label: 'Campinas' },
  { value: 'sao_paulo', label: 'São Paulo' }
]

export default function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<Preset>('mes_atual')
  const [custom, setCustom] = useState({ inicio: '', fim: '' })
  const [sede, setSede] = useState<Sede | 'todas'>('todas')

  const range = useMemo(() => computeRange(preset, custom), [preset, custom])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.dashboard.stats(range, sede === 'todas' ? undefined : sede)
    setStats(data)
    setLoading(false)
  }, [range, sede])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const barData = stats?.estoquePorEquipamento.slice(0, 12) ?? []

  const [showExportDisabled, setShowExportDisabled] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Visão Geral</h1>
          <p className="text-sm text-text-secondary">Retrato completo do estoque e das movimentações</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface border border-surface-border rounded-lg p-1">
            {SEDE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSede(tab.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  sede === tab.value
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as Preset)}
            className="bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {preset === 'personalizado' && (
            <>
              <input
                type="date"
                value={custom.inicio}
                onChange={(e) => setCustom({ ...custom, inicio: e.target.value })}
                className="bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <input
                type="date"
                value={custom.fim}
                onChange={(e) => setCustom({ ...custom, fim: e.target.value })}
                className="bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </>
          )}
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-surface-border">
            <button
              onClick={() => setShowExportDisabled(true)}
              className="flex items-center gap-2 bg-surface border border-surface-border hover:bg-surface-raised text-text-primary font-semibold text-sm px-3 py-2 rounded-md shadow-sm"
            >
              <IconDownload className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => setShowExportDisabled(true)}
              className="flex items-center gap-2 bg-surface border border-surface-border hover:bg-surface-raised text-text-primary font-semibold text-sm px-3 py-2 rounded-md shadow-sm"
            >
              <IconDownload className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {loading || !stats ? (
        <div className="p-8 text-text-muted text-sm">Carregando dashboard…</div>
      ) : (
        <>
          <p className="text-xs text-text-muted -mt-4">
            Período: {fmtBR(stats.periodo.inicio)} a {fmtBR(stats.periodo.fim)}
          </p>

          <div className="flex flex-wrap gap-4">
            <KpiCard label="Equipamentos cadastrados" value={stats.totalEquipamentos} icon={<IconBox className="w-5 h-5" />} />
            <KpiCard
              label="Itens abaixo do mínimo"
              value={stats.itensAbaixoMinimo}
              tone={stats.itensAbaixoMinimo > 0 ? 'danger' : 'ok'}
              sub={stats.itensAbaixoMinimo > 0 ? 'Solicite compra ao gestor' : 'Tudo dentro do esperado'}
              icon={<IconAlert className="w-5 h-5" />}
            />
            <KpiCard label="Retiradas no período" value={stats.retiradasNoPeriodo} icon={<IconSwap className="w-5 h-5" />} />
            <KpiCard label="Chamados no período" value={stats.chamadosNoPeriodo} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-surface border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-1">Estoque vs. mínimo</h2>
              <p className="text-xs text-text-muted mb-4">
                Por equipamento (top 12) · posição em{' '}
                {stats.periodo.fim === fmtISO(new Date()) ? 'agora' : fmtBR(stats.periodo.fim)}
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
                  <XAxis dataKey="nome" tick={TICK_STYLE} interval={0} angle={-25} textAnchor="end" height={60} stroke={GRID_COLOR} />
                  <YAxis tick={TICK_STYLE} allowDecimals={false} stroke={GRID_COLOR} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    cursor={{ fill: 'rgba(20,21,26,0.04)' }}
                  />
                  <Bar dataKey="atual" name="Estoque atual" radius={[4, 4, 0, 0]}>
                    {barData.map((d, i) => {
                      const status = d.atual <= d.minimo ? 'critico' : d.atual <= d.minimo * 1.2 ? 'baixo' : 'ok'
                      return <Cell key={i} fill={STATUS_COLOR[status]} />
                    })}
                  </Bar>
                  <Bar dataKey="minimo" name="Estoque mínimo" fill="rgb(var(--color-chart-muted))" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-surface border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-1">Alertas de estoque</h2>
              <p className="text-xs text-text-muted mb-3">Itens que precisam de atenção</p>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {stats.alertas.length === 0 && (
                  <p className="text-sm text-text-muted py-8 text-center">Nenhum alerta no momento.</p>
                )}
                {stats.alertas.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between border border-surface-border rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{eq.nome}</p>
                      <p className="text-xs text-text-muted">
                        Atual: {eq.estoque_atual} {eq.unidade} · Mínimo: {eq.estoque_minimo} {eq.unidade}
                      </p>
                    </div>
                    <span className={`badge badge-${eq.status}`}>{eq.status === 'critico' ? 'Crítico' : 'Baixo'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-1">Movimentações no período</h2>
            <p className="text-xs text-text-muted mb-4">Entradas e saídas de equipamentos (movimentações canceladas não contam)</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.movimentacoesPorDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="saidaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="entradaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="dia" tickFormatter={fmtDia} tick={TICK_STYLE} minTickGap={20} stroke={GRID_COLOR} />
                <YAxis tick={TICK_STYLE} allowDecimals={false} stroke={GRID_COLOR} />
                <Tooltip
                  labelFormatter={fmtDia}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#EF4444" fill="url(#saidaGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#22C55E" fill="url(#entradaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {showExportDisabled && <DemoDisabledModal onClose={() => setShowExportDisabled(false)} />}
    </div>
  )
}
