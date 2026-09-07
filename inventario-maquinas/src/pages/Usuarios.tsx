import { useEffect, useState, useCallback, FormEvent } from 'react'
import Modal from '../components/Modal'
import { IconPlus, IconEdit } from '../components/icons'

const PAPEL_LABEL: Record<Papel, string> = { visualizar: 'Visualizar', editar: 'Editar', gerenciar: 'Gerenciar tudo' }
const PAPEIS: Papel[] = ['visualizar', 'editar', 'gerenciar']

const inputClass =
  'w-full bg-surface-raised border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50'

type CreateForm = { nome: string; email: string; senha: string; papel: Papel }
type EditForm = { id: number; nome: string; papel: Papel; ativo: boolean }

const emptyCreateForm: CreateForm = { nome: '', email: '', senha: '', papel: 'editar' }

export default function Usuarios({ usuarioAtual }: { usuarioAtual: Usuario }) {
  const [items, setItems] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<Usuario | null>(null)
  const [resetSenha, setResetSenhaValue] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.usuarios.list()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setCreateForm(emptyCreateForm)
    setCreateError(null)
    setCreateOpen(true)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    try {
      await window.api.usuarios.create(createForm)
      setCreateOpen(false)
      await load()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Não foi possível criar o usuário.')
    }
  }

  function openEdit(u: Usuario) {
    setEditForm({ id: u.id, nome: u.nome, papel: u.papel, ativo: u.ativo })
    setEditError(null)
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setEditError(null)
    try {
      await window.api.usuarios.update(editForm.id, {
        nome: editForm.nome,
        papel: editForm.papel,
        ativo: editForm.ativo
      })
      setEditForm(null)
      await load()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    }
  }

  function openReset(u: Usuario) {
    setResetTarget(u)
    setResetSenhaValue('')
    setResetError(null)
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    if (!resetTarget) return
    setResetError(null)
    try {
      await window.api.usuarios.resetSenha(resetTarget.id, resetSenha)
      setResetTarget(null)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Usuários</h1>
          <p className="text-sm text-text-secondary">Contas e permissões de acesso ao app</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-accent-cyan via-accent to-accent-violet text-white font-semibold text-sm px-4 py-2 rounded-md shadow-glow"
        >
          <IconPlus className="w-4 h-4" /> Novo usuário
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised/40 text-text-secondary text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Nome</th>
              <th className="text-left px-4 py-3 font-semibold">E-mail</th>
              <th className="text-left px-4 py-3 font-semibold">Papel</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-text-muted">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
            {items.map((u) => (
              <tr key={u.id} className="border-t border-surface-border/10 hover:bg-surface-raised/30">
                <td className="px-4 py-3 font-medium text-text-primary">
                  {u.nome}
                  {u.id === usuarioAtual.id && <span className="text-xs text-text-muted"> (você)</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3 text-text-secondary">{PAPEL_LABEL[u.papel]}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.ativo ? 'badge-em_atuacao' : 'bg-surface-border/20 text-text-muted'}`}>
                    {u.ativo ? 'Ativo' : 'Desativado'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openReset(u)}
                      className="text-xs font-medium text-text-secondary hover:text-text-primary px-2 py-1"
                    >
                      Redefinir senha
                    </button>
                    <button onClick={() => openEdit(u)} className="p-1.5 text-text-muted hover:text-text-primary">
                      <IconEdit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Novo usuário" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Nome</label>
              <input
                autoFocus
                required
                value={createForm.nome}
                onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">E-mail</label>
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Senha inicial</label>
              <input
                required
                type="password"
                value={createForm.senha}
                onChange={(e) => setCreateForm({ ...createForm, senha: e.target.value })}
                className={inputClass}
              />
              <p className="text-xs text-text-muted mt-1">Mínimo de 10 caracteres. O colaborador pode trocar depois.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Papel</label>
              <select
                value={createForm.papel}
                onChange={(e) => setCreateForm({ ...createForm, papel: e.target.value as Papel })}
                className={inputClass}
              >
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {PAPEL_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>

            {createError && <p className="text-xs text-danger-text font-medium">{createError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md"
              >
                Criar usuário
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editForm && (
        <Modal title="Editar usuário" onClose={() => setEditForm(null)}>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Nome</label>
              <input
                autoFocus
                required
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Papel</label>
              <select
                value={editForm.papel}
                onChange={(e) => setEditForm({ ...editForm, papel: e.target.value as Papel })}
                className={inputClass}
              >
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {PAPEL_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={editForm.ativo}
                onChange={(e) => setEditForm({ ...editForm, ativo: e.target.checked })}
                className="rounded border-surface-border/20"
              />
              <span className="text-sm text-text-secondary">Conta ativa (permite login)</span>
            </label>

            {editError && <p className="text-xs text-danger-text font-medium">{editError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md"
              >
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal title={`Redefinir senha de ${resetTarget.nome}`} onClose={() => setResetTarget(null)}>
          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Nova senha</label>
              <input
                autoFocus
                required
                type="password"
                value={resetSenha}
                onChange={(e) => setResetSenhaValue(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-text-muted mt-1">Mínimo de 10 caracteres.</p>
            </div>

            {resetError && <p className="text-xs text-danger-text font-medium">{resetError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md"
              >
                Redefinir
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
