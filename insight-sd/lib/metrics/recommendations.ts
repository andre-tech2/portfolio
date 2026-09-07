import { TERMINAL_STATUSES } from "@/lib/csv/columnMap";
import type { SlaGoals } from "@/lib/settings/slaGoals";
import type { Ticket } from "@/lib/types/ticket";
import { STALE_THRESHOLD_HOURS } from "./backlogAging";
import { getOverdueDelayHours } from "./overdue";
import type { AgentStat, MetricsContext, Recommendation } from "./types";

const RULES_CONFIG = {
  agentOverloadRatio: 1.5,
  agentSlaGapPoints: 10,
  minSampleSize: 5,
  departmentConcentrationRatio: 0.6,
  overallOverdueWarning: 10, // % do total
  staleBacklogMinCount: 3,
  csatWarning: 3.5,
  csatCritical: 3.0,
  vipAtRiskMinCount: 1,
};

function severityForSla(pct: number, goals: SlaGoals): "warning" | "critical" | null {
  if (pct < goals.critical) return "critical";
  if (pct < goals.target) return "warning";
  return null;
}

function slaByCategoryPriority(tickets: Ticket[]) {
  const groups = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    if (!ticket.category) continue;
    const key = `${ticket.category}__${ticket.priority}`;
    const list = groups.get(key) ?? [];
    list.push(ticket);
    groups.set(key, list);
  }

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const [category, priority] = key.split("__");
      const knownSla = group.filter((t) => t.resolutionSlaStatus !== null);
      const withinSla = knownSla.filter((t) => t.resolutionSlaStatus === "Within SLA").length;
      const percentage = knownSla.length > 0 ? (withinSla / knownSla.length) * 100 : null;
      return { category, priority, count: group.length, percentage, tickets: group };
    })
    .filter((g) => g.count >= RULES_CONFIG.minSampleSize && g.percentage !== null);
}

/** Ranqueia os agentes que mais atenderam esse grupo de chamados, com o SLA de cada um dentro dele — dá pro gestor saber quem procurar pra ação de melhoria contínua nessa combinação categoria×prioridade. */
function agentBreakdownText(tickets: Ticket[], maxAgents = 3): string {
  const byAgent = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const list = byAgent.get(ticket.agent) ?? [];
    list.push(ticket);
    byAgent.set(ticket.agent, list);
  }

  const ranked = Array.from(byAgent.entries())
    .map(([agent, agentTickets]) => {
      const knownSla = agentTickets.filter((t) => t.resolutionSlaStatus !== null);
      const withinSla = knownSla.filter((t) => t.resolutionSlaStatus === "Within SLA").length;
      const percentage = knownSla.length > 0 ? (withinSla / knownSla.length) * 100 : null;
      return { agent, count: agentTickets.length, percentage };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, maxAgents);

  return ranked
    .map((a) => `${a.agent} (${a.count}${a.percentage !== null ? `, ${a.percentage.toFixed(0)}% SLA` : ""})`)
    .join(", ");
}

function ruleSlaByCategoryPriority(ctx: MetricsContext, tickets: Ticket[], goals: SlaGoals): Recommendation[] {
  const results: Recommendation[] = [];
  for (const group of slaByCategoryPriority(tickets)) {
    const severity = severityForSla(group.percentage as number, goals);
    if (!severity) continue;
    results.push({
      id: `sla-category-${group.category}-${group.priority}`,
      severity,
      title: `SLA baixo em "${group.category}" (prioridade ${group.priority})`,
      description: `Apenas ${group.percentage!.toFixed(0)}% dos ${group.count} chamados dessa combinação ficaram dentro do SLA. Vale revisar o processo ou criar material de apoio para essa categoria. Agentes mais envolvidos: ${agentBreakdownText(group.tickets)}.`,
      impactCount: group.count,
      relatedTickets: group.tickets,
    });
  }
  return results;
}

function ruleAgentOverload(agentStats: AgentStat[], tickets: Ticket[]): Recommendation[] {
  const realAgents = agentStats.filter((a) => a.agent !== "No Agent");
  if (realAgents.length === 0) return [];

  const avgVolume = realAgents.reduce((sum, a) => sum + a.volume, 0) / realAgents.length;
  const results: Recommendation[] = [];

  for (const agent of realAgents) {
    if (avgVolume > 0 && agent.volume > avgVolume * RULES_CONFIG.agentOverloadRatio) {
      results.push({
        id: `overload-${agent.agent}`,
        severity: "warning",
        title: `${agent.agent} está com volume acima da média`,
        description: `${agent.volume} chamados atendidos, ${(agent.volume / avgVolume).toFixed(1)}x a média da equipe (${avgVolume.toFixed(0)}). Considere redistribuir ou reforçar o time.`,
        impactCount: agent.volume,
        relatedTickets: tickets.filter((t) => t.agent === agent.agent),
      });
    }
  }
  return results;
}

