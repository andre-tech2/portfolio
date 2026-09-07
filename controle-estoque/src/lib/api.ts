import * as store from './store'
import { popularDadosDemo, DEMO_ADMIN_EMAIL, DEMO_SENHA } from './seed'
import { importEquipamentosFile } from './xlsxImport'
import { abrirRelatorioParaImpressao } from './printReport'

export async function initApi(): Promise<void> {
  const { isNovo } = await store.initEngine()
  if (isNovo) await popularDadosDemo()

  window.api = {
    auth: {
      hasUsuarios: () => Promise.resolve(store.hasUsuarios()),
      currentUser: () => store.currentUser(),
      login: (email, senha) => store.login(email, senha),
      logout: () => store.logout(),
      changePassword: async (senhaAtual, novaSenha) => {
        const usuario = await store.currentUser()
        if (!usuario) throw new Error('Faça login para continuar.')
        await store.changePassword(usuario.id, senhaAtual, novaSenha)
      }
    },
    usuarios: {
      list: async () => store.listUsuarios(),
      create: (input) => store.createUsuario(input),
      update: (id, input) => store.updateUsuario(id, input),
      resetSenha: (id, novaSenha) => store.resetSenha(id, novaSenha)
    },
    config: {
      getLimiarBaixo: async () => store.getLimiarBaixoPercentual(),
      setLimiarBaixo: (valor) => store.setLimiarBaixoPercentual(valor)
    },
    equipamentos: {
      list: async (sede) => store.listEquipamentos(sede),
      create: (input) => store.createEquipamento(input),
      update: (id, input) => store.updateEquipamento(id, input),
      delete: (id) => store.deleteEquipamento(id),
      import: (file, sede) => importEquipamentosFile(file, sede)
    },
    movimentacoes: {
      list: async (filters) => store.listMovimentacoes(filters),
      createBatch: async (input) => {
        const usuario = await store.currentUser()
        if (!usuario) throw new Error('Faça login para continuar.')
        await store.createMovimentacoesBatch({ ...input, operador: usuario.nome })
      },
      cancel: (id, motivo) => store.cancelarMovimentacao(id, motivo)
    },
    dashboard: {
      stats: async (periodo, sede) => store.getDashboardStats(periodo, sede)
    },
    exportFile: {
      save: async (defaultName, data) => {
        const blob = new Blob([data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = defaultName
        a.click()
        URL.revokeObjectURL(url)
      }
    },
    report: {
      exportPdf: async (payload) => abrirRelatorioParaImpressao(payload)
    },
    demo: {
      resetar: () => store.resetarTudo().then(() => popularDadosDemo()),
      credenciais: () => ({ email: DEMO_ADMIN_EMAIL, senha: DEMO_SENHA })
    }
  }
}
