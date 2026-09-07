import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { loadBlob, saveBlob, clearBlob } from './idb'
import { hashSenha, verificaSenha } from './crypto'

const SENHA_MIN_LEN = 10
const SESSION_KEY = 'estoque-sessao-usuario-id'
const LIMIAR_BAIXO_PADRAO = 120

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let limiarBaixoPercentual = LIMIAR_BAIXO_PADRAO

function statusOf(atual: number, minimo: number): EquipamentoComStatus['status'] {
  if (atual <= minimo) return 'critico'
  if (atual <= minimo * (limiarBaixoPercentual / 100)) return 'baixo'
  return 'ok'
}

async function persist() {
  if (!db) return
  const data = db.export()
  await saveBlob(data)
}

function all<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db!.prepare(sql)
  stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) rows.push(stmt.getAsObject() as T)
  stmt.free()
  return rows
}

function run(sql: string, params: any[] = []) {
  db!.run(sql, params)
}

function runMigrations() {
  db!.run(`
    CREATE TABLE IF NOT EXISTS equipamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT,
      unidade TEXT NOT NULL DEFAULT 'un',
      estoque_atual INTEGER NOT NULL DEFAULT 0,
      estoque_minimo INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      sede TEXT NOT NULL DEFAULT 'campinas'
    );
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipamento_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('saida','entrada')),
      quantidade INTEGER NOT NULL,
      chamado TEXT,
      colaborador TEXT,
      operador TEXT,
      observacao TEXT,
      data TEXT NOT NULL DEFAULT (datetime('now')),
      cancelada INTEGER NOT NULL DEFAULT 0,
      cancelada_em TEXT,
      cancelada_motivo TEXT,
      FOREIGN KEY(equipamento_id) REFERENCES equipamentos(id)
    );
    CREATE INDEX IF NOT EXISTS idx_mov_equip ON movimentacoes(equipamento_id);
    CREATE INDEX IF NOT EXISTS idx_mov_data ON movimentacoes(data);
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      senha_hash TEXT NOT NULL,
      senha_salt TEXT NOT NULL,
      papel TEXT NOT NULL CHECK(papel IN ('visualizar','editar','gerenciar')),
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const salvo = all<{ valor: string }>(`SELECT valor FROM configuracoes WHERE chave = 'limiar_baixo_percentual'`)
  const valorSalvo = salvo[0] ? Number(salvo[0].valor) : NaN
  limiarBaixoPercentual = Number.isFinite(valorSalvo) && valorSalvo > 100 ? valorSalvo : LIMIAR_BAIXO_PADRAO
}

export async function initEngine(): Promise<{ isNovo: boolean }> {
  if (!SQL) {
    // No navegador, o wasm precisa ser buscado pela URL resolvida pelo Vite (respeitando o `base`).
    // Em Node (testes), sql.js já sabe ler o arquivo direto do disco ao lado de sql-wasm.js.
    SQL = typeof window === 'undefined' ? await initSqlJs() : await initSqlJs({ locateFile: () => sqlWasmUrl })
  }
  const blob = await loadBlob()
  const isNovo = !blob
  db = blob ? new SQL.Database(blob) : new SQL.Database()
  runMigrations()
  if (isNovo) await persist()
  return { isNovo }
}

export async function resetarTudo() {
  db?.close()
  db = null
  await clearBlob()
  sessionStorage.removeItem(SESSION_KEY)
  await initEngine()
}

export function getLimiarBaixoPercentual() {
  return limiarBaixoPercentual
}

export async function setLimiarBaixoPercentual(valor: number) {
  if (!Number.isFinite(valor) || valor <= 100) {
    throw new Error('O limiar precisa ser um número maior que 100.')
  }
  const arredondado = Math.round(valor)
  run(
    `INSERT INTO configuracoes (chave, valor) VALUES ('limiar_baixo_percentual', ?)
       ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    [String(arredondado)]
  )
  limiarBaixoPercentual = arredondado
  await persist()
}

// ---------- Equipamentos ----------

