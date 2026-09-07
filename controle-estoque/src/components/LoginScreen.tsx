import { useState, FormEvent } from 'react'
import Logo from './Logo'

export default function LoginScreen({ onLogin }: { onLogin: (usuario: Usuario) => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const demo = window.api.demo.credenciais()

  async function entrar(emailTentativa: string, senhaTentativa: string) {
    setError(null)
    setBusy(true)
    try {
      const usuario = await window.api.auth.login(emailTentativa, senhaTentativa)
      onLogin(usuario)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await entrar(email.trim(), senha)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg">
      <div className="max-w-sm w-full mx-4">
        <div className="text-center mb-8">
          <Logo className="w-14 h-14 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-text-primary">Controle de Estoque</h1>
          <p className="text-text-secondary mt-1 text-sm">Entre com sua conta para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-surface-border rounded-xl shadow-card p-5 space-y-3"
        >
          <div>
            <label className="text-xs font-semibold text-text-secondary">E-mail</label>
            <input
              autoFocus
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Senha</label>
            <input
              required
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {error && <p className="text-xs text-danger-text font-medium">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md disabled:opacity-60"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-4 mt-4 text-xs text-text-secondary space-y-2">
          <p className="font-semibold text-text-primary">Modo demonstração</p>
          <p>
            Este é um projeto de portfólio: os dados ficam salvos só no seu navegador. Use o acesso rápido abaixo ou
            entre manualmente com <span className="font-mono text-text-primary">{demo.email}</span> / senha{' '}
            <span className="font-mono text-text-primary">{demo.senha}</span>.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => entrar(demo.email, demo.senha)}
            className="w-full px-3 py-2 text-xs font-semibold bg-surface border border-surface-border rounded-md hover:bg-surface-raised transition-colors disabled:opacity-60"
          >
            Entrar como administrador (demo)
          </button>
        </div>
      </div>
    </div>
  )
}
