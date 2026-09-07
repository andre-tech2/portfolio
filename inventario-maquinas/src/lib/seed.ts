import { criarUsuarioSeed, inserirMaquinaSeed, inserirRemocaoSeed, persistirSeed } from './store'

export const DEMO_ADMIN_EMAIL = 'admin@novatech.com'
export const DEMO_SENHA = 'novatech@123'

const NOVAS: Record<string, unknown>[] = [
  { patrimonio: 'NT-1001', modelo: 'Dell Latitude 5440', data_entrada: '2026-06-02', estado: 'entrada', localizacao: 'TI - Matriz', nota: 'Notebook para novo analista' },
  { patrimonio: 'NT-1002', modelo: 'Lenovo ThinkPad T14', data_entrada: '2026-05-20', estado: 'entrada', localizacao: 'Financeiro', nota: null },
  { patrimonio: 'NT-1003', modelo: 'HP EliteDesk 800 G9', data_entrada: '2026-04-11', estado: 'entrada', localizacao: 'Recepção', nota: null },
  { patrimonio: 'NT-1004', modelo: 'Dell OptiPlex 7010', data_entrada: '2026-03-30', estado: 'saida', localizacao: 'TI - Matriz', nota: 'Devolvido ao fornecedor' },
  { patrimonio: 'NT-1005', modelo: 'Lenovo ThinkCentre M75q', data_entrada: '2026-07-01', estado: 'entrada', localizacao: 'Sala de Reuniões', nota: null },
  { patrimonio: 'NT-1006', modelo: 'Apple MacBook Air M2', data_entrada: '2026-08-15', estado: 'entrada', localizacao: 'Design', nota: 'Uso do time de produto' },
  { patrimonio: 'NT-1007', modelo: 'Dell Latitude 5440', data_entrada: '2026-08-28', estado: 'entrada', localizacao: 'RH', nota: null },
  { patrimonio: 'NT-1008', modelo: 'HP ProBook 440', data_entrada: '2026-02-14', estado: 'saida', localizacao: 'TI - Matriz', nota: 'Troca em garantia' }
]

const ANTIGAS: Record<string, unknown>[] = [
  { patrimonio: 'NT-0501', modelo: 'Dell OptiPlex 3020', data_entrada: '2019-03-10', estado: 'em_atuacao', condicao: 'Usado', data_venda: null, comprador: null, localizacao: 'Suporte Técnico', nota: null },
  { patrimonio: 'NT-0502', modelo: 'HP Compaq 8300', data_entrada: '2018-11-05', estado: 'parada', condicao: 'Desgastado', data_venda: null, comprador: null, localizacao: 'Estoque - Matriz', nota: null },
  { patrimonio: 'NT-0503', modelo: 'Lenovo ThinkPad E480', data_entrada: '2020-01-22', estado: 'em_atuacao', condicao: 'Usado', data_venda: null, comprador: null, localizacao: 'Comercial', nota: null },
  { patrimonio: 'NT-0504', modelo: 'Dell Latitude 3400', data_entrada: '2019-07-18', estado: 'venda', condicao: 'Usado', data_venda: '2026-01-10', comprador: 'Cooperativa Recicla TI', localizacao: 'Estoque - Matriz', nota: null },
  { patrimonio: 'NT-0505', modelo: 'HP EliteBook 840', data_entrada: '2020-09-09', estado: 'em_atuacao', condicao: 'Quase Novo', data_venda: null, comprador: null, localizacao: 'Diretoria', nota: null },
  { patrimonio: 'NT-0506', modelo: 'Dell Vostro 3470', data_entrada: '2018-05-30', estado: 'parada', condicao: 'Danificado', data_venda: null, comprador: null, localizacao: 'Estoque - Filial Sul', nota: 'Tela trincada' },
  { patrimonio: 'NT-0507', modelo: 'Lenovo IdeaCentre', data_entrada: '2017-12-01', estado: 'venda', condicao: 'Desgastado', data_venda: '2025-11-02', comprador: 'Bazar Tech Usados', localizacao: 'Estoque - Matriz', nota: null },
  { patrimonio: 'NT-0508', modelo: 'HP ProDesk 400', data_entrada: '2019-10-14', estado: 'em_atuacao', condicao: 'Usado', data_venda: null, comprador: null, localizacao: 'Suporte Técnico', nota: null },
  { patrimonio: 'NT-0509', modelo: 'Dell Inspiron 15', data_entrada: '2018-02-27', estado: 'parada', condicao: 'Danificado', data_venda: null, comprador: null, localizacao: 'Estoque - Matriz', nota: 'Sem bateria' },
  { patrimonio: 'NT-0510', modelo: 'Apple iMac 21"', data_entrada: '2020-06-19', estado: 'em_atuacao', condicao: 'Quase Novo', data_venda: null, comprador: null, localizacao: 'Marketing', nota: null }
]

export async function popularDadosDemo() {
  await criarUsuarioSeed({ nome: 'Administrador NovaTech', email: DEMO_ADMIN_EMAIL, senha: DEMO_SENHA, papel: 'gerenciar' })
  await criarUsuarioSeed({ nome: 'Camila Ferreira (Editora)', email: 'editor@novatech.com', senha: DEMO_SENHA, papel: 'editar' })
  await criarUsuarioSeed({ nome: 'Rodrigo Lima (Visualização)', email: 'visualizador@novatech.com', senha: DEMO_SENHA, papel: 'visualizar' })

  for (const row of NOVAS) inserirMaquinaSeed('maquinas_novas', row)
  for (const row of ANTIGAS) inserirMaquinaSeed('maquinas_antigas', row)

  inserirRemocaoSeed({
    tabela: 'novas',
    patrimonio: 'NT-0999',
    modelo: 'Dell Vostro 14',
    estado: 'entrada',
    motivo: 'Cadastro duplicado corrigido',
    analista: 'Administrador NovaTech',
    removido_em: '2026-08-05 10:12:00'
  })
  inserirRemocaoSeed({
    tabela: 'antigas',
    patrimonio: 'NT-0450',
    modelo: 'HP Compaq dc7900',
    estado: 'parada',
    motivo: 'Descarte por obsolescência (e-lixo)',
    analista: 'Camila Ferreira (Editora)',
    removido_em: '2026-07-19 15:40:00'
  })

  await persistirSeed()
}
