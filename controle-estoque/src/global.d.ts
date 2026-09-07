/// <reference types="vite/client" />

type Sede = 'campinas' | 'sao_paulo'
type Papel = 'visualizar' | 'editar' | 'gerenciar'

interface Usuario {
  id: number
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  criado_em: string
}

interface Equipamento {
  id: number
  nome: string
  categoria: string | null
  unidade: string
  estoque_atual: number
  estoque_minimo: number
  criado_em: string
  sede: Sede
  status: 'ok' | 'baixo' | 'critico'
}

type EquipamentoComStatus = Equipamento

interface Movimentacao {
  id: number
  equipamento_id: number
  equipamento_nome?: string
  equipamento_sede?: Sede
  tipo: 'saida' | 'entrada'
  quantidade: number
  chamado: string | null
  colaborador: string | null
  operador: string | null
  observacao: string | null
  data: string
  cancelada: boolean
  cancelada_em: string | null
  cancelada_motivo: string | null
}

interface DashboardStats {
  totalEquipamentos: number
  itensAbaixoMinimo: number
  retiradasNoPeriodo: number
  chamadosNoPeriodo: number
  periodo: { inicio: string; fim: string }
  estoquePorEquipamento: { nome: string; atual: number; minimo: number }[]
  movimentacoesPorDia: { dia: string; saidas: number; entradas: number }[]
  alertas: EquipamentoComStatus[]
}

interface ImportResult {
  criados: number
  ignorados: number
  detalhesIgnorados: string[]
}

interface MovimentacaoBatchInput {
  tipo: 'saida' | 'entrada'
  chamado: string | null
  colaborador: string | null
  observacao: string | null
  itens: { equipamento_id: number; quantidade: number }[]
}

interface ReportPayload {
  titulo: string
  periodoLabel: string
  sedeLabel: string
  geradoEm: string
  kpis: { label: string; value: string }[]
  estoque: { nome: string; atual: number; minimo: number }[]
  alertas: { nome: string; status: string; atual: number; minimo: number }[]
  movimentacoes: { dia: string; saidas: number; entradas: number }[]
}

interface Window {
  api: {
    auth: {
      hasUsuarios: () => Promise<boolean>
      currentUser: () => Promise<Usuario | null>
      login: (email: string, senha: string) => Promise<Usuario>
      logout: () => Promise<void>
      changePassword: (senhaAtual: string, novaSenha: string) => Promise<void>
    }
    usuarios: {
      list: () => Promise<Usuario[]>
      create: (input: { nome: string; email: string; senha: string; papel: Papel }) => Promise<Usuario>
      update: (id: number, input: { nome: string; papel: Papel; ativo: boolean }) => Promise<void>
      resetSenha: (id: number, novaSenha: string) => Promise<void>
    }
    config: {
      getLimiarBaixo: () => Promise<number>
      setLimiarBaixo: (valor: number) => Promise<void>
    }
    equipamentos: {
      list: (sede?: Sede) => Promise<EquipamentoComStatus[]>
      create: (input: Omit<Equipamento, 'id' | 'criado_em' | 'status'>) => Promise<void>
      update: (id: number, input: Omit<Equipamento, 'id' | 'criado_em' | 'status'>) => Promise<void>
      delete: (id: number) => Promise<void>
      import: (file: File, sede: Sede) => Promise<ImportResult>
    }
    movimentacoes: {
      list: (filters?: Record<string, unknown>) => Promise<Movimentacao[]>
      createBatch: (input: MovimentacaoBatchInput) => Promise<void>
      cancel: (id: number, motivo: string | null) => Promise<void>
    }
    dashboard: {
      stats: (periodo?: { dataInicio: string; dataFim: string }, sede?: Sede) => Promise<DashboardStats>
    }
    exportFile: {
      save: (defaultName: string, data: Uint8Array) => Promise<void>
    }
    report: {
      exportPdf: (payload: ReportPayload) => Promise<void>
    }
    demo: {
      resetar: () => Promise<void>
      credenciais: () => { email: string; senha: string }
    }
  }
}
