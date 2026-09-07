import { useEffect, useState } from 'react'
import { IconDatabase } from '../components/icons'

export default function Configuracoes({ onChanged }: { onChanged: () => void }) {
  const [limiar, setLimiar] = useState<number | null>(null)
  const [limiarInput, setLimiarInput] = useState('')
  const [limiarBusy, setLimiarBusy] = useState(false)
  const [limiarError, setLimiarError] = useState<string | null>(null)
  const [limiarSalvo, setLimiarSalvo] = useState(false)
  const [resetando, setResetando] = useState(false)
  const [confirmarReset, setConfirmarReset] = useState(false)

  useEffect(() => {
    window.api.config.getLimiarBaixo().then((valor) => {
      setLimiar(valor)
      setLimiarInput(String(valor))
    })
  }, [])

  async function handleSalvarLimiar() {
    const valor = Number(limiarInput)
    setLimiarError(null)
    setLimiarSalvo(false)
    if (!Number.isFinite(valor) || valor <= 100) {
      setLimiarError('Informe um número maior que 100.')
      return
    }
    setLimiarBusy(true)
    try {
      await window.api.config.setLimiarBaixo(valor)
      setLimiar(Math.round(valor))
      setLimiarInput(String(Math.round(valor)))
      setLimiarSalvo(true)
      onChanged()
    } catch (err) {
      setLimiarError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setLimiarBusy(false)
    }
  }

  async function handleRestore() {
    setResetando(true)
    try {
      await window.api.demo.resetar()
      setConfirmarReset(false)
      onChanged()
      const valor = await window.api.config.getLimiarBaixo()
      setLimiar(valor)
      setLimiarInput(String(valor))
    } finally {
      setResetando(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Configurações</h1>
        <p className="text-sm text-text-secondary">Dados de demonstração e regras de alerta de estoque</p>
      </div>

      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent-light shrink-0">
            <IconDatabase className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Dados de demonstração</p>
            <p className="text-xs text-text-muted mt-2">
              Este é um projeto de portfólio: tudo que você cadastrar ou movimentar fica salvo só no seu navegador
              (IndexedDB), nunca em um servidor. Use o botão abaixo pra apagar tudo e voltar ao conjunto de dados
              de exemplo original.
            </p>
            <div className="mt-4">
              {!confirmarReset ? (
                <button
                  onClick={() => setConfirmarReset(true)}
                  className="px-4 py-2 text-sm font-semibold bg-surface-raised border border-surface-border hover:bg-surface text-text-primary rounded-md"
                >
                  Restaurar dados de exemplo
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warn-text font-medium">Isso apaga tudo que você alterou. Confirmar?</span>
                  <button
                    disabled={resetando}
                    onClick={handleRestore}
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

      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <p className="text-sm font-semibold text-text-primary mb-2">Regras de alerta de estoque</p>
        <ul className="text-sm text-text-secondary space-y-1 list-disc pl-5">
          <li>
            <span className="badge badge-ok">OK</span> — estoque atual acima de {limiar ?? '…'}% do mínimo definido.
          </li>
          <li>
            <span className="badge badge-baixo">Baixo</span> — estoque entre o mínimo e {limiar ?? '…'}% do mínimo.
            Fique atento.
          </li>
          <li>
            <span className="badge badge-critico">Crítico</span> — estoque no mínimo ou abaixo dele. Solicite compra
            ao gestor.
          </li>
        </ul>

        <div className="mt-4 pt-4 border-t border-surface-border">
          <label className="text-xs font-semibold text-text-secondary">
            Limiar do alerta "Baixo" (% do estoque mínimo)
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min={101}
              step={1}
              value={limiarInput}
              onChange={(e) => setLimiarInput(e.target.value)}
              className="w-28 bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <span className="text-sm text-text-secondary">%</span>
            <button
              disabled={limiarBusy || limiarInput === String(limiar)}
              onClick={handleSalvarLimiar}
              className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md disabled:opacity-60"
            >
              {limiarBusy ? 'Salvando…' : 'Salvar'}
            </button>
            {limiarSalvo && <span className="text-xs text-ok-text font-medium">Salvo.</span>}
          </div>
          {limiarError && <p className="text-xs text-danger-text font-medium mt-1">{limiarError}</p>}
          <p className="text-xs text-text-muted mt-2">
            Padrão: 120%. Vale para todos os equipamentos e sedes deste banco de dados.
          </p>
        </div>
      </div>
    </div>
  )
}
