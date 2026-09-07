import { useEffect, useState } from 'react'
import { IconDatabase } from '../components/icons'

const ESTADO_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  em_atuacao: 'Em Atuação',
  parada: 'Parada',
  venda: 'Venda'
}

export default function Configuracoes({ onChanged }: { onChanged: () => void }) {
  const [remocoes, setRemocoes] = useState<Remocao[]>([])
  const [resetando, setResetando] = useState(false)
  const [confirmarReset, setConfirmarReset] = useState(false)

  useEffect(() => {
    window.api.remocoes.list().then(setRemocoes)
  }, [])

  async function handleResetar() {
    setResetando(true)
    try {
      await window.api.demo.resetar()
      setConfirmarReset(false)
      onChanged()
      window.api.remocoes.list().then(setRemocoes)
    } finally {
      setResetando(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Configurações</h1>
        <p className="text-sm text-text-secondary">Dados de demonstração e histórico de remoções</p>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent-light shrink-0">
            <IconDatabase className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Dados de demonstração</p>
            <p className="text-xs text-text-muted mt-2">
              Tudo que você cria, edita ou importa aqui fica salvo só no seu navegador (IndexedDB), nunca em um
              servidor. Use o botão abaixo para apagar tudo e voltar ao conjunto de dados de exemplo original.
            </p>
            <div className="mt-4">
              {!confirmarReset ? (
                <button
                  onClick={() => setConfirmarReset(true)}
                  className="px-4 py-2 text-sm font-semibold glass hover:bg-surface-raised/60 text-text-primary rounded-md transition-colors"
                >
                  Restaurar dados de exemplo
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warn-text font-medium">Isso apaga tudo que você alterou. Confirmar?</span>
                  <button
                    disabled={resetando}
                    onClick={handleResetar}
                    className="px-3 py-1.5 text-xs font-semibold bg-danger hover:bg-red-600 text-white rounded-md disabled:opacity-60"
                  >
                    {resetando ? 'Restaurando…' : 'Sim, restaurar'}
                  </button>
                  <button
                    onClick={() => setConfirmarReset(false)}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <p className="text-sm font-semibold text-text-primary mb-3">Histórico de remoções</p>
        {remocoes.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhuma máquina removida ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-text-secondary uppercase">
                <tr>
                  <th className="text-left py-1.5 pr-3 font-semibold">Patrimônio</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">Estado</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">Motivo</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">Analista</th>
                  <th className="text-left py-1.5 font-semibold">Removido em</th>
                </tr>
              </thead>
              <tbody>
                {remocoes.map((r) => (
                  <tr key={r.id} className="border-t border-surface-border/10">
                    <td className="py-1.5 pr-3 font-medium text-text-primary">{r.patrimonio}</td>
                    <td className="py-1.5 pr-3 text-text-secondary">{ESTADO_LABELS[r.estado] ?? r.estado}</td>
                    <td className="py-1.5 pr-3 text-text-secondary max-w-[220px] truncate" title={r.motivo}>
                      {r.motivo}
                    </td>
                    <td className="py-1.5 pr-3 text-text-secondary">{r.analista}</td>
                    <td className="py-1.5 text-text-secondary">{r.removido_em}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
