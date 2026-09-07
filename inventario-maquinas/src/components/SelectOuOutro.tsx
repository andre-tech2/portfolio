import { useState } from 'react'

const inputClass =
  'w-full bg-surface-raised border border-surface-border/15 rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mt-1 focus:outline-none focus:ring-2 focus:ring-accent/50'

const OUTRO = '__outro__'

export default function SelectOuOutro({
  value,
  onChange,
  options,
  placeholder
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  const [outroForcado, setOutroForcado] = useState(false)
  const emOutroModo = outroForcado || (value !== '' && !options.includes(value))

  if (emOutroModo) {
    return (
      <div className="flex gap-2 items-center mt-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} mt-0`}
        />
        <button
          type="button"
          onClick={() => {
            setOutroForcado(false)
            onChange('')
          }}
          className="text-xs font-medium text-text-secondary hover:text-text-primary whitespace-nowrap px-1"
        >
          Escolher da lista
        </button>
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === OUTRO) {
          setOutroForcado(true)
          onChange('')
        } else {
          onChange(e.target.value)
        }
      }}
      className={inputClass}
    >
      <option value="">Selecione…</option>
      {options.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
      <option value={OUTRO}>Outro (digitar)…</option>
    </select>
  )
}
