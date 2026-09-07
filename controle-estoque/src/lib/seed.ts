import { criarUsuarioSeed, inserirEquipamentoSeed, inserirMovimentacaoSeed, persistirSeed } from './store'

export const DEMO_ADMIN_EMAIL = 'admin@novatech.com'
export const DEMO_SENHA = 'novatech@123'

type ItemDef = { nome: string; categoria: string; minimo: number }

const ITENS: ItemDef[] = [
  { nome: 'Notebook Dell Latitude 5440', categoria: 'Informática', minimo: 5 },
  { nome: 'Monitor LG 24"', categoria: 'Informática', minimo: 8 },
  { nome: 'HD externo 1TB', categoria: 'Informática', minimo: 6 },
  { nome: 'Pen drive 32GB', categoria: 'Informática', minimo: 15 },
  { nome: 'Adaptador USB-C', categoria: 'Informática', minimo: 10 },
  { nome: 'Nobreak 1200VA', categoria: 'Informática', minimo: 4 },
  { nome: 'Mouse sem fio', categoria: 'Periféricos', minimo: 12 },
  { nome: 'Teclado ABNT2', categoria: 'Periféricos', minimo: 10 },
  { nome: 'Headset USB', categoria: 'Periféricos', minimo: 8 },
  { nome: 'Webcam Full HD', categoria: 'Periféricos', minimo: 6 },
  { nome: 'Suporte de monitor', categoria: 'Periféricos', minimo: 5 },
  { nome: 'Roteador Wi-Fi', categoria: 'Rede', minimo: 3 },
  { nome: 'Switch 24 portas', categoria: 'Rede', minimo: 2 },
  { nome: 'Cabo de rede Cat6 (un.)', categoria: 'Rede', minimo: 20 },
  { nome: 'Ramal IP', categoria: 'Telefonia', minimo: 4 },
  { nome: 'Headset telefonia', categoria: 'Telefonia', minimo: 5 },
  { nome: 'Cadeira ergonômica', categoria: 'Mobiliário', minimo: 3 },
  { nome: 'Mesa ajustável', categoria: 'Mobiliário', minimo: 2 },
  { nome: 'Cabo HDMI', categoria: 'Outros', minimo: 15 },
  { nome: 'Carregador notebook', categoria: 'Outros', minimo: 8 }
]

const COLABORADORES = [
  'Marina Oliveira', 'Paulo Santos', 'Juliana Pereira', 'Bruno Costa', 'Larissa Almeida',
  'Felipe Ribeiro', 'Tatiane Carvalho', 'Gustavo Gomes', 'Renata Barbosa', 'Vinícius Rocha'
]

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86400000)
}

function toSqlDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

let chamadoCounter = 10230

export async function popularDadosDemo() {
  await criarUsuarioSeed({ nome: 'Administrador NovaTech', email: DEMO_ADMIN_EMAIL, senha: DEMO_SENHA, papel: 'gerenciar' })
  await criarUsuarioSeed({ nome: 'Camila Ferreira (Editora)', email: 'editor@novatech.com', senha: DEMO_SENHA, papel: 'editar' })
  await criarUsuarioSeed({ nome: 'Rodrigo Lima (Visualização)', email: 'visualizador@novatech.com', senha: DEMO_SENHA, papel: 'visualizar' })

  const operadores = ['Administrador NovaTech', 'Camila Ferreira (Editora)']
  const now = new Date()

  const sedes: Sede[] = ['campinas', 'sao_paulo']
  for (const sede of sedes) {
    ITENS.forEach((item, idx) => {
      // Distribui deliberadamente alguns itens em cada status pra Visão Geral e Crítico terem o que mostrar.
      const roll = (idx + (sede === 'sao_paulo' ? 3 : 0)) % 7
      let estoqueAtual: number
      if (roll === 0) estoqueAtual = Math.max(0, item.minimo - randInt(0, 2)) // crítico
      else if (roll === 1 || roll === 2) estoqueAtual = item.minimo + randInt(0, Math.ceil(item.minimo * 0.2)) // baixo
      else estoqueAtual = item.minimo + randInt(Math.ceil(item.minimo * 0.5), item.minimo * 2) // ok

      const equipamentoId = inserirEquipamentoSeed({
        nome: item.nome,
        categoria: item.categoria,
        unidade: 'un',
        estoque_atual: estoqueAtual,
        estoque_minimo: item.minimo,
        sede
      })

      // Histórico de movimentações dos últimos ~75 dias, só pra alimentar os gráficos e KPIs.
      const numMovs = randInt(3, 8)
      for (let i = 0; i < numMovs; i++) {
        const diasAtras = randInt(0, 75)
        const data = addDays(now, -diasAtras)
        const tipo: 'saida' | 'entrada' = Math.random() < 0.75 ? 'saida' : 'entrada'
        chamadoCounter += 1
        inserirMovimentacaoSeed({
          equipamento_id: equipamentoId,
          tipo,
          quantidade: randInt(1, 3),
          chamado: tipo === 'saida' ? `CH-${chamadoCounter}` : null,
          colaborador: tipo === 'saida' ? pick(COLABORADORES) : null,
          operador: pick(operadores),
          observacao: null,
          data: toSqlDateTime(data)
        })
      }
    })
  }

  await persistirSeed()
}
