import type { SlaStatus, Ticket } from "@/lib/types/ticket";

type Priority = "Baixa" | "Média" | "Alta" | "Urgente";

const RESOLUTION_TARGET_HOURS: Record<Priority, number> = { Urgente: 4, Alta: 8, Média: 24, Baixa: 72 };
const FIRST_RESPONSE_TARGET_HOURS: Record<Priority, number> = { Urgente: 0.5, Alta: 1, Média: 4, Baixa: 8 };

const PRIORITIES: [Priority, number][] = [
  ["Baixa", 0.35],
  ["Média", 0.4],
  ["Alta", 0.18],
  ["Urgente", 0.07],
];

interface AgentProfile {
  name: string;
  volumeWeight: number;
  /** 0-1: quanto maior, mais chamados dele ficam dentro do SLA. */
  quality: number;
}

const AGENTS: AgentProfile[] = [
  { name: "André André", volumeWeight: 95, quality: 0.91 },
  { name: "Camila Ferreira", volumeWeight: 85, quality: 0.89 },
  { name: "Rodrigo Lima", volumeWeight: 80, quality: 0.87 },
  { name: "Beatriz Souza", volumeWeight: 75, quality: 0.9 },
  { name: "Fernanda Costa", volumeWeight: 130, quality: 0.64 },
  { name: "Lucas Martins", volumeWeight: 70, quality: 0.88 },
  { name: "Diego Alves", volumeWeight: 20, quality: 0.85 },
];

const DEPARTMENTS = ["TI", "Financeiro", "RH", "Comercial", "Operações"];

interface CategoryDef {
  category: string;
  subcategory: string;
  subjects: string[];
}

const CATEGORIES: CategoryDef[] = [
  { category: "Hardware e Periféricos", subcategory: "Notebook", subjects: ["Notebook não liga", "Troca de bateria", "Tela com defeito", "Upgrade de memória"] },
  { category: "Hardware e Periféricos", subcategory: "Periféricos", subjects: ["Mouse não funciona", "Monitor sem sinal", "Teclado com defeito", "Headset não conecta"] },
  { category: "Acesso e Senha", subcategory: "Rede", subjects: ["Reset de senha de rede", "Conta bloqueada", "Acesso a pasta compartilhada"] },
  { category: "Acesso e Senha", subcategory: "Sistemas", subjects: ["Reset de senha do sistema", "Liberação de acesso ao sistema X", "Perfil de acesso incorreto"] },
  { category: "Software", subcategory: "Instalação", subjects: ["Instalação do pacote Office", "Instalação de software interno", "Atualização de sistema operacional"] },
  { category: "Software", subcategory: "Licenciamento", subjects: ["Licença expirada", "Solicitação de licença adicional"] },
  { category: "Rede", subcategory: "VPN", subjects: ["VPN não conecta", "Lentidão na VPN", "Certificado de VPN expirado"] },
  { category: "Rede", subcategory: "Wi-Fi", subjects: ["Wi-Fi instável", "Sem sinal de Wi-Fi na sala de reuniões"] },
  { category: "Telefonia", subcategory: "Ramal", subjects: ["Ramal sem sinal", "Configuração de ramal novo"] },
];

const RH_CATEGORY_INDEXES = [2, 3]; // "Acesso e Senha" (Rede, Sistemas) — concentra os chamados do RH de propósito.

const TICKET_TYPES = ["Incidente", "Solicitação de Serviço", "Problema"];
const ORIGINS = ["Portal", "E-mail", "Telefone", "Chat"];

const FIRST_NAMES = ["Marina", "Paulo", "Juliana", "Bruno", "Larissa", "Felipe", "Tatiane", "Gustavo", "Renata", "Vinícius", "Aline", "Rafael", "Débora", "Thiago", "Patrícia", "Eduardo", "Camila", "Marcelo", "Priscila", "André"];
const LAST_NAMES = ["Oliveira", "Santos", "Pereira", "Costa", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Barbosa", "Rocha"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [item, w] of items) {
    if (roll < w) return item;
    roll -= w;
  }
  return items[items.length - 1][0];
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function slaStatus(withinProbability: number): SlaStatus {
  return Math.random() < withinProbability ? "Within SLA" : "SLA Violated";
}

