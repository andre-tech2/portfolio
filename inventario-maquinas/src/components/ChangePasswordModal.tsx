import { useState, FormEvent } from 'react'
import Modal from './Modal'

const inputClass =
  'w-full bg-field border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50'

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (novaSenha.length < 10) {
      setError('A nova senha precisa ter pelo menos 10 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    try {
      await window.api.auth.changePassword(senhaAtual, novaSenha)
      setSucesso(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível trocar a senha.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Trocar minha senha" onClose={onClose}>
      {sucesso ? (
        <div className="space-y-4">
          <p className="text-sm text-ok-text font-medium">Senha alterada com sucesso.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary">Senha atual</label>
            <input
              autoFocus
              required
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Nova senha</label>
            <input
              required
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Confirmar nova senha</label>
            <input
              required
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-xs text-danger-text font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md disabled:opacity-60"
            >
              {busy ? 'Salvando…' : 'Trocar senha'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
