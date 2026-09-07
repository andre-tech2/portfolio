import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { loadBlob, saveBlob, clearBlob } from './idb'
import { hashSenha, verificaSenha } from './crypto'

const ESTADOS_NOVAS: EstadoNova[] = ['entrada', 'saida']
const ESTADOS_ANTIGAS: EstadoAntiga[] = ['em_atuacao', 'parada', 'venda']
const SENHA_MIN_LEN = 10
const SESSION_KEY = 'novatech-sessao-usuario-id'

let SQL: SqlJsStatic | null = null
let db: Database | null = null

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
    CREATE TABLE IF NOT EXISTS maquinas_novas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patrimonio TEXT NOT NULL,
      modelo TEXT,
      data_entrada TEXT NOT NULL,
      estado TEXT NOT NULL CHECK(estado IN ('entrada','saida')),
      localizacao TEXT,
      nota TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS maquinas_antigas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patrimonio TEXT NOT NULL,
      modelo TEXT,
      data_entrada TEXT NOT NULL,
      estado TEXT NOT NULL CHECK(estado IN ('em_atuacao','parada','venda')),
      condicao TEXT,
      data_venda TEXT,
      comprador TEXT,
      localizacao TEXT,
      nota TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS remocoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tabela TEXT NOT NULL CHECK(tabela IN ('novas','antigas')),
      patrimonio TEXT NOT NULL,
      modelo TEXT,
      estado TEXT,
      motivo TEXT NOT NULL,
      analista TEXT NOT NULL,
      removido_em TEXT NOT NULL DEFAULT (datetime('now'))
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

function validateInput(input: MaquinaInput, estadosValidos: readonly string[]): string {
  const patrimonio = input.patrimonio.trim()
  if (!patrimonio) throw new Error('Informe o patrimônio.')
  if (!input.data_entrada) throw new Error('Informe a data de entrada.')
  if (!estadosValidos.includes(input.estado)) {
    throw new Error(`Estado inválido: ${input.estado}`)
  }
  if (input.estado === 'venda') {
    if (!input.data_venda) throw new Error('Informe a data da venda.')
    if (!input.comprador || !input.comprador.trim()) throw new Error('Informe o comprador.')
  }
  return patrimonio
}

function patrimonioExists(tabela: 'maquinas_novas' | 'maquinas_antigas', patrimonio: string, excludeId?: number): boolean {
  const rows = excludeId
    ? all<{ id: number }>(`SELECT id FROM ${tabela} WHERE LOWER(patrimonio) = LOWER(?) AND id != ?`, [
        patrimonio,
        excludeId
      ])
    : all<{ id: number }>(`SELECT id FROM ${tabela} WHERE LOWER(patrimonio) = LOWER(?)`, [patrimonio])
  return rows.length > 0
}

// ---------- Máquinas Novas ----------

export function listMaquinasNovas(estado?: string): MaquinaNova[] {
  const where = estado ? `WHERE estado = ?` : ''
  const params = estado ? [estado] : []
  return all<MaquinaNova>(`SELECT * FROM maquinas_novas ${where} ORDER BY data_entrada DESC, patrimonio ASC`, params)
}

export async function createMaquinaNova(input: MaquinaInput) {
  const patrimonio = validateInput(input, ESTADOS_NOVAS)
  if (patrimonioExists('maquinas_novas', patrimonio)) {
    throw new Error(`Já existe uma máquina nova com o patrimônio "${patrimonio}".`)
  }
  run(
    `INSERT INTO maquinas_novas (patrimonio, modelo, data_entrada, estado, localizacao, nota) VALUES (?,?,?,?,?,?)`,
    [patrimonio, input.modelo, input.data_entrada, input.estado, input.localizacao, input.nota]
  )
  await persist()
}

export async function updateMaquinaNova(id: number, input: MaquinaInput) {
  const patrimonio = validateInput(input, ESTADOS_NOVAS)
  if (patrimonioExists('maquinas_novas', patrimonio, id)) {
    throw new Error(`Já existe uma máquina nova com o patrimônio "${patrimonio}".`)
  }
  run(`UPDATE maquinas_novas SET patrimonio=?, modelo=?, data_entrada=?, estado=?, localizacao=?, nota=? WHERE id=?`, [
    patrimonio,
    input.modelo,
    input.data_entrada,
    input.estado,
    input.localizacao,
    input.nota,
    id
  ])
  await persist()
}

export async function deleteMaquinaNova(id: number, motivo: string, analista: string): Promise<string> {
  const patrimonio = registrarRemocao('novas', 'maquinas_novas', id, motivo, analista)
  run(`DELETE FROM maquinas_novas WHERE id=?`, [id])
  await persist()
  return patrimonio
}

// ---------- Máquinas Antigas ----------

export function listMaquinasAntigas(estado?: string): MaquinaAntiga[] {
  const where = estado ? `WHERE estado = ?` : ''
  const params = estado ? [estado] : []
  return all<MaquinaAntiga>(`SELECT * FROM maquinas_antigas ${where} ORDER BY data_entrada DESC, patrimonio ASC`, params)
}

