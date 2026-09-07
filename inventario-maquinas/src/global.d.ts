/// <reference types="vite/client" />

type EstadoNova = 'entrada' | 'saida'
type EstadoAntiga = 'em_atuacao' | 'parada' | 'venda'

interface MaquinaNova {
  id: number
  patrimonio: string
  modelo: string | null
  data_entrada: string
  estado: EstadoNova
  localizacao: string | null
  nota: string | null
  criado_em: string
}

interface MaquinaAntiga {
  id: number
  patrimonio: string
  modelo: string | null
  data_entrada: string
  estado: EstadoAntiga
  condicao: string | null
  data_venda: string | null
  comprador: string | null
  localizacao: string | null
  nota: string | null
  criado_em: string
}

interface MaquinaInput {
  patrimonio: string
  modelo: string | null
  data_entrada: string
  estado: EstadoNova | EstadoAntiga
  condicao?: string | null
  data_venda?: string | null
  comprador?: string | null
  localizacao: string | null
  nota: string | null
}

interface VendaInfo {
  data_venda: string | null
  comprador: string | null
}

type Papel = 'visualizar' | 'editar' | 'gerenciar'

interface Usuario {
  id: number
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  criado_em: string
}

interface ImportReport {
  novasCriadas: number
  novasAtualizadas: number
  antigasCriadas: number
  antigasAtualizadas: number
  ignoradas: number
  detalhesIgnorados: string[]
}

interface SyncResult {
  warning: string | null
}

interface MoverResult {
  maquina: MaquinaAntiga
  warning: string | null
}

interface Remocao {
  id: number
  tabela: 'novas' | 'antigas'
  patrimonio: string
  modelo: string | null
  estado: string
  motivo: string
  analista: string
  removido_em: string
}

interface Window {
  api: {
    auth: {
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
    maquinasNovas: {
      list: (estado?: string) => Promise<MaquinaNova[]>
      create: (input: MaquinaInput) => Promise<SyncResult>
      update: (id: number, input: MaquinaInput) => Promise<SyncResult>
      delete: (id: number, motivo: string, analista: string) => Promise<SyncResult>
      moverParaAntigas: (id: number, estadoDestino: EstadoAntiga, vendaInfo?: VendaInfo) => Promise<MoverResult>
    }
    maquinasAntigas: {
      list: (estado?: string) => Promise<MaquinaAntiga[]>
      create: (input: MaquinaInput) => Promise<SyncResult>
      update: (id: number, input: MaquinaInput) => Promise<SyncResult>
      delete: (id: number, motivo: string, analista: string) => Promise<SyncResult>
    }
    remocoes: {
      list: () => Promise<Remocao[]>
    }
    opcoes: {
      localizacoes: () => Promise<string[]>
      condicoes: () => Promise<string[]>
      modelos: () => Promise<string[]>
    }
    planilha: {
      importar: (file: File, tabela: 'novas' | 'antigas') => Promise<ImportReport>
      exportar: (tabela: 'novas' | 'antigas') => Promise<void>
    }
    demo: {
      resetar: () => Promise<void>
      credenciais: () => { email: string; senha: string }
    }
  }
}
