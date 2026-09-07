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

describe('equipamentos', () => {
  it('cadastra e lista um equipamento', async () => {
    await store.createEquipamento({
      nome: 'Notebook Dell',
      categoria: 'Informática',
      unidade: 'un',
      estoque_atual: 10,
      estoque_minimo: 3,
      sede: 'campinas'
    })
    const lista = store.listEquipamentos('campinas')
    expect(lista).toHaveLength(1)
    expect(lista[0].status).toBe('ok')
  })

  it('permite o mesmo nome em sedes diferentes, mas não na mesma sede', async () => {
    await store.createEquipamento({
      nome: 'Monitor',
      categoria: null,
      unidade: 'un',
      estoque_atual: 5,
      estoque_minimo: 2,
      sede: 'campinas'
    })
    await expect(
      store.createEquipamento({
        nome: 'Monitor',
        categoria: null,
        unidade: 'un',
        estoque_atual: 5,
        estoque_minimo: 2,
        sede: 'campinas'
      })
    ).rejects.toThrow(/Já existe/)

    await expect(
      store.createEquipamento({
        nome: 'Monitor',
        categoria: null,
        unidade: 'un',
        estoque_atual: 5,
        estoque_minimo: 2,
        sede: 'sao_paulo'
      })
    ).resolves.toBeUndefined()
  })

  it('calcula o status crítico quando o estoque está no mínimo ou abaixo', async () => {
    await store.createEquipamento({
      nome: 'Cabo HDMI',
      categoria: null,
      unidade: 'un',
      estoque_atual: 2,
      estoque_minimo: 5,
      sede: 'campinas'
    })
    const [eq] = store.listEquipamentos('campinas')
    expect(eq.status).toBe('critico')
  })
})

describe('movimentações', () => {
  async function criarEquipamento(estoqueInicial = 10) {
    await store.createEquipamento({
      nome: 'Mouse',
      categoria: null,
      unidade: 'un',
      estoque_atual: estoqueInicial,
      estoque_minimo: 3,
      sede: 'campinas'
    })
    return store.listEquipamentos('campinas')[0].id
  }

  it('saída reduz o estoque e fica registrada', async () => {
    const id = await criarEquipamento(10)
    await store.createMovimentacoesBatch({
      tipo: 'saida',
      chamado: 'CH-1',
      colaborador: 'Marina',
      operador: 'Ana',
      observacao: null,
      itens: [{ equipamento_id: id, quantidade: 4 }]
    })
    expect(store.listEquipamentos('campinas')[0].estoque_atual).toBe(6)
    expect(store.listMovimentacoes()).toHaveLength(1)
  })

  it('rejeita saída maior que o estoque disponível, sem aplicar nada', async () => {
    const id = await criarEquipamento(5)
    await expect(
      store.createMovimentacoesBatch({
        tipo: 'saida',
        chamado: 'CH-2',
        colaborador: 'Marina',
        operador: 'Ana',
        observacao: null,
        itens: [{ equipamento_id: id, quantidade: 99 }]
      })
    ).rejects.toThrow(/insuficiente/)
    expect(store.listEquipamentos('campinas')[0].estoque_atual).toBe(5)
    expect(store.listMovimentacoes()).toHaveLength(0)
  })

  it('cancelar uma movimentação reverte o efeito no estoque', async () => {
    const id = await criarEquipamento(10)
    await store.createMovimentacoesBatch({
      tipo: 'saida',
      chamado: 'CH-3',
      colaborador: 'Marina',
      operador: 'Ana',
      observacao: null,
      itens: [{ equipamento_id: id, quantidade: 4 }]
    })
    const [mov] = store.listMovimentacoes()
    await store.cancelarMovimentacao(mov.id, 'Registrado por engano')
    expect(store.listEquipamentos('campinas')[0].estoque_atual).toBe(10)
    expect(store.listMovimentacoes()[0].cancelada).toBe(true)
  })

  it('exige motivo para cancelar', async () => {
    const id = await criarEquipamento(10)
    await store.createMovimentacoesBatch({
      tipo: 'entrada',
      chamado: null,
      colaborador: 'Marina',
      operador: 'Ana',
      observacao: null,
      itens: [{ equipamento_id: id, quantidade: 2 }]
    })
    const [mov] = store.listMovimentacoes()
    await expect(store.cancelarMovimentacao(mov.id, '  ')).rejects.toThrow(/motivo/)
  })
})

describe('limiar de alerta', () => {
  it('rejeita valores menores ou iguais a 100', async () => {
    await expect(store.setLimiarBaixoPercentual(100)).rejects.toThrow(/maior que 100/)
  })

  it('salva e reflete no status "baixo"', async () => {
    await store.setLimiarBaixoPercentual(150)
    expect(store.getLimiarBaixoPercentual()).toBe(150)

    await store.createEquipamento({
      nome: 'Teclado',
      categoria: null,
      unidade: 'un',
      estoque_atual: 7,
      estoque_minimo: 5,
      sede: 'campinas'
    })
    // 7 <= 5 * 1.5 (7.5) => baixo
    expect(store.listEquipamentos('campinas')[0].status).toBe('baixo')
  })
})