export async function createMaquinaAntiga(input: MaquinaInput) {
  const patrimonio = validateInput(input, ESTADOS_ANTIGAS)
  if (patrimonioExists('maquinas_antigas', patrimonio)) {
    throw new Error(`Já existe uma máquina antiga com o patrimônio "${patrimonio}".`)
  }
  run(
    `INSERT INTO maquinas_antigas (patrimonio, modelo, data_entrada, estado, condicao, data_venda, comprador, localizacao, nota) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      patrimonio,
      input.modelo,
      input.data_entrada,
      input.estado,
      input.condicao ?? null,
      input.estado === 'venda' ? input.data_venda ?? null : null,
      input.estado === 'venda' ? input.comprador ?? null : null,
      input.localizacao,
      input.nota
    ]
  )
  await persist()
}

export async function updateMaquinaAntiga(id: number, input: MaquinaInput) {
  const patrimonio = validateInput(input, ESTADOS_ANTIGAS)
  if (patrimonioExists('maquinas_antigas', patrimonio, id)) {
    throw new Error(`Já existe uma máquina antiga com o patrimônio "${patrimonio}".`)
  }
  run(
    `UPDATE maquinas_antigas SET patrimonio=?, modelo=?, data_entrada=?, estado=?, condicao=?, data_venda=?, comprador=?, localizacao=?, nota=? WHERE id=?`,
    [
      patrimonio,
      input.modelo,
      input.data_entrada,
      input.estado,
      input.condicao ?? null,
      input.estado === 'venda' ? input.data_venda ?? null : null,
      input.estado === 'venda' ? input.comprador ?? null : null,
      input.localizacao,
      input.nota,
      id
    ]
  )
  await persist()
}

export async function deleteMaquinaAntiga(id: number, motivo: string, analista: string): Promise<string> {
  const patrimonio = registrarRemocao('antigas', 'maquinas_antigas', id, motivo, analista)
  run(`DELETE FROM maquinas_antigas WHERE id=?`, [id])
  await persist()
  return patrimonio
}

function registrarRemocao(
  tabela: 'novas' | 'antigas',
  tabelaSql: 'maquinas_novas' | 'maquinas_antigas',
  id: number,
  motivo: string,
  analista: string
): string {
  if (!motivo.trim()) throw new Error('Informe o motivo da remoção.')
  if (!analista.trim()) throw new Error('Informe o nome de quem está removendo.')
  const rows = all<{ patrimonio: string; modelo: string | null; estado: string }>(
    `SELECT patrimonio, modelo, estado FROM ${tabelaSql} WHERE id=?`,
    [id]
  )
  const maquina = rows[0]
  if (!maquina) throw new Error('Máquina não encontrada.')
  run(`INSERT INTO remocoes (tabela, patrimonio, modelo, estado, motivo, analista) VALUES (?,?,?,?,?,?)`, [
    tabela,
    maquina.patrimonio,
    maquina.modelo,
    maquina.estado,
    motivo.trim(),
    analista.trim()
  ])
  return maquina.patrimonio
}

export function listRemocoes(): Remocao[] {
  return all<Remocao>(`SELECT * FROM remocoes ORDER BY removido_em DESC`)
}

export async function moverParaAntigas(
  id: number,
  estadoDestino: EstadoAntiga,
  vendaInfo?: { data_venda: string | null; comprador: string | null }
): Promise<MaquinaAntiga> {
  if (!ESTADOS_ANTIGAS.includes(estadoDestino)) throw new Error(`Estado inválido: ${estadoDestino}`)
  if (estadoDestino === 'venda') {
    if (!vendaInfo?.data_venda) throw new Error('Informe a data da venda.')
    if (!vendaInfo?.comprador || !vendaInfo.comprador.trim()) throw new Error('Informe o comprador.')
  }
  const rows = all<MaquinaNova>(`SELECT * FROM maquinas_novas WHERE id=?`, [id])
  const maquina = rows[0]
  if (!maquina) throw new Error('Máquina não encontrada.')
  if (patrimonioExists('maquinas_antigas', maquina.patrimonio)) {
    throw new Error(`Já existe uma máquina antiga com o patrimônio "${maquina.patrimonio}".`)
  }
  const dataVenda = estadoDestino === 'venda' ? vendaInfo!.data_venda : null
  const comprador = estadoDestino === 'venda' ? vendaInfo!.comprador : null
  run(
    `INSERT INTO maquinas_antigas (patrimonio, modelo, data_entrada, estado, condicao, data_venda, comprador, localizacao, nota) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      maquina.patrimonio,
      maquina.modelo,
      maquina.data_entrada,
      estadoDestino,
      null,
      dataVenda,
      comprador,
      maquina.localizacao,
      maquina.nota
    ]
  )
  run(`DELETE FROM maquinas_novas WHERE id=?`, [id])
  await persist()
  const novaId = all<{ id: number }>(`SELECT id FROM maquinas_antigas WHERE LOWER(patrimonio) = LOWER(?)`, [
    maquina.patrimonio
  ])[0].id
  return { ...maquina, id: novaId, estado: estadoDestino, condicao: null, data_venda: dataVenda, comprador }
}