function ruleAgentSlaGap(agentStats: AgentStat[], tickets: Ticket[]): Recommendation[] {
  const realAgents = agentStats.filter(
    (a) => a.agent !== "No Agent" && a.slaPercentage !== null && a.volume >= RULES_CONFIG.minSampleSize
  );
  if (realAgents.length === 0) return [];

  const knownSla = realAgents.map((a) => a.slaPercentage as number);
  const avgSla = knownSla.reduce((sum, v) => sum + v, 0) / knownSla.length;

  const results: Recommendation[] = [];
  for (const agent of realAgents) {
    const gap = avgSla - (agent.slaPercentage as number);
    if (gap > RULES_CONFIG.agentSlaGapPoints) {
      results.push({
        id: `sla-gap-${agent.agent}`,
        severity: gap > RULES_CONFIG.agentSlaGapPoints * 2 ? "critical" : "warning",
        title: `${agent.agent} com SLA abaixo da equipe`,
        description: `SLA de ${agent.slaPercentage!.toFixed(0)}%, ${gap.toFixed(0)} pontos percentuais abaixo da média da equipe (${avgSla.toFixed(0)}%). Pode valer um acompanhamento individual.`,
        impactCount: agent.volume,
        relatedTickets: tickets.filter((t) => t.agent === agent.agent),
      });
    }
  }
  return results;
}

function ruleDepartmentConcentration(tickets: Ticket[]): Recommendation[] {
  const byDepartment = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    if (!ticket.department) continue;
    const list = byDepartment.get(ticket.department) ?? [];
    list.push(ticket);
    byDepartment.set(ticket.department, list);
  }

  const results: Recommendation[] = [];
  for (const [department, deptTickets] of byDepartment.entries()) {
    if (deptTickets.length < RULES_CONFIG.minSampleSize) continue;

    const byCategory = new Map<string, number>();
    for (const ticket of deptTickets) {
      const key = ticket.category ?? ticket.item ?? "Não informado";
      byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
    }

    const [topCategory, topCount] = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
    const ratio = topCount / deptTickets.length;

    if (ratio >= RULES_CONFIG.departmentConcentrationRatio) {
      results.push({
        id: `dept-concentration-${department}`,
        severity: "info",
        title: `"${department}" concentra chamados de "${topCategory}"`,
        description: `${topCount} dos ${deptTickets.length} chamados dessa área (${(ratio * 100).toFixed(0)}%) são de "${topCategory}". Pode ser oportunidade de treinamento, FAQ ou self-service direcionado.`,
        impactCount: topCount,
        relatedTickets: deptTickets.filter((t) => (t.category ?? t.item ?? "Não informado") === topCategory),
      });
    }
  }
  return results;
}

function ruleOverallOverdue(ctx: MetricsContext, tickets: Ticket[]): Recommendation[] {
  if (ctx.totalTickets === 0) return [];
  const pct = (ctx.overdueTotalCount / ctx.totalTickets) * 100;
  if (pct < RULES_CONFIG.overallOverdueWarning) return [];

  const teamCausedCount = ctx.overdueTotalCount - ctx.overdueExternalCount;
  const externalNote =
    ctx.overdueExternalCount > 0
      ? ` Desses, ${ctx.overdueExternalCount} estão esperando terceiros (transportadora, equipamento, aprovação) e não pesam contra o time — ${teamCausedCount} dependem diretamente do atendimento.`
      : "";

  return [
    {
      id: "overall-overdue",
      severity: pct >= RULES_CONFIG.overallOverdueWarning * 2 ? "critical" : "warning",
      title: "Volume geral de atrasos está alto",
      description: `${ctx.overdueTotalCount} de ${ctx.totalTickets} chamados (${pct.toFixed(0)}%) estão ou ficaram atrasados em relação ao prazo de SLA.${externalNote} Vale revisar a capacidade do time ou os prazos configurados.`,
      impactCount: ctx.overdueTotalCount,
      relatedTickets: tickets.filter((t) => getOverdueDelayHours(t) !== null),
    },
  ];
}

