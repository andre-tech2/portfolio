import { useEffect, useState, useCallback, FormEvent } from 'react'
import Modal from '../components/Modal'
import DemoDisabledModal from '../components/DemoDisabledModal'
import { IconPlus, IconEdit, IconTrash, IconUpload } from '../components/icons'
import { CATEGORIAS } from '../lib/categorias'

type FormState = {
  id?: number
  nome: string
  categoria: string
  unidade: string
  estoque_atual: string
  estoque_minimo: string
  sede: Sede
}

const SEDE_LABEL: Record<Sede, string> = { campinas: 'Campinas', sao_paulo: 'São Paulo' }
const SEDE_TABS: { value: Sede | 'todas'; label: string }[] = [
  { value: 'campinas', label: 'Campinas' },
  { value: 'sao_paulo', label: 'São Paulo' },
  { value: 'todas', label: 'Todas' }
]

function emptyFormFor(sede: Sede): FormState {
  return { nome: '', categoria: '', unidade: 'un', estoque_atual: '0', estoque_minimo: '0', sede }
}

const inputClass =
  'w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50'

export default function Equipamentos({ papel, onChanged }: { papel: Papel; onChanged: () => void }) {
  const podeEditar = papel === 'editar' || papel === 'gerenciar'
  const podeExcluir = papel === 'gerenciar'
  const [sedeTab, setSedeTab] = useState<Sede | 'todas'>('campinas')
  const [items, setItems] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyFormFor('campinas'))
  const [busca, setBusca] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Equipamento | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showImportDisabled, setShowImportDisabled] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.equipamentos.list(sedeTab === 'todas' ? undefined : sedeTab)
    setItems(data)
    setLoading(false)
  }, [sedeTab])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setForm(emptyFormFor(sedeTab === 'todas' ? 'campinas' : sedeTab))
    setError(null)
    setModalOpen(true)
  }

  function openEdit(eq: Equipamento) {
    setForm({
      id: eq.id,
      nome: eq.nome,
      categoria: eq.categoria ?? '',
      unidade: eq.unidade,
      estoque_atual: String(eq.estoque_atual),
      estoque_minimo: String(eq.estoque_minimo),
      sede: eq.sede
    })
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      unidade: form.unidade.trim() || 'un',
      estoque_atual: Number(form.estoque_atual) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      sede: form.sede
    }
    if (!payload.nome) return
    try {
      if (form.id) {
        await window.api.equipamentos.update(form.id, payload)
      } else {
        await window.api.equipamentos.create(payload)
      }
      setModalOpen(false)
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o equipamento.')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await window.api.equipamentos.delete(confirmDelete.id)
    setConfirmDelete(null)
    await load()
    onChanged()
  }

  const filtered = items.filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Equipamentos</h1>
          <p className="text-sm text-text-secondary">Cadastro e regras de estoque mínimo</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportDisabled(true)}
              className="flex items-center gap-2 bg-surface border border-surface-border hover:bg-surface-raised text-text-primary font-semibold text-sm px-4 py-2 rounded-md shadow-sm"
            >
              <IconUpload className="w-4 h-4" /> Importar planilha
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold text-sm px-4 py-2 rounded-md shadow-sm"
            >
              <IconPlus className="w-4 h-4" /> Novo equipamento
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 bg-surface border border-surface-border rounded-lg p-1 w-fit">
        {SEDE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSedeTab(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              sedeTab === tab.value
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar equipamento…"
        className="w-full max-w-sm bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-text-secondary text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Nome</th>
              <th className="text-left px-4 py-3 font-semibold">Categoria</th>
              {sedeTab === 'todas' && <th className="text-left px-4 py-3 font-semibold">Sede</th>}
              <th className="text-right px-4 py-3 font-semibold">Estoque atual</th>
              <th className="text-right px-4 py-3 font-semibold">Estoque mínimo</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={sedeTab === 'todas' ? 7 : 6} className="text-center py-10 text-text-muted">
                  Nenhum equipamento cadastrado ainda.
                </td>
              </tr>
            )}
            {filtered.map((eq) => (
              <tr key={eq.id} className="border-t border-surface-border hover:bg-surface-raised">
                <td className="px-4 py-3 font-medium text-text-primary">{eq.nome}</td>
                <td className="px-4 py-3 text-text-secondary">{eq.categoria || '—'}</td>
                {sedeTab === 'todas' && <td className="px-4 py-3 text-text-secondary">{SEDE_LABEL[eq.sede]}</td>}
                <td className="px-4 py-3 text-right">
                  {eq.estoque_atual} {eq.unidade}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {eq.estoque_minimo} {eq.unidade}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge badge-${eq.status}`}>
                    {eq.status === 'ok' ? 'OK' : eq.status === 'baixo' ? 'Baixo' : 'Crítico'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {podeEditar && (
                      <button onClick={() => openEdit(eq)} className="p-1.5 text-text-muted hover:text-text-primary">
                        <IconEdit className="w-4 h-4" />
                      </button>
                    )}
                    {podeExcluir && (
                      <button onClick={() => setConfirmDelete(eq)} className="p-1.5 text-text-muted hover:text-danger">
                        <IconTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={form.id ? 'Editar equipamento' : 'Novo equipamento'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Nome</label>
              <input
                autoFocus
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Sede</label>
              <select
                value={form.sede}
                onChange={(e) => setForm({ ...form, sede: e.target.value as Sede })}
                className={inputClass}
              >
                <option value="campinas">Campinas</option>
                <option value="sao_paulo">São Paulo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className={inputClass}
              >
                <option value="">Sem categoria</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary">Unidade</label>
                <input
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary">Estoque atual</label>
                <input
                  type="number"
                  min={0}
                  value={form.estoque_atual}
                  onChange={(e) => setForm({ ...form, estoque_atual: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary">Estoque mínimo</label>
                <input
                  type="number"
                  min={0}
                  value={form.estoque_minimo}
                  onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {error && <p className="text-xs text-danger-text font-medium">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
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

      {confirmDelete && (
        <Modal title="Excluir equipamento" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-text-secondary">
            Tem certeza que deseja excluir <strong>{confirmDelete.nome}</strong>? O histórico de movimentações
            relacionado também será removido.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold bg-danger hover:bg-red-600 text-white rounded-md"
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}

      {showImportDisabled && <DemoDisabledModal onClose={() => setShowImportDisabled(false)} />}
    </div>
  )
}
