import type { Ticket } from "@/lib/types/ticket";

export interface TopEntry {
  key: string;
  count: number;
  percentage: number;
}

export interface OverdueTicket {
  id: string;
  subject: string;
  agent: string;
  department: string | null;
  priority: string;
  status: string;
  delayHours: number;
  dueAt: Date;
  /** Atraso enquanto o chamado espera um terceiro (transportadora, equipamento, aprovador) — não é falha do agente. */
  isExternalBlock: boolean;
}

export interface AgentStat {
  agent: string;
  volume: number;
  avgResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  slaPercentage: number | null;
  /** SLA de 1ª resposta, separado do SLA de resolução — um agente pode ser rápido pra resolver mas lento pra dar o primeiro retorno. */
  firstResponseSlaPercentage: number | null;
  overdueCount: number;
  /** Dos atrasados desse agente, quantos estão esperando um terceiro (não pesa contra ele). */
  overdueExternalCount: number;
  avgSatisfaction: number | null;
  /** Chamados com status Encerrado/Resolvido — exclui Cancelado, que não é uma entrega. */
  closedCount: number;
  /** closedCount / volume, em %. */
  closedPercentage: number | null;
}

export interface StaleTicket {
  id: string;
  subject: string;
  agent: string;
  department: string | null;
  priority: string;
  status: string;
  hoursSinceUpdate: number;
  lastUpdatedAt: Date;
}

export interface VipTicket {
  id: string;
  subject: string;
  agent: string;
  requesterName: string | null;
  priority: string;
  status: string;
  isOverdue: boolean;
  hoursOpen: number;
}

export interface HeatmapCell {
  weekday: number; // 0 = domingo
  hour: number; // 0-23
  count: number;
}

export interface CategorySatisfaction {
  key: string;
  avgSatisfaction: number;
  responseCount: number;
  /** responseCount / chamados fechados dessa categoria, em % — mede quão confiável é a média acima. */
  responseRate: number | null;
}

export interface AgingBucket {
  label: string;
  count: number;
}

export interface PriorityResolutionStat {
  priority: string;
  count: number;
  avgResolutionHours: number | null;
}

export interface AgentBacklogRow {
  agent: string;
  total: number;
  /** Mesma ordem/tamanho de AGING_BUCKETS (lib/metrics/backlogAging.ts). */
  buckets: number[];
}

export interface StatusBreakdownEntry {
  status: string;
  count: number;
}

export interface AgentStatusCell {
  agent: string;
  status: string;
  count: number;
}

export interface AgentHealthScore {
  agent: string;
  score: number;
}

export interface PriorityStatusCell {
  priority: string;
  status: string;
  count: number;
}

export interface UnassignedTicket {
  id: string;
  subject: string;
  department: string | null;
  priority: string;
  status: string;
  hoursOpen: number;
}

export interface SlaOverall {
  firstResponse: { withinSla: number; violated: number; unknown: number; percentage: number | null };
  resolution: { withinSla: number; violated: number; unknown: number; percentage: number | null };
}

export interface TrendPoint {
  periodLabel: string;
  periodStart: Date;
  count: number;
  avgResolutionHours: number | null;
  slaPercentage: number | null;
}

export interface AgentComparison {
  agent: string;
  agentStat: AgentStat;
  teamAverage: {
    volume: number;
    avgResolutionHours: number | null;
    slaPercentage: number | null;
    firstResponseSlaPercentage: number | null;
    closedCount: number;
    avgSatisfaction: number | null;
    overdueCount: number;
  };
}

export type RecommendationSeverity = "info" | "warning" | "critical";

export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  impactCount: number;
  /** Chamados por trás do número, pra abrir num modal em vez de deixar só o agregado. */
  relatedTickets?: Ticket[];
}

export interface MetricsContext {
  totalTickets: number;
  topSubjects: TopEntry[];
  overdueTickets: OverdueTicket[];
  agentStats: AgentStat[];
  slaOverall: SlaOverall;
  avgResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  topDepartments: TopEntry[];
  topCategories: TopEntry[];
  overdueTotalCount: number;
  /** Dos atrasados no total, quantos estão esperando um terceiro (transportadora, equipamento, aprovador). */
  overdueExternalCount: number;
  teamTrend: TrendPoint[];
  heatmap: HeatmapCell[];
  staleTickets: StaleTicket[];
  staleTotalCount: number;
  vipAtRiskTickets: VipTicket[];
  vipTotalCount: number;
  unassignedTickets: UnassignedTicket[];
  unassignedTotalCount: number;
  avgSatisfaction: number | null;
  /** % de chamados fechados que receberam resposta de pesquisa — mede a confiabilidade do CSAT. */
  csatResponseRate: number | null;
  satisfactionByCategory: CategorySatisfaction[];
  openTicketsCount: number;
  backlogAging: AgingBucket[];
  agentBacklog: AgentBacklogRow[];
  resolutionByPriority: PriorityResolutionStat[];
  priorityStatusMatrix: PriorityStatusCell[];
  agentStatusMatrix: AgentStatusCell[];
  statusBreakdown: StatusBreakdownEntry[];
  agentHealthScores: AgentHealthScore[];
}