function ruleUrgentPrioritySla(tickets: Ticket[], goals: SlaGoals): Recommendation[] {
  const urgent = tickets.filter((t) => t.priority === "Urgente");
  const knownSla = urgent.filter((t) => t.resolutionSlaStatus !== null);
  if (knownSla.length < RULES_CONFIG.minSampleSize) return [];

  const withinSla = knownSla.filter((t) => t.resolutionSlaStatus === "Within SLA").length;
  const percentage = (withinSla / knownSla.length) * 100;
  const severity = severityForSla(percentage, goals);
  if (!severity) return [];

  return [
    {
      id: "urgent-sla",
      severity,
      title: "SLA de chamados Urgentes abaixo do esperado",
      description: `${percentage.toFixed(0)}% dos ${knownSla.length} chamados de prioridade Urgente ficaram dentro do SLA. Chamados urgentes merecem atenção prioritária de revisão de processo.`,
      impactCount: knownSla.length,
      relatedTickets: urgent,
    },
  ];
}

function ruleStaleBacklog(ctx: MetricsContext, tickets: Ticket[]): Recommendation[] {
  if (ctx.staleTotalCount < RULES_CONFIG.staleBacklogMinCount) return [];

  const now = new Date();
  const staleTickets = tickets.filter((t) => {
    if (TERMINAL_STATUSES.has(t.status)) return false;
    const reference = t.lastUpdatedAt ?? t.createdAt;
    if (!reference) return false;
    return (now.getTime() - reference.getTime()) / (1000 * 60 * 60) > STALE_THRESHOLD_HOURS;
  });

  return [
    {
      id: "stale-backlog",
      severity: ctx.staleTotalCount >= RULES_CONFIG.staleBacklogMinCount * 3 ? "critical" : "warning",
      title: "Chamados parados sem atualização",
      description: `${ctx.staleTotalCount} chamados estão em aberto e sem nenhuma atualização há mais de 48h. Mesmo dentro do prazo de SLA, isso é risco de chamado esquecido — vale uma triagem.`,
      impactCount: ctx.staleTotalCount,
      relatedTickets: staleTickets,
    },
  ];
}

function ruleLowCsatCategory(ctx: MetricsContext, tickets: Ticket[]): Recommendation[] {
  const results: Recommendation[] = [];
  for (const entry of ctx.satisfactionByCategory) {
    if (entry.avgSatisfaction >= RULES_CONFIG.csatWarning) continue;
    results.push({
      id: `csat-${entry.key}`,
      severity: entry.avgSatisfaction < RULES_CONFIG.csatCritical ? "critical" : "warning",
      title: `Satisfação baixa em "${entry.key}"`,
      description: `Nota média de ${entry.avgSatisfaction.toFixed(1)}/5 em ${entry.responseCount} respostas de pesquisa. Vale investigar o que está pesando na experiência dessa categoria.`,
      impactCount: entry.responseCount,
      relatedTickets: tickets.filter((t) => t.category === entry.key && t.satisfaction !== null),
    });
  }
  return results;
}

function ruleVipAtRisk(ctx: MetricsContext, tickets: Ticket[]): Recommendation[] {
  if (ctx.vipTotalCount < RULES_CONFIG.vipAtRiskMinCount) return [];

  const vipAtRisk = tickets.filter((t) => {
    if (!t.isVip) return false;
    const isTerminal = TERMINAL_STATUSES.has(t.status);
    const violatedSla = t.resolutionSlaStatus === "SLA Violated";
    return !isTerminal || violatedSla;
  });

  return [
    {
      id: "vip-at-risk",
      severity: "critical",
      title: "Solicitantes VIP em risco",
      description:
        ctx.vipTotalCount === 1
          ? "1 chamado de solicitante VIP está atrasado ou ainda em aberto. Merece prioridade imediata."
          : `${ctx.vipTotalCount} chamados de solicitante VIP estão atrasados ou ainda em aberto. Merecem prioridade imediata.`,
      impactCount: ctx.vipTotalCount,
      relatedTickets: vipAtRisk,
    },
  ];
}

const SEVERITY_WEIGHT: Record<Recommendation["severity"], number> = { critical: 3, warning: 2, info: 1 };

export function buildRecommendations(ctx: MetricsContext, tickets: Ticket[], goals: SlaGoals): Recommendation[] {
  const all = [
    ...ruleSlaByCategoryPriority(ctx, tickets, goals),
    ...ruleAgentOverload(ctx.agentStats, tickets),
    ...ruleAgentSlaGap(ctx.agentStats, tickets),
    ...ruleDepartmentConcentration(tickets),
    ...ruleOverallOverdue(ctx, tickets),
    ...ruleUrgentPrioritySla(tickets, goals),
    ...ruleStaleBacklog(ctx, tickets),
    ...ruleLowCsatCategory(ctx, tickets),
    ...ruleVipAtRisk(ctx, tickets),
  ];

  return all
    .sort((a, b) => {
      const severityDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.impactCount - a.impactCount;
    })
    .slice(0, 20);
}
