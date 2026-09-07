import * as store from './store'
import { popularDadosDemo, DEMO_ADMIN_EMAIL, DEMO_SENHA } from './seed'
import { exportarXlsx, importarXlsx } from './xlsx'

const semAviso: SyncResult = { warning: null }

export async function initApi(): Promise<void> {
  const { isNovo } = await store.initEngine()
  if (isNovo) await popularDadosDemo()

  window.api = {
    auth: {
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
    maquinasNovas: {
      list: async (estado) => store.listMaquinasNovas(estado),
      create: async (input) => {
        await store.createMaquinaNova(input)
        return semAviso
      },
      update: async (id, input) => {
        await store.updateMaquinaNova(id, input)
        return semAviso
      },
      delete: async (id, motivo, analista) => {
        await store.deleteMaquinaNova(id, motivo, analista)
        return semAviso
      },
      moverParaAntigas: async (id, estadoDestino, vendaInfo) => {
        const maquina = await store.moverParaAntigas(id, estadoDestino, vendaInfo)
        return { maquina, warning: null }
      }
    },
    maquinasAntigas: {
      list: async (estado) => store.listMaquinasAntigas(estado),
      create: async (input) => {
        await store.createMaquinaAntiga(input)
        return semAviso
      },
      update: async (id, input) => {
        await store.updateMaquinaAntiga(id, input)
        return semAviso
      },
      delete: async (id, motivo, analista) => {
        await store.deleteMaquinaAntiga(id, motivo, analista)
        return semAviso
      }
    },
    remocoes: {
      list: async () => store.listRemocoes()
    },
    opcoes: {
      localizacoes: async () => store.listLocalizacoes(),
      condicoes: async () => store.listCondicoes(),
      modelos: async () => store.listModelos()
    },
    planilha: {
      importar: (file, tabela) => importarXlsx(file, tabela),
      exportar: async (tabela) => exportarXlsx(tabela)
    },
    demo: {
      resetar: () => store.resetarTudo().then(() => popularDadosDemo()),
      credenciais: () => ({ email: DEMO_ADMIN_EMAIL, senha: DEMO_SENHA })
    }
  }
}
