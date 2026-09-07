/** Nomes exatos das colunas do CSV exportado, como aparecem no header em português. */
export const COLUMNS = {
  id: "ID do ticket",
  status: "Status",
  agent: "Agente",
  priority: "Prioridade",
  department: "Departamento",
  category: "Categoria",
  subcategory: "Subcategoria",
  item: "Item",
  subject: "Assunto",
  ticketType: "Tipo de Ticket",
  group: "Grupo",
  origin: "Origem",
  firstResponseSlaStatus: "Status da Primeira Resposta",
  resolutionSlaStatus: "Status da Resolução",
  firstResponseHours: "Tempo para a primeira resposta (em horas)",
  resolutionHours: "Tempo para a resolução (em horas)",
  createdAt: "Hora da Criação",
  closedAt: "Hora de Encerramento",
  resolvedAt: "Hora da resolução",
  lastUpdatedAt: "Hora da Última Atualização",
  dueAt: "Vencimento em",
  satisfaction: "Resultado da Pesquisa",
  requesterEmail: "E-mail do requisitante",
  requesterName: "Nome do Requisitante",
  isVip: "Solicitante VIP",
} as const;

/** Colunas que precisam existir no CSV pra conseguirmos calcular as métricas do dashboard. */
export const REQUIRED_COLUMNS: string[] = [
  COLUMNS.id,
  COLUMNS.status,
  COLUMNS.agent,
  COLUMNS.priority,
  COLUMNS.department,
  COLUMNS.category,
  COLUMNS.item,
  COLUMNS.subject,
  COLUMNS.ticketType,
  COLUMNS.group,
  COLUMNS.firstResponseSlaStatus,
  COLUMNS.resolutionSlaStatus,
  COLUMNS.firstResponseHours,
  COLUMNS.resolutionHours,
  COLUMNS.createdAt,
  COLUMNS.dueAt,
];

/** Status que indicam que o ticket já terminou seu ciclo de vida. */
export const TERMINAL_STATUSES = new Set(["Encerrado", "Resolvido", "Cancelado"]);

/** Status que contam como "fechado com sucesso" pelo agente — Cancelado fica de fora, não é entrega. */
export const CLOSED_STATUSES = new Set(["Encerrado", "Resolvido"]);

/**
 * Status em que o chamado está parado esperando um terceiro (transportadora, fornecedor de
 * equipamento, aprovador) — não uma ação pendente do agente. Usado pra não pesar atraso nesses
 * casos contra o SLA/ranking do agente do jeito que pesaria um chamado realmente parado com ele.
 * "Bloqueado" fica de fora por ser genérico demais — pode ser um bloqueio interno, do próprio agente.
 */
export const EXTERNAL_BLOCK_STATUSES = new Set([
  "Aguardando transportadora",
  "Aguardando equipamento",
  "Aguardando romaneio",
  "Equipamento enviado",
  "Aguardando Aprovação",
]);

/**
 * Categoria/subcategoria que classificam um chamado como sobre a máquina física em si (troca,
 * defeito, upgrade de hardware) — não sobre atendimento de software/acesso. "Notebook - AD" fica
 * de fora de propósito: é troca de senha de domínio no notebook, não problema físico do aparelho.
 */
export const MACHINE_CATEGORY = "Hardware e Periféricos";
export const MACHINE_SUBCATEGORIES = new Set(["Notebook", "Periféricos"]);