export function listEquipamentos(sede?: Sede): EquipamentoComStatus[] {
  const where = sede ? `WHERE sede = ?` : ''
  const params = sede ? [sede] : []
  const rows = all<Equipamento>(`SELECT * FROM equipamentos ${where} ORDER BY nome COLLATE NOCASE ASC`, params)
  return rows.map((r) => ({ ...r, status: statusOf(r.estoque_atual, r.estoque_minimo) }))
}

function equipamentoNomeExists(nome: string, sede: Sede, excludeId?: number): boolean {
  const rows = excludeId
    ? all<{ id: number }>(`SELECT id FROM equipamentos WHERE LOWER(nome) = LOWER(?) AND sede = ? AND id != ?`, [
        nome,
        sede,
        excludeId
      ])
    : all<{ id: number }>(`SELECT id FROM equipamentos WHERE LOWER(nome) = LOWER(?) AND sede = ?`, [nome, sede])
  return rows.length > 0
}

function validateEquipamentoInput(
  input: { nome: string; estoque_atual: number; estoque_minimo: number; sede: Sede },
  excludeId?: number
): string {
  const nome = input.nome.trim()
  if (!nome) throw new Error('Informe o nome do equipamento.')
  if (equipamentoNomeExists(nome, input.sede, excludeId)) {
    throw new Error(`Já existe um equipamento chamado "${nome}" nessa sede.`)
  }
  if (input.estoque_atual < 0) throw new Error('Estoque atual não pode ser negativo.')
  if (input.estoque_minimo < 0) throw new Error('Estoque mínimo não pode ser negativo.')
  return nome
}

export async function createEquipamento(input: {
  nome: string
  categoria: string | null
  unidade: string
  estoque_atual: number
  estoque_minimo: number
  sede: Sede
}) {
  const nome = validateEquipamentoInput(input)
  run(
    `INSERT INTO equipamentos (nome, categoria, unidade, estoque_atual, estoque_minimo, sede) VALUES (?,?,?,?,?,?)`,
    [nome, input.categoria, input.unidade, input.estoque_atual, input.estoque_minimo, input.sede]
  )
  await persist()
}

export async function updateEquipamento(
  id: number,
  input: {
    nome: string
    categoria: string | null
    unidade: string
    estoque_atual: number
    estoque_minimo: number
    sede: Sede
  }
) {
  const nome = validateEquipamentoInput(input, id)
  run(
    `UPDATE equipamentos SET nome=?, categoria=?, unidade=?, estoque_atual=?, estoque_minimo=?, sede=? WHERE id=?`,
    [nome, input.categoria, input.unidade, input.estoque_atual, input.estoque_minimo, input.sede, id]
  )
  await persist()
}

export async function deleteEquipamento(id: number) {
  run(`DELETE FROM movimentacoes WHERE equipamento_id=?`, [id])
  run(`DELETE FROM equipamentos WHERE id=?`, [id])
  await persist()
}

// ---------- Movimentações ----------

