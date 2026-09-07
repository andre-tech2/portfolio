import { useEffect, useState } from 'react'
import StatTile from '../components/StatTile'
import Legend from '../components/charts/Legend'
import HorizontalBarChart, { BarItem } from '../components/charts/HorizontalBarChart'

const STATUS_GOOD = '#0ca30c'
const STATUS_WARNING = '#fab219'
const STATUS_CRITICAL = '#d03b3b'
const SEQ_INDIGO = '#6366F1'
const SEQ_CYAN = '#22D3EE'

const IDADE_BUCKETS = ['0–1 ano', '1–3 anos', '3–5 anos', '5+ anos']

function bucketIdade(dataEntradaISO: string): string {
  const inicio = new Date(`${dataEntradaISO}T00:00:00`)
  if (Number.isNaN(inicio.getTime())) return IDADE_BUCKETS[0]
  const hoje = new Date()
  const dias = Math.max(0, Math.round((hoje.getTime() - inicio.getTime()) / 86400000))
  if (dias < 365) return IDADE_BUCKETS[0]
  if (dias < 365 * 3) return IDADE_BUCKETS[1]
  if (dias < 365 * 5) return IDADE_BUCKETS[2]
  return IDADE_BUCKETS[3]
}

export default function Dashboard({
  refreshKey,
  onCounts
}: {
  refreshKey: number
  onCounts: (totalNovas: number, totalAntigas: number) => void
}) {
  const [loading, setLoading] = useState(true)
  const [novas, setNovas] = useState<MaquinaNova[]>([])
  const [antigas, setAntigas] = useState<MaquinaAntiga[]>([])
  const [totalRemovidas, setTotalRemovidas] = useState(0)

  useEffect(() => {
    let ativo = true
    Promise.all([window.api.maquinasNovas.list(), window.api.maquinasAntigas.list(), window.api.remocoes.list()]).then(
      ([n, a, r]) => {
        if (!ativo) return
        setNovas(n)
        setAntigas(a)
        setTotalRemovidas(r.length)
        setLoading(false)
        onCounts(n.length, a.length)
      }
    )
    return () => {
      ativo = false
    }
  }, [refreshKey])

  if (loading) {
    return <div className="p-6 text-sm text-text-muted">Carregando visão geral…</div>
  }

  const totalGeral = novas.length + antigas.length

  const novasPorEstado: BarItem[] = [
    { label: 'Entrada', value: novas.filter((m) => m.estado === 'entrada').length, color: STATUS_GOOD },
    { label: 'Saída', value: novas.filter((m) => m.estado === 'saida').length, color: STATUS_WARNING }
  ]

  const antigasPorEstado: BarItem[] = [
    { label: 'Em Atuação', value: antigas.filter((m) => m.estado === 'em_atuacao').length, color: STATUS_GOOD },
    { label: 'Parada', value: antigas.filter((m) => m.estado === 'parada').length, color: STATUS_WARNING },
    { label: 'Venda', value: antigas.filter((m) => m.estado === 'venda').length, color: STATUS_CRITICAL }
  ]

  const localizacaoCounts = new Map<string, number>()
  for (const m of [...novas, ...antigas]) {
    const key = m.localizacao?.trim() || 'Sem localização'
    localizacaoCounts.set(key, (localizacaoCounts.get(key) ?? 0) + 1)
  }
  const localizacaoOrdenada = [...localizacaoCounts.entries()].sort((a, b) => b[1] - a[1])
  const TOP_N = 6
  const localizacaoTop = localizacaoOrdenada.slice(0, TOP_N)
  const localizacaoResto = localizacaoOrdenada.slice(TOP_N).reduce((acc, [, v]) => acc + v, 0)
  const porLocalizacao: BarItem[] = [
    ...localizacaoTop.map(([label, value]) => ({ label, value, color: SEQ_INDIGO })),
    ...(localizacaoResto > 0 ? [{ label: 'Outras', value: localizacaoResto, color: SEQ_INDIGO }] : [])
  ]

  const idadeCounts = new Map(IDADE_BUCKETS.map((b) => [b, 0]))
  for (const m of [...novas, ...antigas]) {
    const bucket = bucketIdade(m.data_entrada)
    idadeCounts.set(bucket, (idadeCounts.get(bucket) ?? 0) + 1)
  }
  const porIdade: BarItem[] = IDADE_BUCKETS.map((label) => ({ label, value: idadeCounts.get(label) ?? 0, color: SEQ_CYAN }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Visão Geral</h1>
        <p className="text-sm text-text-secondary">Resumo do parque de máquinas cadastrado</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total de máquinas" value={totalGeral} />
        <StatTile label="Máquinas novas" value={novas.length} />
        <StatTile label="Máquinas antigas" value={antigas.length} />
        <StatTile label="Removidas (histórico)" value={totalRemovidas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-text-primary mb-1">Máquinas Novas por estado</p>
          <p className="text-xs text-text-muted mb-4">Distribuição entre entrada e saída</p>
          <Legend items={novasPorEstado.map(({ label, color }) => ({ label, color }))} />
          <HorizontalBarChart items={novasPorEstado} />
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-text-primary mb-1">Máquinas Antigas por estado</p>
          <p className="text-xs text-text-muted mb-4">Em atuação, paradas ou vendidas</p>
          <Legend items={antigasPorEstado.map(({ label, color }) => ({ label, color }))} />
          <HorizontalBarChart items={antigasPorEstado} />
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-text-primary mb-1">Top localizações</p>
          <p className="text-xs text-text-muted mb-4">Onde estão concentradas as máquinas do parque</p>
          {porLocalizacao.length > 0 ? (
            <HorizontalBarChart items={porLocalizacao} />
          ) : (
            <p className="text-xs text-text-muted">Nenhuma máquina com localização cadastrada.</p>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-text-primary mb-1">Idade do parque</p>
          <p className="text-xs text-text-muted mb-4">Tempo desde a data de entrada, novas e antigas juntas</p>
          <HorizontalBarChart items={porIdade} />
        </div>
      </div>
    </div>
  )
}