// ---------- Importação (upsert por patrimônio) ----------

export type ImportRow = {
  patrimonio: string
  modelo: string | null
  data_entrada: string
  estado: string
  condicao: string | null
  localizacao: string | null
  nota: string | null
}

function upsertRow(tabela: 'maquinas_novas' | 'maquinas_antigas', row: ImportRow): 'criada' | 'atualizada' {
  const existing = all<{ id: number }>(`SELECT id FROM ${tabela} WHERE LOWER(patrimonio) = LOWER(?)`, [row.patrimonio])
  const comCondicao = tabela === 'maquinas_antigas'

  if (existing.length > 0) {
    if (comCondicao) {
      run(`UPDATE ${tabela} SET modelo=?, data_entrada=?, estado=?, condicao=?, localizacao=?, nota=? WHERE id=?`, [
        row.modelo,
        row.data_entrada,
        row.estado,
        row.condicao,
        row.localizacao,
        row.nota,
        existing[0].id
      ])
    } else {
      run(`UPDATE ${tabela} SET modelo=?, data_entrada=?, estado=?, localizacao=?, nota=? WHERE id=?`, [
        row.modelo,
        row.data_entrada,
        row.estado,
        row.localizacao,
        row.nota,
        existing[0].id
      ])
    }
    return 'atualizada'
  }

  if (comCondicao) {
    run(
      `INSERT INTO ${tabela} (patrimonio, modelo, data_entrada, estado, condicao, localizacao, nota) VALUES (?,?,?,?,?,?,?)`,
      [row.patrimonio, row.modelo, row.data_entrada, row.estado, row.condicao, row.localizacao, row.nota]
    )
  } else {
    run(`INSERT INTO ${tabela} (patrimonio, modelo, data_entrada, estado, localizacao, nota) VALUES (?,?,?,?,?,?)`, [
      row.patrimonio,
      row.modelo,
      row.data_entrada,
      row.estado,
      row.localizacao,
      row.nota
    ])
  }
  return 'criada'
}

export async function upsertMaquinasNovas(rows: ImportRow[]): Promise<{ criadas: number; atualizadas: number }> {
  let criadas = 0
  let atualizadas = 0
  for (const row of rows) {
    if (upsertRow('maquinas_novas', row) === 'criada') criadas++
    else atualizadas++
  }
  await persist()
  return { criadas, atualizadas }
}

export async function upsertMaquinasAntigas(rows: ImportRow[]): Promise<{ criadas: number; atualizadas: number }> {
  let criadas = 0
  let atualizadas = 0
  for (const row of rows) {
    if (upsertRow('maquinas_antigas', row) === 'criada') criadas++
    else atualizadas++
  }
  await persist()
  return { criadas, atualizadas }
}

// ---------- Usuários / autenticação ----------

function toUsuario(row: { id: number; nome: string; email: string; papel: Papel; ativo: number; criado_em: string }): Usuario {
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

export function inserirMaquinaSeed(tabela: 'maquinas_novas' | 'maquinas_antigas', row: Record<string, unknown>) {
  const cols = Object.keys(row)
  run(
    `INSERT INTO ${tabela} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
    cols.map((c) => row[c])
  )
}

export function inserirRemocaoSeed(row: {
  tabela: 'novas' | 'antigas'
  patrimonio: string
  modelo: string | null
  estado: string
  motivo: string
  analista: string
  removido_em: string
}) {
  run(`INSERT INTO remocoes (tabela, patrimonio, modelo, estado, motivo, analista, removido_em) VALUES (?,?,?,?,?,?,?)`, [
    row.tabela,
    row.patrimonio,
    row.modelo,
    row.estado,
    row.motivo,
    row.analista,
    row.removido_em
  ])
}

export async function persistirSeed() {
  await persist()
}

// ---------- Opções sugeridas nos formulários (valores já usados) ----------

function valoresDistintos(sql: string): string[] {
  return all<{ v: string }>(sql)
    .map((r) => r.v)
    .filter((v) => v && v.trim())
}

export function listLocalizacoes(): string[] {
  const valores = new Set([
    ...valoresDistintos(`SELECT DISTINCT localizacao as v FROM maquinas_novas WHERE localizacao IS NOT NULL`),
    ...valoresDistintos(`SELECT DISTINCT localizacao as v FROM maquinas_antigas WHERE localizacao IS NOT NULL`)
  ])
  return [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function listCondicoes(): string[] {
  const valores = new Set(
    valoresDistintos(`SELECT DISTINCT condicao as v FROM maquinas_antigas WHERE condicao IS NOT NULL`)
  )
  return [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function listModelos(): string[] {
  const valores = new Set([
    ...valoresDistintos(`SELECT DISTINCT modelo as v FROM maquinas_novas WHERE modelo IS NOT NULL`),
    ...valoresDistintos(`SELECT DISTINCT modelo as v FROM maquinas_antigas WHERE modelo IS NOT NULL`)
  ])
  return [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function hasUsuarios(): boolean {
  return (all<{ c: number }>(`SELECT COUNT(*) as c FROM usuarios`)[0]?.c ?? 0) > 0
}
