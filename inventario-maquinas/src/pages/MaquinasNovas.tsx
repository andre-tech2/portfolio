import MaquinaTable from '../components/MaquinaTable'

const ESTADOS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' }
]

const ESTADO_LABELS: Record<string, string> = { entrada: 'Entrada', saida: 'Saída' }

const ESTADOS_ANTIGAS = [
  { value: 'em_atuacao', label: 'Em Atuação' },
  { value: 'parada', label: 'Parada' },
  { value: 'venda', label: 'Venda' }
]

export default function MaquinasNovas({
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
      titulo="Máquinas Novas"
      subtitulo="Máquinas em entrada e saída"
      estados={ESTADOS}
      estadoLabels={ESTADO_LABELS}
      api={window.api.maquinasNovas}
      tabela="novas"
      refreshKey={refreshKey}
      onCountChange={onCountChange}
      papel={papel}
      usuarioNome={usuarioNome}
      moverPara={{
        estados: ESTADOS_ANTIGAS,
        onMover: (id, estadoDestino, vendaInfo) =>
          window.api.maquinasNovas.moverParaAntigas(id, estadoDestino as EstadoAntiga, vendaInfo)
      }}
    />
  )
}
