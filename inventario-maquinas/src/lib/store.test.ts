import { describe, it, expect, beforeEach } from 'vitest'
import * as store from './store'

beforeEach(async () => {
  await store.resetarTudo()
})

describe('usuários / autenticação', () => {
  it('cria um usuário e autentica com a senha correta', async () => {
    await store.createUsuario({ nome: 'Ana', email: 'ana@novatech.com', senha: '12345678901', papel: 'gerenciar' })
    const usuario = await store.login('ana@novatech.com', '12345678901')
    expect(usuario.email).toBe('ana@novatech.com')
    expect(usuario.papel).toBe('gerenciar')
  })

  it('rejeita login com senha errada', async () => {
    await store.createUsuario({ nome: 'Ana', email: 'ana@novatech.com', senha: '12345678901', papel: 'gerenciar' })
    await expect(store.login('ana@novatech.com', 'senha-errada-1')).rejects.toThrow(/inválidos/)
  })

  it('exige senha com pelo menos 10 caracteres', async () => {
    await expect(
      store.createUsuario({ nome: 'Ana', email: 'ana@novatech.com', senha: '123', papel: 'editar' })
    ).rejects.toThrow(/10 caracteres/)
  })

  it('não permite dois usuários com o mesmo e-mail', async () => {
    await store.createUsuario({ nome: 'Ana', email: 'ana@novatech.com', senha: '12345678901', papel: 'editar' })
    await expect(
      store.createUsuario({ nome: 'Outra Ana', email: 'ANA@novatech.com', senha: '12345678901', papel: 'editar' })
    ).rejects.toThrow(/Já existe/)
  })

  it('não deixa rebaixar o último usuário "gerenciar tudo"', async () => {
    const admin = await store.createUsuario({
      nome: 'Admin',
      email: 'admin@novatech.com',
      senha: '12345678901',
      papel: 'gerenciar'
    })
    await expect(store.updateUsuario(admin.id, { nome: admin.nome, papel: 'editar', ativo: true })).rejects.toThrow(
      /último usuário/
    )
  })
})

describe('máquinas novas', () => {
  it('cadastra e lista uma máquina nova', async () => {
    await store.createMaquinaNova({
      patrimonio: 'NT-1',
      modelo: 'Dell Latitude',
      data_entrada: '2026-01-01',
      estado: 'entrada',
      localizacao: 'TI',
      nota: null
    })
    const lista = store.listMaquinasNovas()
    expect(lista).toHaveLength(1)
    expect(lista[0].patrimonio).toBe('NT-1')
  })

  it('impede patrimônio duplicado (sem diferenciar maiúsculas/minúsculas)', async () => {
    await store.createMaquinaNova({
      patrimonio: 'NT-1',
      modelo: null,
      data_entrada: '2026-01-01',
      estado: 'entrada',
      localizacao: null,
      nota: null
    })
    await expect(
      store.createMaquinaNova({
        patrimonio: 'nt-1',
        modelo: null,
        data_entrada: '2026-01-01',
        estado: 'entrada',
        localizacao: null,
        nota: null
      })
    ).rejects.toThrow(/Já existe/)
  })

  it('registra a remoção com motivo e analista ao excluir', async () => {
    await store.createMaquinaNova({
      patrimonio: 'NT-1',
      modelo: null,
      data_entrada: '2026-01-01',
      estado: 'entrada',
      localizacao: null,
      nota: null
    })
    const [maquina] = store.listMaquinasNovas()
    await store.deleteMaquinaNova(maquina.id, 'Cadastro duplicado', 'Ana')

    expect(store.listMaquinasNovas()).toHaveLength(0)
    const remocoes = store.listRemocoes()
    expect(remocoes).toHaveLength(1)
    expect(remocoes[0]).toMatchObject({ patrimonio: 'NT-1', motivo: 'Cadastro duplicado', analista: 'Ana' })
  })

  it('exige motivo para excluir', async () => {
    await store.createMaquinaNova({
      patrimonio: 'NT-1',
      modelo: null,
      data_entrada: '2026-01-01',
      estado: 'entrada',
      localizacao: null,
      nota: null
    })
    const [maquina] = store.listMaquinasNovas()
    await expect(store.deleteMaquinaNova(maquina.id, '  ', 'Ana')).rejects.toThrow(/motivo/)
  })
})

describe('mover para máquinas antigas', () => {
  it('move uma máquina nova para "em atuação"', async () => {
    await store.createMaquinaNova({
      patrimonio: 'NT-2',
      modelo: 'HP',
      data_entrada: '2020-01-01',
      estado: 'entrada',
      localizacao: 'RH',
      nota: null
    })
    const [maquina] = store.listMaquinasNovas()
    const antiga = await store.moverParaAntigas(maquina.id, 'em_atuacao')

    expect(antiga.estado).toBe('em_atuacao')
    expect(store.listMaquinasNovas()).toHaveLength(0)
    expect(store.listMaquinasAntigas()).toHaveLength(1)
  })

  it('exige data da venda e comprador ao mover para "venda"', async () => {
    await store.createMaquinaNova({
      patrimonio: 'NT-3',
      modelo: null,
      data_entrada: '2020-01-01',
      estado: 'entrada',
      localizacao: null,
      nota: null
    })
    const [maquina] = store.listMaquinasNovas()
    await expect(store.moverParaAntigas(maquina.id, 'venda')).rejects.toThrow(/data da venda/)
  })
})

describe('importação (upsert por patrimônio)', () => {
  it('cria na primeira importação e atualiza na segunda', async () => {
    const row = {
      patrimonio: 'NT-9',
      modelo: 'Dell',
      data_entrada: '2026-01-01',
      estado: 'entrada',
      condicao: null,
      localizacao: 'TI',
      nota: null
    }
    const primeiro = await store.upsertMaquinasNovas([row])
    expect(primeiro).toEqual({ criadas: 1, atualizadas: 0 })

    const segundo = await store.upsertMaquinasNovas([{ ...row, localizacao: 'Financeiro' }])
    expect(segundo).toEqual({ criadas: 0, atualizadas: 1 })
    expect(store.listMaquinasNovas()).toHaveLength(1)
    expect(store.listMaquinasNovas()[0].localizacao).toBe('Financeiro')
  })
})
