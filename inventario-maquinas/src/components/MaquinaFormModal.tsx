import { FormEvent, useEffect, useState } from 'react'
import Modal from './Modal'
import SelectOuOutro from './SelectOuOutro'
import { formatIdade } from '../lib/idade'

export type EstadoOption = { value: string; label: string }

type FormState = {
  patrimonio: string
  modelo: string
  data_entrada: string
  estado: string
  condicao: string
  data_venda: string
  comprador: string
  localizacao: string
  nota: string
}

const inputClass =
  'w-full bg-field border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function MaquinaFormModal<T extends { id: number; patrimonio: string; modelo: string | null; data_entrada: string; estado: string; condicao?: string | null; data_venda?: string | null; comprador?: string | null; localizacao: string | null; nota: string | null }>({
  title,
  estados,
  editing,
  mostrarCondicao,
  onClose,
  onSubmit
}: {
  title: string
  estados: EstadoOption[]
  editing: T | null
  mostrarCondicao?: boolean
  onClose: () => void
  onSubmit: (input: MaquinaInput) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          patrimonio: editing.patrimonio,
          modelo: editing.modelo ?? '',
          data_entrada: editing.data_entrada,
          estado: editing.estado,
          condicao: editing.condicao ?? '',
          data_venda: editing.data_venda ?? '',
          comprador: editing.comprador ?? '',
          localizacao: editing.localizacao ?? '',
          nota: editing.nota ?? ''
        }
      : {
          patrimonio: '',
          modelo: '',
          data_entrada: todayISO(),
          estado: estados[0]?.value ?? '',
          condicao: '',
          data_venda: todayISO(),
          comprador: '',
          localizacao: '',
          nota: ''
        }
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [localizacoes, setLocalizacoes] = useState<string[]>([])
  const [condicoes, setCondicoes] = useState<string[]>([])
  const [modelos, setModelos] = useState<string[]>([])

  useEffect(() => {
    window.api.opcoes.localizacoes().then(setLocalizacoes)
    window.api.opcoes.modelos().then(setModelos)
    if (mostrarCondicao) window.api.opcoes.condicoes().then(setCondicoes)
  }, [mostrarCondicao])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const patrimonio = form.patrimonio.trim()
    if (!patrimonio) {
      setError('Informe o patrimônio.')
      return
    }
    if (!form.data_entrada) {
      setError('Informe a data de entrada.')
      return
    }
    if (form.estado === 'venda') {
      if (!form.data_venda) {
        setError('Informe a data da venda.')
        return
      }
      if (!form.comprador.trim()) {
        setError('Informe o comprador.')
        return
      }
    }
    setSaving(true)
    try {
      await onSubmit({
        patrimonio,
        modelo: form.modelo.trim() || null,
        data_entrada: form.data_entrada,
        estado: form.estado as EstadoNova | EstadoAntiga,
        condicao: mostrarCondicao ? form.condicao.trim() || null : undefined,
        data_venda: form.estado === 'venda' ? form.data_venda : null,
        comprador: form.estado === 'venda' ? form.comprador.trim() || null : null,
        localizacao: form.localizacao.trim() || null,
        nota: form.nota.trim() || null
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a máquina.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-text-secondary">Patrimônio</label>
          <input
            autoFocus
            required
            value={form.patrimonio}
            onChange={(e) => setForm({ ...form, patrimonio: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary">Modelo</label>
          <input
            list="modelos-sugeridos"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            className={inputClass}
          />
          <datalist id="modelos-sugeridos">
            {modelos.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary">Data de entrada</label>
            <input
              type="date"
              required
              value={form.data_entrada}
              onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className={inputClass}
            >
              {estados.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {mostrarCondicao && (
          <div>
            <label className="text-xs font-semibold text-text-secondary">Condição</label>
            <SelectOuOutro
              value={form.condicao}
              onChange={(v) => setForm({ ...form, condicao: v })}
              options={condicoes}
              placeholder="Digite a condição…"
            />
          </div>
        )}
        {form.estado === 'venda' && (
          <div className="grid grid-cols-2 gap-3 bg-danger/10 border border-danger/20 rounded-md p-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Data da venda</label>
              <input
                type="date"
                value={form.data_venda}
                onChange={(e) => setForm({ ...form, data_venda: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Comprador</label>
              <input
                value={form.comprador}
                onChange={(e) => setForm({ ...form, comprador: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-text-secondary">Localização</label>
          <SelectOuOutro
            value={form.localizacao}
            onChange={(v) => setForm({ ...form, localizacao: v })}
            options={localizacoes}
            placeholder="Digite a localização ou nome do colaborador…"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary">Nota</label>
          <textarea
            rows={2}
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            className={inputClass}
          />
        </div>
        <p className="text-xs text-text-muted">
          Idade calculada: <span className="font-semibold text-text-secondary">{formatIdade(form.data_entrada)}</span>
        </p>

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
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-dark text-white rounded-md disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
