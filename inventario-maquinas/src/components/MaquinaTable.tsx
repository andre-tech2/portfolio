import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import MaquinaFormModal, { EstadoOption } from './MaquinaFormModal'
import ImportResultModal from './ImportResultModal'
import { IconDownload, IconEdit, IconMove, IconPlus, IconTrash, IconUpload } from './icons'
import { formatIdade } from '../lib/idade'

type Maquina = {
  id: number
  patrimonio: string
  modelo: string | null
  data_entrada: string
  estado: string
  condicao?: string | null
  data_venda?: string | null
  comprador?: string | null
  localizacao: string | null
  nota: string | null
}

type MaquinaApi = {
  list: (estado?: string) => Promise<Maquina[]>
  create: (input: MaquinaInput) => Promise<SyncResult>
  update: (id: number, input: MaquinaInput) => Promise<SyncResult>
  delete: (id: number, motivo: string, analista: string) => Promise<SyncResult>
}

export type MoverParaConfig = {
  estados: EstadoOption[]
  onMover: (id: number, estadoDestino: string, vendaInfo?: VendaInfo) => Promise<{ warning: string | null }>
}

export default function MaquinaTable({
  titulo,
  subtitulo,
  estados,
  estadoLabels,
  api,
  tabela,
  refreshKey,
  onCountChange,
  moverPara,
  mostrarCondicao,
  papel,
  usuarioNome
}: {
  titulo: string
  subtitulo: string
  estados: EstadoOption[]
  estadoLabels: Record<string, string>
  api: MaquinaApi
  tabela: 'novas' | 'antigas'
  refreshKey: number
  onCountChange: (n: number) => void
  moverPara?: MoverParaConfig
  mostrarCondicao?: boolean
  papel: Papel
  usuarioNome: string
}) {
  const podeEditar = papel === 'editar' || papel === 'gerenciar'
  const podeExcluir = papel === 'gerenciar'
  const [estadoTab, setEstadoTab] = useState<string>('todas')
  const [items, setItems] = useState<Maquina[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Maquina | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Maquina | null>(null)
  const [motivo, setMotivo] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [moverAlvo, setMoverAlvo] = useState<Maquina | null>(null)
  const [moverEstadoVenda, setMoverEstadoVenda] = useState<string | null>(null)
  const [vendaDataForm, setVendaDataForm] = useState('')
  const [vendaCompradorForm, setVendaCompradorForm] = useState('')
  const [moverError, setMoverError] = useState<string | null>(null)
  const [movendo, setMovendo] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.list(estadoTab === 'todas' ? undefined : estadoTab)
    setItems(data)
    setLoading(false)
    if (estadoTab === 'todas') onCountChange(data.length)
  }, [api, estadoTab, onCountChange])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  async function handleSubmit(input: MaquinaInput) {
    if (editing) await api.update(editing.id, input)
    else await api.create(input)
    await load()
  }

  function openDelete(m: Maquina) {
    setConfirmDelete(m)
    setMotivo('')
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    if (!motivo.trim()) {
      setDeleteError('Informe o motivo da remoção.')
      return
    }
    setDeleting(true)
    try {
      await api.delete(confirmDelete.id, motivo.trim(), usuarioNome)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Não foi possível remover a máquina.')
    } finally {
      setDeleting(false)
    }
  }

  function fecharMover() {
    setMoverAlvo(null)
    setMoverEstadoVenda(null)
    setVendaDataForm('')
    setVendaCompradorForm('')
    setMoverError(null)
  }

  async function handleMover(estadoDestino: string, vendaInfo?: VendaInfo) {
    if (!moverAlvo || !moverPara) return
    setMoverError(null)
    setMovendo(true)
    try {
      await moverPara.onMover(moverAlvo.id, estadoDestino, vendaInfo)
      fecharMover()
      await load()
    } catch (err) {
      setMoverError(err instanceof Error ? err.message : 'Não foi possível mover a máquina.')
    } finally {
      setMovendo(false)
    }
  }

  function handleConfirmarVenda() {
    if (!vendaDataForm) {
      setMoverError('Informe a data da venda.')
      return
    }
    if (!vendaCompradorForm.trim()) {
      setMoverError('Informe o comprador.')
      return
    }
    handleMover('venda', { data_venda: vendaDataForm, comprador: vendaCompradorForm.trim() })
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const report = await window.api.planilha.importar(file, tabela)
      setImportReport(report)
      await load()
    } catch (err) {
      setImportReport({
        novasCriadas: 0,
        novasAtualizadas: 0,
        antigasCriadas: 0,
        antigasAtualizadas: 0,
        ignoradas: 0,
        detalhesIgnorados: [err instanceof Error ? err.message : 'Falha ao importar a planilha.']
      })
    } finally {
      setImporting(false)
    }
  }

  const filtered = items.filter((m) => {
    const q = busca.toLowerCase()
    return (
      m.patrimonio.toLowerCase().includes(q) ||
      (m.modelo ?? '').toLowerCase().includes(q) ||
      (m.localizacao ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{titulo}</h1>
          <p className="text-sm text-text-secondary">{subtitulo}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelected} />
          <button
            onClick={() => window.api.planilha.exportar(tabela)}
            className="flex items-center gap-2 glass hover:bg-surface-raised/60 text-text-primary font-semibold text-sm px-4 py-2 rounded-md transition-colors"
          >
            <IconDownload className="w-4 h-4" /> Exportar
          </button>
          {podeEditar && (
            <>
              <button
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 glass hover:bg-surface-raised/60 text-text-primary font-semibold text-sm px-4 py-2 rounded-md disabled:opacity-60 transition-colors"
              >
                <IconUpload className="w-4 h-4" /> {importing ? 'Importando…' : 'Importar planilha'}
              </button>
              <button
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-accent-cyan via-accent to-accent-violet text-white font-semibold text-sm px-4 py-2 rounded-md shadow-glow"
              >
                <IconPlus className="w-4 h-4" /> Nova máquina
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 glass rounded-lg p-1 w-fit">
        <button
          onClick={() => setEstadoTab('todas')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            estadoTab === 'todas' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/50'
          }`}
        >
          Todas
        </button>
        {estados.map((op) => (
          <button
            key={op.value}
            onClick={() => setEstadoTab(op.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              estadoTab === op.value ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/50'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por patrimônio, modelo ou localização…"
        className="w-full max-w-sm bg-field border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      <div className="glass rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised/40 text-text-secondary text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Patrimônio</th>
              <th className="text-left px-4 py-3 font-semibold">Modelo</th>
              <th className="text-left px-4 py-3 font-semibold">Data de entrada</th>
              <th className="text-left px-4 py-3 font-semibold">Estado</th>
              {mostrarCondicao && <th className="text-left px-4 py-3 font-semibold">Condição</th>}
              {mostrarCondicao && <th className="text-left px-4 py-3 font-semibold">Data da Venda</th>}
              {mostrarCondicao && <th className="text-left px-4 py-3 font-semibold">Comprador</th>}
              <th className="text-left px-4 py-3 font-semibold">Localização</th>
              <th className="text-left px-4 py-3 font-semibold">Nota</th>
              <th className="text-left px-4 py-3 font-semibold">Idade</th>
              <th className="text-right px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={mostrarCondicao ? 11 : 8} className="text-center py-10 text-text-muted">
                  Nenhuma máquina cadastrada ainda.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-surface-border/10 hover:bg-surface-raised/30">
                <td className="px-4 py-3 font-medium text-text-primary">{m.patrimonio}</td>
                <td className="px-4 py-3 text-text-secondary">{m.modelo || '—'}</td>
                <td className="px-4 py-3 text-text-secondary">{m.data_entrada}</td>
                <td className="px-4 py-3">
                  <span className={`badge badge-${m.estado}`}>{estadoLabels[m.estado] ?? m.estado}</span>
                </td>
                {mostrarCondicao && <td className="px-4 py-3 text-text-secondary">{m.condicao || '—'}</td>}
                {mostrarCondicao && <td className="px-4 py-3 text-text-secondary">{m.data_venda || '—'}</td>}
                {mostrarCondicao && <td className="px-4 py-3 text-text-secondary">{m.comprador || '—'}</td>}
                <td className="px-4 py-3 text-text-secondary">{m.localizacao || '—'}</td>
                <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate" title={m.nota ?? undefined}>
                  {m.nota || '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatIdade(m.data_entrada)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {moverPara && podeEditar && (
                      <button
                        onClick={() => setMoverAlvo(m)}
                        title="Mover para Máquinas Antigas"
                        className="p-1.5 text-text-muted hover:text-accent"
                      >
                        <IconMove className="w-4 h-4" />
                      </button>
                    )}
                    {podeEditar && (
                      <button
                        onClick={() => {
                          setEditing(m)
                          setModalOpen(true)
                        }}
                        className="p-1.5 text-text-muted hover:text-text-primary"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                    )}
                    {podeExcluir && (
                      <button onClick={() => openDelete(m)} className="p-1.5 text-text-muted hover:text-danger">
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
        <MaquinaFormModal
          title={editing ? 'Editar máquina' : 'Nova máquina'}
          estados={estados}
          editing={editing}
          mostrarCondicao={mostrarCondicao}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {confirmDelete && (
        <Modal title="Excluir máquina" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Tem certeza que deseja excluir o patrimônio <strong>{confirmDelete.patrimonio}</strong>? Isso fica
              registrado no histórico de remoções como removido por <strong>{usuarioNome}</strong>.
            </p>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Motivo da remoção</label>
              <textarea
                autoFocus
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-field border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            {deleteError && <p className="text-xs text-danger-text font-medium">{deleteError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Cancelar
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold bg-danger hover:bg-red-600 text-white rounded-md disabled:opacity-60"
              >
                {deleting ? 'Removendo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {moverAlvo && moverPara && (
        <Modal title="Mover para Máquinas Antigas" onClose={fecharMover}>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Escolha o novo estado do patrimônio <strong>{moverAlvo.patrimonio}</strong> em Máquinas Antigas:
            </p>

            {moverEstadoVenda !== 'venda' && (
              <div className="flex flex-col gap-2">
                {moverPara.estados.map((op) => (
                  <button
                    key={op.value}
                    disabled={movendo}
                    onClick={() => (op.value === 'venda' ? setMoverEstadoVenda('venda') : handleMover(op.value))}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium bg-surface-raised/40 border border-surface-border/15 hover:border-accent hover:bg-accent/10 rounded-md disabled:opacity-60"
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            )}

            {moverEstadoVenda === 'venda' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary">Data da venda</label>
                    <input
                      type="date"
                      autoFocus
                      value={vendaDataForm}
                      onChange={(e) => setVendaDataForm(e.target.value)}
                      className="w-full bg-field border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary">Comprador</label>
                    <input
                      value={vendaCompradorForm}
                      onChange={(e) => setVendaCompradorForm(e.target.value)}
                      className="w-full bg-field border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-1">
                  <button
                    onClick={() => setMoverEstadoVenda(null)}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={movendo}
                    onClick={handleConfirmarVenda}
                    className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md disabled:opacity-60"
                  >
                    {movendo ? 'Movendo…' : 'Confirmar venda'}
                  </button>
                </div>
              </div>
            )}

            {moverError && <p className="text-xs text-danger-text font-medium">{moverError}</p>}

            {moverEstadoVenda !== 'venda' && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={fecharMover}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {importReport && <ImportResultModal report={importReport} onClose={() => setImportReport(null)} />}
    </div>
  )
}
