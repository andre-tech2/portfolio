import * as XLSX from 'xlsx'
import {
  listMaquinasAntigas,
  listMaquinasNovas,
  upsertMaquinasAntigas,
  upsertMaquinasNovas,
  type ImportRow
} from './store'

const ESTADOS_NOVAS = new Set(['entrada', 'saida'])
const ESTADOS_ANTIGAS = new Set(['em_atuacao', 'parada', 'venda'])
const ESTADO_LABEL: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  em_atuacao: 'Em Atuação',
  parada: 'Parada',
  venda: 'Venda'
}

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

function normalizeValue(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function parseDataEntrada(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const utcMs = Math.round((value - 25569) * 86400 * 1000)
    const d = new Date(utcMs)
    if (!Number.isNaN(d.getTime())) return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
    return null
  }
  const str = String(value ?? '').trim()
  if (!str) return null
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const br = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (br) return `${br[3]}-${pad2(Number(br[2]))}-${pad2(Number(br[1]))}`
  return null
}

function normalizeEstado(tabela: 'novas' | 'antigas', raw: unknown): string | null {
  const v = normalizeValue(raw)
  const mapa: Record<string, string> = {
    entrada: 'entrada',
    saida: 'saida',
    'em atuacao': 'em_atuacao',
    'em_atuacao': 'em_atuacao',
    parada: 'parada',
    venda: 'venda'
  }
  const estado = mapa[v] ?? v
  const validos = tabela === 'novas' ? ESTADOS_NOVAS : ESTADOS_ANTIGAS
  return validos.has(estado) ? estado : null
}

export function exportarXlsx(tabela: 'novas' | 'antigas') {
  const dados =
    tabela === 'novas'
      ? listMaquinasNovas().map((m) => ({
          Patrimônio: m.patrimonio,
          Modelo: m.modelo ?? '',
          'Data de Entrada': m.data_entrada,
          Estado: ESTADO_LABEL[m.estado] ?? m.estado,
          Localização: m.localizacao ?? '',
          Nota: m.nota ?? ''
        }))
      : listMaquinasAntigas().map((m) => ({
          Patrimônio: m.patrimonio,
          Modelo: m.modelo ?? '',
          'Data de Entrada': m.data_entrada,
          Estado: ESTADO_LABEL[m.estado] ?? m.estado,
          Condição: m.condicao ?? '',
          'Data da Venda': m.data_venda ?? '',
          Comprador: m.comprador ?? '',
          Localização: m.localizacao ?? '',
          Nota: m.nota ?? ''
        }))

  const ws = XLSX.utils.json_to_sheet(dados)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, tabela === 'novas' ? 'Máquinas Novas' : 'Máquinas Antigas')
  XLSX.writeFile(wb, `novatech-maquinas-${tabela}.xlsx`)
}

export async function importarXlsx(file: File, tabela: 'novas' | 'antigas'): Promise<ImportReport> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('A planilha não tem nenhuma aba com dados.')
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })

  const rows: ImportRow[] = []
  const detalhesIgnorados: string[] = []

  rawRows.forEach((raw, index) => {
    const linha = index + 2
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(raw)) mapped[normalizeHeaderKey(key)] = value

    const patrimonio = String(
      mapped['patrimonio'] || mapped['numero do patrimonio'] || mapped['no patrimonio'] || ''
    ).trim()
    if (!patrimonio) {
      detalhesIgnorados.push(`Linha ${linha}: sem patrimônio.`)
      return
    }

    const estado = normalizeEstado(tabela, mapped['estado'])
    if (!estado) {
      detalhesIgnorados.push(`Linha ${linha} (patrimônio ${patrimonio}): valor de Estado inválido para esta tabela.`)
      return
    }

    const dataEntrada = parseDataEntrada(mapped['data de entrada'] ?? mapped['data entrada'] ?? mapped['data_entrada'])
    if (!dataEntrada) {
      detalhesIgnorados.push(`Linha ${linha} (patrimônio ${patrimonio}): data de entrada inválida ou ausente.`)
      return
    }

    if (estado === 'venda') {
      const dataVenda = parseDataEntrada(mapped['data da venda'] ?? mapped['data venda'] ?? mapped['data_venda'])
      const comprador = mapped['comprador'] ? String(mapped['comprador']).trim() : ''
      if (!dataVenda || !comprador) {
        detalhesIgnorados.push(`Linha ${linha} (patrimônio ${patrimonio}): venda precisa de Data da Venda e Comprador.`)
        return
      }
    }

    rows.push({
      patrimonio,
      modelo: mapped['modelo'] ? String(mapped['modelo']).trim() : null,
      data_entrada: dataEntrada,
      estado,
      condicao: mapped['condicao'] ? String(mapped['condicao']).trim() : null,
      localizacao: mapped['localizacao'] ? String(mapped['localizacao']).trim() : null,
      nota: mapped['nota'] ? String(mapped['nota']).trim() : mapped['observacao'] ? String(mapped['observacao']).trim() : null
    })
  })

  const resultado =
    tabela === 'novas' ? await upsertMaquinasNovas(rows) : await upsertMaquinasAntigas(rows)

  return {
    novasCriadas: tabela === 'novas' ? resultado.criadas : 0,
    novasAtualizadas: tabela === 'novas' ? resultado.atualizadas : 0,
    antigasCriadas: tabela === 'antigas' ? resultado.criadas : 0,
    antigasAtualizadas: tabela === 'antigas' ? resultado.atualizadas : 0,
    ignoradas: detalhesIgnorados.length,
    detalhesIgnorados
  }
}
