import * as XLSX from 'xlsx'
import { importEquipamentos, type ImportRow } from './store'

function normalizeHeaderKey(key: string) {
  return key
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export async function importEquipamentosFile(file: File, sede: Sede): Promise<ImportResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('A planilha não tem nenhuma aba com dados.')
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })

  const rows: ImportRow[] = rawRows.map((raw) => {
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(raw)) mapped[normalizeHeaderKey(key)] = value
    return {
      nome: String(mapped['nome'] ?? '').trim(),
      categoria: mapped['categoria'] ? String(mapped['categoria']).trim() : null,
      unidade: mapped['unidade'] ? String(mapped['unidade']).trim() : 'un',
      estoque_atual: Number(mapped['estoque atual'] ?? 0),
      estoque_minimo: Number(mapped['estoque minimo'] ?? 0)
    }
  })

  return importEquipamentos(rows, sede)
}
