import MaquinaTable from '../components/MaquinaTable'

const ESTADOS = [
  { value: 'em_atuacao', label: 'Em Atuação' },
  { value: 'parada', label: 'Parada' },
  { value: 'venda', label: 'Venda' }
]

const ESTADO_LABELS: Record<string, string> = {
  em_atuacao: 'Em Atuação',
  parada: 'Parada',
  venda: 'Venda'
}

export default function MaquinasAntigas({
  refreshKey,
  onCountChange,
  papel,
  usuarioNome
}: {
  refreshKey: number
  onCountChange: (n: number) => void
  papel: Papel
  usuarioNome: string
}) {
  return (
    <MaquinaTable
      titulo="Máquinas Antigas"
      subtitulo="Máquinas em atuação, paradas ou em venda"
      estados={ESTADOS}
      estadoLabels={ESTADO_LABELS}
      api={window.api.maquinasAntigas}
      tabela="antigas"
      refreshKey={refreshKey}
      onCountChange={onCountChange}
      papel={papel}
      usuarioNome={usuarioNome}
      mostrarCondicao
    />
  )
}