export function listMovimentacoes(
  filters: {
    busca?: string
    equipamentoId?: number
    tipo?: 'saida' | 'entrada'
    dataInicio?: string
    dataFim?: string
    sede?: Sede
  } = {}
): Movimentacao[] {
  const clauses: string[] = []
  const params: any[] = []

  if (filters.busca) {
    clauses.push(`(m.chamado LIKE ? OR m.colaborador LIKE ? OR e.nome LIKE ?)`)
    const like = `%${filters.busca}%`
    params.push(like, like, like)
  }
  if (filters.equipamentoId) {
    clauses.push(`m.equipamento_id = ?`)
    params.push(filters.equipamentoId)
  }
  if (filters.tipo) {
    clauses.push(`m.tipo = ?`)
    params.push(filters.tipo)
  }
  if (filters.dataInicio) {
    clauses.push(`m.data >= ?`)
    params.push(filters.dataInicio)
  }
  if (filters.dataFim) {
    clauses.push(`m.data <= ?`)
    params.push(filters.dataFim)
  }
  if (filters.sede) {
    clauses.push(`e.sede = ?`)
    params.push(filters.sede)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = all<Omit<Movimentacao, 'cancelada'> & { cancelada: number }>(
    `SELECT m.*, e.nome as equipamento_nome, e.sede as equipamento_sede
     FROM movimentacoes m
     JOIN equipamentos e ON e.id = m.equipamento_id
     ${where}
     ORDER BY m.data DESC, m.id DESC`,
    params
  )
  return rows.map((r) => ({ ...r, cancelada: Boolean(r.cancelada) }))
}

function assertEstoqueSuficiente(equipamentoId: number, quantidade: number) {
  const eq = all<Equipamento>(`SELECT * FROM equipamentos WHERE id=?`, [equipamentoId])[0]
  if (!eq) throw new Error('Equipamento não encontrado.')
  if (quantidade > eq.estoque_atual) {
    throw new Error(`Estoque insuficiente de "${eq.nome}". Disponível: ${eq.estoque_atual} ${eq.unidade}.`)
  }
}

export async function createMovimentacoesBatch(input: {
  tipo: 'saida' | 'entrada'
  chamado: string | null
  colaborador: string | null
  operador: string | null
  observacao: string | null
  itens: { equipamento_id: number; quantidade: number }[]
}) {
  if (!input.colaborador?.trim()) throw new Error('Informe o nome do colaborador.')
  if (!input.operador?.trim()) throw new Error('Informe quem está registrando a movimentação.')
  if (input.itens.length === 0) throw new Error('Adicione pelo menos um item.')
  for (const item of input.itens) {
    if (item.quantidade <= 0) throw new Error('Quantidade deve ser maior que zero em todos os itens.')
  }

  if (input.tipo === 'saida') {
    const aggregated = new Map<number, number>()
    for (const item of input.itens) {
      aggregated.set(item.equipamento_id, (aggregated.get(item.equipamento_id) ?? 0) + item.quantidade)
    }
    for (const [equipamentoId, quantidade] of aggregated) {
      assertEstoqueSuficiente(equipamentoId, quantidade)
    }
  }

  for (const item of input.itens) {
    const delta = input.tipo === 'saida' ? -item.quantidade : item.quantidade
    run(`UPDATE equipamentos SET estoque_atual = estoque_atual + ? WHERE id = ?`, [delta, item.equipamento_id])
    run(
      `INSERT INTO movimentacoes (equipamento_id, tipo, quantidade, chamado, colaborador, operador, observacao) VALUES (?,?,?,?,?,?,?)`,
      [item.equipamento_id, input.tipo, item.quantidade, input.chamado, input.colaborador, input.operador, input.observacao]
    )
  }
  await persist()
}

export async function cancelarMovimentacao(id: number, motivo: string | null) {
  const motivoTrim = motivo?.trim() ?? ''
  if (!motivoTrim) throw new Error('Informe o motivo do cancelamento.')

  const rows = all<Omit<Movimentacao, 'cancelada'> & { cancelada: number }>(`SELECT * FROM movimentacoes WHERE id=?`, [id])
  const mov = rows[0]
  if (!mov) throw new Error('Movimentação não encontrada.')
  if (mov.cancelada) throw new Error('Esta movimentação já foi cancelada.')

  const delta = mov.tipo === 'saida' ? mov.quantidade : -mov.quantidade
  run(`UPDATE equipamentos SET estoque_atual = estoque_atual + ? WHERE id = ?`, [delta, mov.equipamento_id])
  run(`UPDATE movimentacoes SET cancelada=1, cancelada_em=datetime('now'), cancelada_motivo=? WHERE id=?`, [
    motivoTrim,
    id
  ])
  await persist()
}

// ---------- Importação em lote ----------

export type ImportRow = {
  nome: string
  categoria: string | null
  unidade: string
  estoque_atual: number
  estoque_minimo: number
}

export async function importEquipamentos(rows: ImportRow[], sede: Sede): Promise<ImportResult> {
  let criados = 0
  let ignorados = 0
  const detalhesIgnorados: string[] = []

  for (const row of rows) {
    const nome = (row.nome ?? '').trim()
    if (!nome) {
      ignorados++
      detalhesIgnorados.push('Linha sem nome')
      continue
    }
    if (equipamentoNomeExists(nome, sede)) {
      ignorados++
      detalhesIgnorados.push(`"${nome}" já existe nessa sede`)
      continue
    }
    const estoqueAtual = Number.isFinite(row.estoque_atual) && row.estoque_atual >= 0 ? Math.trunc(row.estoque_atual) : 0
    const estoqueMinimo =
      Number.isFinite(row.estoque_minimo) && row.estoque_minimo >= 0 ? Math.trunc(row.estoque_minimo) : 0
    run(
      `INSERT INTO equipamentos (nome, categoria, unidade, estoque_atual, estoque_minimo, sede) VALUES (?,?,?,?,?,?)`,
      [nome, row.categoria || null, row.unidade || 'un', estoqueAtual, estoqueMinimo, sede]
    )
    criados++
  }
  await persist()
  return { criados, ignorados, detalhesIgnorados }
}

// ---------- Dashboard ----------

function primeiroDiaDoMes(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function equipamentosComEstoqueEm(dataFim: string, sede?: Sede): EquipamentoComStatus[] {
  const sedeClause = sede ? `AND e.sede = ?` : ''
  const sedeParam = sede ? [sede] : []
  const rows = all<Equipamento>(
    `SELECT e.id, e.nome, e.categoria, e.unidade, e.estoque_minimo, e.criado_em, e.sede,
            e.estoque_atual + COALESCE(SUM(
              CASE WHEN m.tipo='saida' THEN m.quantidade WHEN m.tipo='entrada' THEN -m.quantidade ELSE 0 END
            ), 0) as estoque_atual
     FROM equipamentos e
     LEFT JOIN movimentacoes m ON m.equipamento_id = e.id AND m.cancelada = 0 AND date(m.data) > ?
     WHERE 1=1 ${sedeClause}
     GROUP BY e.id
     ORDER BY e.nome COLLATE NOCASE ASC`,
    [dataFim, ...sedeParam]
  )
  return rows.map((r) => ({ ...r, status: statusOf(r.estoque_atual, r.estoque_minimo) }))
}

export function getDashboardStats(periodo?: { dataInicio: string; dataFim: string }, sede?: Sede): DashboardStats {
  const dataInicio = periodo?.dataInicio ?? primeiroDiaDoMes()
  const dataFim = periodo?.dataFim ?? hojeISO()

  const equipamentos = equipamentosComEstoqueEm(dataFim, sede)
  const totalEquipamentos = equipamentos.length
  const alertas = equipamentos
    .filter((e) => e.status !== 'ok')
    .sort((a, b) => {
      const order = { critico: 0, baixo: 1, ok: 2 }
      return order[a.status] - order[b.status]
    })
  const itensAbaixoMinimo = equipamentos.filter((e) => e.status === 'critico').length

  const sedeClause = sede ? `AND e.sede = ?` : ''
  const sedeParam = sede ? [sede] : []

  const retiradasRow = all<{ total: number }>(
    `SELECT COALESCE(SUM(m.quantidade),0) as total FROM movimentacoes m
     JOIN equipamentos e ON e.id = m.equipamento_id
     WHERE m.tipo='saida' AND m.cancelada=0 AND date(m.data) BETWEEN ? AND ? ${sedeClause}`,
    [dataInicio, dataFim, ...sedeParam]
  )
  const chamadosRow = all<{ total: number }>(
    `SELECT COUNT(DISTINCT m.chamado) as total FROM movimentacoes m
     JOIN equipamentos e ON e.id = m.equipamento_id
     WHERE m.tipo='saida' AND m.cancelada=0 AND m.chamado IS NOT NULL AND m.chamado <> ''
     AND date(m.data) BETWEEN ? AND ? ${sedeClause}`,
    [dataInicio, dataFim, ...sedeParam]
  )

  const movimentacoesPorDiaRaw = all<{ dia: string; tipo: string; total: number }>(
    `SELECT date(m.data) as dia, m.tipo, SUM(m.quantidade) as total
     FROM movimentacoes m
     JOIN equipamentos e ON e.id = m.equipamento_id
     WHERE m.cancelada=0 AND date(m.data) BETWEEN ? AND ? ${sedeClause}
     GROUP BY date(m.data), m.tipo
     ORDER BY dia ASC`,
    [dataInicio, dataFim, ...sedeParam]
  )

  const diaMap = new Map<string, { saidas: number; entradas: number }>()
  const cursor = new Date(`${dataInicio}T00:00:00`)
  const fim = new Date(`${dataFim}T00:00:00`)
  while (cursor <= fim) {
    diaMap.set(cursor.toISOString().slice(0, 10), { saidas: 0, entradas: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  for (const row of movimentacoesPorDiaRaw) {
    const entry = diaMap.get(row.dia)
    if (entry) {
      if (row.tipo === 'saida') entry.saidas = row.total
      else entry.entradas = row.total
    }
  }

  return {
    totalEquipamentos,
    itensAbaixoMinimo,
    retiradasNoPeriodo: retiradasRow[0]?.total ?? 0,
    chamadosNoPeriodo: chamadosRow[0]?.total ?? 0,
    periodo: { inicio: dataInicio, fim: dataFim },
    estoquePorEquipamento: equipamentos.map((e) => ({ nome: e.nome, atual: e.estoque_atual, minimo: e.estoque_minimo })),
    movimentacoesPorDia: Array.from(diaMap.entries()).map(([dia, v]) => ({ dia, ...v })),
    alertas
  }
}

// ---------- Usuários / autenticação ----------

function toUsuario(row: {
  id: number
  nome: string
  email: string
  papel: Papel
  ativo: number
  criado_em: string
}): Usuario {
  return { id: row.id, nome: row.nome, email: row.email, papel: row.papel, ativo: Boolean(row.ativo), criado_em: row.criado_em }
}

export function listUsuarios(): Usuario[] {
  return all<any>(`SELECT * FROM usuarios ORDER BY nome COLLATE NOCASE ASC`).map(toUsuario)
}

export async function login(email: string, senha: string): Promise<Usuario> {
  const rows = all<any>(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)`, [email.trim()])
  const row = rows[0]
  if (!row || !(await verificaSenha(senha, row.senha_hash, row.senha_salt))) {
    throw new Error('E-mail ou senha inválidos.')
  }
  if (!row.ativo) throw new Error('Esta conta está desativada. Fale com o administrador.')
  sessionStorage.setItem(SESSION_KEY, String(row.id))
  return toUsuario(row)
}

export async function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export async function currentUser(): Promise<Usuario | null> {
  const id = sessionStorage.getItem(SESSION_KEY)
  if (!id) return null
  const row = all<any>(`SELECT * FROM usuarios WHERE id=?`, [Number(id)])[0]
  if (!row || !row.ativo) return null
  return toUsuario(row)
}

export async function createUsuario(input: { nome: string; email: string; senha: string; papel: Papel }): Promise<Usuario> {
  const nome = input.nome.trim()
  const email = input.email.trim().toLowerCase()
  if (!nome) throw new Error('Informe o nome.')
  if (!email || !email.includes('@')) throw new Error('Informe um e-mail válido.')
  if (!input.senha || input.senha.length < SENHA_MIN_LEN) {
    throw new Error(`A senha precisa ter pelo menos ${SENHA_MIN_LEN} caracteres.`)
  }
  const existe = all<{ id: number }>(`SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)`, [email])
  if (existe.length) throw new Error(`Já existe um usuário com o e-mail "${email}".`)

  const { hash, salt } = await hashSenha(input.senha)
  run(`INSERT INTO usuarios (nome, email, senha_hash, senha_salt, papel) VALUES (?,?,?,?,?)`, [
    nome,
    email,
    hash,
    salt,
    input.papel
  ])
  await persist()
  return listUsuarios().find((u) => u.email === email)!
}

function countGerenciadoresAtivos(excludeId?: number): number {
  const rows = excludeId
    ? all<{ c: number }>(`SELECT COUNT(*) as c FROM usuarios WHERE papel='gerenciar' AND ativo=1 AND id != ?`, [excludeId])
    : all<{ c: number }>(`SELECT COUNT(*) as c FROM usuarios WHERE papel='gerenciar' AND ativo=1`)
  return rows[0]?.c ?? 0
}

export async function updateUsuario(id: number, input: { nome: string; papel: Papel; ativo: boolean }) {
  const nome = input.nome.trim()
  if (!nome) throw new Error('Informe o nome.')
  const atual = all<any>(`SELECT * FROM usuarios WHERE id=?`, [id])[0]
  if (!atual) throw new Error('Usuário não encontrado.')

  const eraGerenciadorAtivo = atual.papel === 'gerenciar' && Boolean(atual.ativo)
  const continuaGerenciadorAtivo = input.papel === 'gerenciar' && input.ativo
  if (eraGerenciadorAtivo && !continuaGerenciadorAtivo && countGerenciadoresAtivos(id) === 0) {
    throw new Error('Não é possível remover o último usuário com papel "Gerenciar tudo".')
  }

  run(`UPDATE usuarios SET nome=?, papel=?, ativo=? WHERE id=?`, [nome, input.papel, input.ativo ? 1 : 0, id])
  await persist()
}

export async function resetSenha(id: number, novaSenha: string) {
  if (!novaSenha || novaSenha.length < SENHA_MIN_LEN) {
    throw new Error(`A senha precisa ter pelo menos ${SENHA_MIN_LEN} caracteres.`)
  }
  const existe = all<{ id: number }>(`SELECT id FROM usuarios WHERE id=?`, [id])
  if (!existe.length) throw new Error('Usuário não encontrado.')
  const { hash, salt } = await hashSenha(novaSenha)
  run(`UPDATE usuarios SET senha_hash=?, senha_salt=? WHERE id=?`, [hash, salt, id])
  await persist()
}

export async function changePassword(id: number, senhaAtual: string, novaSenha: string) {
  const row = all<any>(`SELECT * FROM usuarios WHERE id=?`, [id])[0]
  if (!row) throw new Error('Usuário não encontrado.')
  if (!(await verificaSenha(senhaAtual, row.senha_hash, row.senha_salt))) throw new Error('Senha atual incorreta.')
  if (!novaSenha || novaSenha.length < SENHA_MIN_LEN) {
    throw new Error(`A nova senha precisa ter pelo menos ${SENHA_MIN_LEN} caracteres.`)
  }
  const { hash, salt } = await hashSenha(novaSenha)
  run(`UPDATE usuarios SET senha_hash=?, senha_salt=? WHERE id=?`, [hash, salt, id])
  await persist()
}

export function hasUsuarios(): boolean {
  return (all<{ c: number }>(`SELECT COUNT(*) as c FROM usuarios`)[0]?.c ?? 0) > 0
}

// ---------- Seed (dados de demonstração) ----------

export async function criarUsuarioSeed(input: { nome: string; email: string; senha: string; papel: Papel; ativo?: boolean }) {
  const { hash, salt } = await hashSenha(input.senha)
  run(`INSERT INTO usuarios (nome, email, senha_hash, senha_salt, papel, ativo) VALUES (?,?,?,?,?,?)`, [
    input.nome.trim(),
    input.email.trim().toLowerCase(),
    hash,
    salt,
    input.papel,
    input.ativo === false ? 0 : 1
  ])
}

export function inserirEquipamentoSeed(row: {
  nome: string
  categoria: string | null
  unidade: string
  estoque_atual: number
  estoque_minimo: number
  sede: Sede
}): number {
  run(
    `INSERT INTO equipamentos (nome, categoria, unidade, estoque_atual, estoque_minimo, sede) VALUES (?,?,?,?,?,?)`,
    [row.nome, row.categoria, row.unidade, row.estoque_atual, row.estoque_minimo, row.sede]
  )
  return all<{ id: number }>(`SELECT last_insert_rowid() as id`)[0].id
}

export function inserirMovimentacaoSeed(row: {
  equipamento_id: number
  tipo: 'saida' | 'entrada'
  quantidade: number
  chamado: string | null
  colaborador: string | null
  operador: string | null
  observacao: string | null
  data: string
}) {
  run(
    `INSERT INTO movimentacoes (equipamento_id, tipo, quantidade, chamado, colaborador, operador, observacao, data) VALUES (?,?,?,?,?,?,?,?)`,
    [row.equipamento_id, row.tipo, row.quantidade, row.chamado, row.colaborador, row.operador, row.observacao, row.data]
  )
}

export async function persistirSeed() {
  await persist()
}
