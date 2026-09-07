import { useEffect, useState, useCallback, FormEvent } from 'react'
import { IconPlus, IconTrash, IconDownload } from '../components/icons'
import Modal from '../components/Modal'
import DemoDisabledModal from '../components/DemoDisabledModal'

type ItemForm = { equipamento_id: string; quantidade: string }

type FormState = {
  sede: Sede
  tipo: 'saida' | 'entrada'
  chamado: string
  colaborador: string
  observacao: string
  itens: ItemForm[]
}

const SEDE_LABEL: Record<Sede, string> = { campinas: 'Campinas', sao_paulo: 'São Paulo' }
const SEDE_TABS: { value: Sede | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'campinas', label: 'Campinas' },
  { value: 'sao_paulo', label: 'São Paulo' }
]

const emptyItem: ItemForm = { equipamento_id: '', quantidade: '1' }
function emptyFormFor(sede: Sede): FormState {
  return { sede, tipo: 'saida', chamado: '', colaborador: '', observacao: '', itens: [{ ...emptyItem }] }
}

const inputClass =
  'w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50'

function fmtData(iso: string) {
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Movimentacoes({ papel, onChanged }: { papel: Papel; onChanged: () => void }) {
  const podeEditar = papel === 'editar' || papel === 'gerenciar'
  const [sedeTab, setSedeTab] = useState<Sede | 'todas'>('todas')
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [movs, setMovs] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyFormFor('campinas'))
  const [busca, setBusca] = useState('')
  const [confirmCancel, setConfirmCancel] = useState<Movimentacao | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [eqs, list] = await Promise.all([
      window.api.equipamentos.list(),
      window.api.movimentacoes.list({ busca, sede: sedeTab === 'todas' ? undefined : sedeTab })
    ])
    setEquipamentos(eqs)
    setMovs(list)
    setLoading(false)
  }, [busca, sedeTab])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setForm(emptyFormFor(sedeTab === 'todas' ? 'campinas' : sedeTab))
    setError(null)
    setModalOpen(true)
  }

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setForm((f) => ({ ...f, itens: f.itens.map((it, i) => (i === index ? { ...it, ...patch } : it)) }))
  }

  function changeFormSede(sede: Sede) {
    setForm((f) => ({ ...f, sede, itens: [{ ...emptyItem }] }))
  }

  function addItem() {
    setForm((f) => ({ ...f, itens: [...f.itens, { ...emptyItem }] }))
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const colaborador = form.colaborador.trim()
    if (!colaborador) {
      setError('Informe o nome do colaborador.')
      return
    }

    const itens = form.itens
      .filter((it) => it.equipamento_id)
      .map((it) => ({ equipamento_id: Number(it.equipamento_id), quantidade: Number(it.quantidade) }))

    if (itens.length === 0) {
      setError('Selecione ao menos um equipamento.')
      return
    }
    if (itens.some((it) => !it.quantidade || it.quantidade <= 0)) {
      setError('Informe uma quantidade válida para todos os itens.')
      return
    }

    try {
      await window.api.movimentacoes.createBatch({
        tipo: form.tipo,
        chamado: form.chamado.trim() || null,
        colaborador,
        observacao: form.observacao.trim() || null,
        itens
      })
      setModalOpen(false)
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar a movimentação.')
    }
  }

  function openCancel(m: Movimentacao) {
    setConfirmCancel(m)
    setMotivoCancelamento('')
    setCancelError(null)
  }

  async function handleCancel() {
    if (!confirmCancel) return
    const motivo = motivoCancelamento.trim()
    if (!motivo) {
      setCancelError('Informe o motivo do cancelamento.')
      return
    }
    setCancelError(null)
    try {
      await window.api.movimentacoes.cancel(confirmCancel.id, motivo)
      setConfirmCancel(null)
      await load()
      onChanged()
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Não foi possível cancelar a movimentação.')
    }
  }

  const [showExportDisabled, setShowExportDisabled] = useState(false)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Movimentações</h1>
          <p className="text-sm text-text-secondary">Registre saídas e entradas vinculadas a um chamado</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExportDisabled(true)}
            className="flex items-center gap-2 bg-surface border border-surface-border hover:bg-surface-raised text-text-primary font-semibold text-sm px-4 py-2 rounded-md shadow-sm"
          >
            <IconDownload className="w-4 h-4" /> Exportar Excel
          </button>
          {podeEditar && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold text-sm px-4 py-2 rounded-md shadow-sm"
            >
              <IconPlus className="w-4 h-4" /> Nova movimentação
            </button>
          )}
        </div>
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
        placeholder="Buscar por chamado, colaborador ou equipamento…"
        className="w-full max-w-md bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-text-secondary text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Data</th>
              <th className="text-left px-4 py-3 font-semibold">Tipo</th>
              {sedeTab === 'todas' && <th className="text-left px-4 py-3 font-semibold">Sede</th>}
              <th className="text-left px-4 py-3 font-semibold">Equipamento</th>
              <th className="text-right px-4 py-3 font-semibold">Qtd.</th>
              <th className="text-left px-4 py-3 font-semibold">Chamado</th>
              <th className="text-left px-4 py-3 font-semibold">Colaborador / Operador</th>
              <th className="text-right px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && movs.length === 0 && (
              <tr>
                <td colSpan={sedeTab === 'todas' ? 8 : 7} className="text-center py-10 text-text-muted">
                  Nenhuma movimentação registrada ainda.
                </td>
              </tr>
            )}
            {movs.map((m) => (
              <tr
                key={m.id}
                className={`border-t border-surface-border hover:bg-surface-raised ${m.cancelada ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{fmtData(m.data)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`badge ${m.tipo === 'saida' ? 'badge-critico' : 'badge-ok'}`}>
                      {m.tipo === 'saida' ? 'Saída' : 'Entrada'}
                    </span>
                    {m.cancelada && <span className="badge bg-surface-border text-text-muted">Cancelada</span>}
                  </div>
                </td>
                {sedeTab === 'todas' && (
                  <td className="px-4 py-3 text-text-secondary">
                    {m.equipamento_sede ? SEDE_LABEL[m.equipamento_sede] : '—'}
                  </td>
                )}
                <td className={`px-4 py-3 font-medium text-text-primary ${m.cancelada ? 'line-through' : ''}`}>
                  {m.equipamento_nome}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">{m.quantidade}</td>
                <td className="px-4 py-3 text-text-secondary">{m.chamado || '—'}</td>
                <td className="px-4 py-3 text-text-secondary">
                  <p>{m.colaborador || '—'}</p>
                  {m.operador && <p className="text-xs text-text-muted">registrado por {m.operador}</p>}
                  {m.cancelada && m.cancelada_motivo && (
                    <p className="text-xs text-text-muted">motivo: {m.cancelada_motivo}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {!m.cancelada && podeEditar && (
                      <button onClick={() => openCancel(m)} className="p-1.5 text-text-muted hover:text-danger">
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
        <Modal title="Nova movimentação" onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Sede</label>
              <select
                value={form.sede}
                onChange={(e) => changeFormSede(e.target.value as Sede)}
                className={inputClass}
              >
                <option value="campinas">Campinas</option>
                <option value="sao_paulo">São Paulo</option>
              </select>
            </div>

            <div className="flex gap-2">
              {(['saida', 'entrada'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold border ${
                    form.tipo === t
                      ? t === 'saida'
                        ? 'bg-danger/15 border-danger text-danger-text'
                        : 'bg-ok/15 border-ok text-ok-text'
                      : 'border-surface-border text-text-secondary'
                  }`}
                >
                  {t === 'saida' ? 'Saída (retirada)' : 'Entrada (reposição)'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary">Itens</label>
              <div className="space-y-2 mt-1">
                {form.itens.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      required
                      value={item.equipamento_id}
                      onChange={(e) => updateItem(index, { equipamento_id: e.target.value })}
                      className="min-w-0 flex-1 bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="">Selecione o equipamento…</option>
                      {equipamentos
                        .filter((eq) => eq.sede === form.sede)
                        .map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.nome} (disponível: {eq.estoque_atual} {eq.unidade})
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      required
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, { quantidade: e.target.value })}
                      className="w-20 shrink-0 bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={form.itens.length === 1}
                      className="shrink-0 p-2 text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-accent-light hover:text-accent"
              >
                <IconPlus className="w-3.5 h-3.5" /> Adicionar item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary">Nº do chamado</label>
                <input value={form.chamado} onChange={(e) => setForm({ ...form, chamado: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary">Colaborador (quem recebe)</label>
                <input
                  required
                  value={form.colaborador}
                  onChange={(e) => setForm({ ...form, colaborador: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary">Observação (opcional)</label>
              <textarea
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                rows={2}
                className={inputClass}
              />
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
                Registrar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmCancel && (
        <Modal title="Cancelar movimentação" onClose={() => setConfirmCancel(null)}>
          <p className="text-sm text-text-secondary">
            Cancelar este registro? O estoque de <strong>{confirmCancel.equipamento_nome}</strong> será ajustado de
            volta automaticamente. O registro continua no histórico, marcado como cancelado.
          </p>
          <div className="mt-3">
            <label className="text-xs font-semibold text-text-secondary">Motivo do cancelamento</label>
            <textarea
              autoFocus
              required
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              rows={2}
              className={inputClass}
            />
            {cancelError && <p className="text-xs text-danger-text font-medium mt-1">{cancelError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setConfirmCancel(null)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Voltar
            </button>
            <button
              onClick={handleCancel}
              disabled={!motivoCancelamento.trim()}
              className="px-4 py-2 text-sm font-semibold bg-danger hover:bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar cancelamento
            </button>
          </div>
        </Modal>
      )}

      {showExportDisabled && <DemoDisabledModal onClose={() => setShowExportDisabled(false)} />}
    </div>
  )
}