let ticketCounter = 100000;
function nextId(): string {
  ticketCounter += 1;
  return `SD-${ticketCounter}`;
}

function pickCategory(department: string): CategoryDef {
  if (department === "RH" && Math.random() < 0.72) {
    return CATEGORIES[pick(RH_CATEGORY_INDEXES)];
  }
  return pick(CATEGORIES);
}

function pickRequester(): { name: string; email: string } {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@novatech.com`;
  return { name, email };
}

/** Gera um chamado já concluído (Resolvido/Encerrado/Cancelado), com todos os tempos e SLA coerentes entre si. */
function buildClosedTicket(agent: AgentProfile, department: string, createdAt: Date): Ticket {
  const def = pickCategory(department);
  const priority = weightedPick(PRIORITIES);
  const isVip = Math.random() < 0.05;
  const requester = pickRequester();

  const status = weightedPick<Ticket["status"]>([
    ["Resolvido", 0.85],
    ["Encerrado", 0.12],
    ["Cancelado", 0.03],
  ]);
  const cancelled = status === "Cancelado";

  const target = RESOLUTION_TARGET_HOURS[priority];
  const withinProb = cancelled ? 1 : agent.quality * (def.category === "Rede" ? 0.85 : 1);
  const withinSla = !cancelled && Math.random() < withinProb;
  const resolutionHours = cancelled
    ? randFloat(0.2, target * 0.5)
    : withinSla
      ? randFloat(target * 0.15, target * 0.95)
      : randFloat(target * 1.05, target * 3.2);

  const frTarget = FIRST_RESPONSE_TARGET_HOURS[priority];
  const frWithin = Math.random() < Math.min(0.97, agent.quality + 0.08);
  const firstResponseHours = frWithin ? randFloat(frTarget * 0.1, frTarget * 0.9) : randFloat(frTarget * 1.1, frTarget * 2.5);

  const resolvedAt = cancelled ? null : addHours(createdAt, resolutionHours);
  const closedAt = addHours(resolvedAt ?? createdAt, randFloat(0, 3));
  const dueAt = addHours(createdAt, target);

  let satisfaction: number | null = null;
  if (!cancelled && Math.random() < 0.55) {
    const lowCsatCategory = def.category === "Rede";
    satisfaction = lowCsatCategory
      ? weightedPick<number>([[1, 0.1], [2, 0.25], [3, 0.3], [4, 0.25], [5, 0.1]])
      : weightedPick<number>([[2, 0.03], [3, 0.12], [4, 0.35], [5, 0.5]]);
  }

  return {
    id: nextId(),
    status,
    agent: agent.name,
    priority,
    department,
    category: def.category,
    subcategory: def.subcategory,
    item: def.subcategory,
    subject: pick(def.subjects),
    ticketType: pick(TICKET_TYPES),
    group: priority === "Urgente" || priority === "Alta" ? (Math.random() < 0.6 ? "Suporte N2" : "Suporte N1") : "Suporte N1",
    origin: pick(ORIGINS),
    firstResponseSlaStatus: cancelled ? null : slaStatus(frWithin ? 0.97 : 0.03),
    resolutionSlaStatus: cancelled ? null : withinSla ? "Within SLA" : "SLA Violated",
    firstResponseHours,
    resolutionHours,
    createdAt,
    closedAt,
    resolvedAt,
    lastUpdatedAt: closedAt,
    dueAt,
    satisfaction,
    requesterEmail: requester.email,
    requesterName: requester.name,
    isVip,
  };
}

/** Gera um chamado ainda em aberto — algumas propositalmente "paradas" (aging/backlog) pro Crítico Agora ter o que mostrar. */
function buildOpenTicket(agent: AgentProfile | null, department: string, createdAt: Date, now: Date, stale: boolean): Ticket {
  const def = pickCategory(department);
  const priority = weightedPick(PRIORITIES);
  const isVip = Math.random() < 0.08; // um pouco mais alto que o fechado — queremos VIP em risco pra aparecer.
  const requester = pickRequester();

  const status = weightedPick<Ticket["status"]>([
    ["Aberto", 0.35],
    ["Em andamento", 0.3],
    ["Bloqueado", 0.1],
    ["Aguardando transportadora", 0.06],
    ["Aguardando equipamento", 0.06],
    ["Aguardando romaneio", 0.04],
    ["Equipamento enviado", 0.04],
    ["Aguardando Aprovação", 0.05],
  ]);

  const target = RESOLUTION_TARGET_HOURS[priority];
  const dueAt = addHours(createdAt, target);
  const pastDue = dueAt.getTime() < now.getTime();

  const lastUpdatedAt = stale ? createdAt : addHours(now, -randFloat(0.5, 20));

  return {
    id: nextId(),
    status,
    agent: agent ? agent.name : "No Agent",
    priority,
    department,
    category: def.category,
    subcategory: def.subcategory,
    item: def.subcategory,
    subject: pick(def.subjects),
    ticketType: pick(TICKET_TYPES),
    group: priority === "Urgente" || priority === "Alta" ? "Suporte N2" : "Suporte N1",
    origin: pick(ORIGINS),
    firstResponseSlaStatus: Math.random() < 0.85 ? "Within SLA" : "SLA Violated",
    resolutionSlaStatus: pastDue ? "SLA Violated" : null,
    firstResponseHours: randFloat(0.1, FIRST_RESPONSE_TARGET_HOURS[priority] * 1.5),
    resolutionHours: null,
    createdAt,
    closedAt: null,
    resolvedAt: null,
    lastUpdatedAt,
    dueAt,
    satisfaction: null,
    requesterEmail: requester.email,
    requesterName: requester.name,
    isVip,
  };
}

/**
 * Monta um dataset sintético do zero, ancorado em `now` — sempre "atual" no momento em que o
 * visitante abre a demo pela primeira vez, em vez de um CSV estático que ficaria visivelmente
 * desatualizado com o tempo. Os desequilíbrios (Fernanda sobrecarregada, RH concentrado em
 * Acesso e Senha, CSAT baixo em Rede, backlog parado, VIP em risco) são propositais — servem pra
 * página de Recomendações e o Crítico Agora terem o que mostrar.
 */
export function generateSampleTickets(now: Date = new Date()): Ticket[] {
  ticketCounter = 100000;
  const tickets: Ticket[] = [];

  for (const agent of AGENTS) {
    for (let i = 0; i < agent.volumeWeight; i++) {
      const daysAgo = Math.pow(Math.random(), 1.4) * 150;
      const createdAt = addHours(now, -daysAgo * 24 - randFloat(0, 23));
      const department = pick(DEPARTMENTS);
      tickets.push(buildClosedTicket(agent, department, createdAt));
    }
  }

  // Backlog em aberto: a maioria recente, um bloco deliberadamente "parado" há semanas.
  const openAssigned = 55;
  for (let i = 0; i < openAssigned; i++) {
    const stale = i < 13;
    const daysAgo = stale ? randFloat(18, 60) : randFloat(0, 9);
    const createdAt = addHours(now, -daysAgo * 24 - randFloat(0, 23));
    const agent = weightedPick(AGENTS.map((a) => [a, a.volumeWeight] as [AgentProfile, number]));
    const department = pick(DEPARTMENTS);
    tickets.push(buildOpenTicket(agent, department, createdAt, now, stale));
  }

  // Chamados sem agente atribuído.
  const unassigned = 14;
  for (let i = 0; i < unassigned; i++) {
    const daysAgo = randFloat(0, 6);
    const createdAt = addHours(now, -daysAgo * 24 - randFloat(0, 23));
    const department = pick(DEPARTMENTS);
    tickets.push(buildOpenTicket(null, department, createdAt, now, false));
  }

  return tickets;
}
