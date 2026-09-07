import { get, set } from "idb-keyval";

/** Mesmas prioridades usadas em todo o app (ver PRIORITY_ORDER em PriorityStatusMatrix.tsx). */
export const PRIORITY_ORDER = ["Urgente", "Alta", "Média", "Baixa"] as const;
export type Priority = (typeof PRIORITY_ORDER)[number];

export interface PerformanceGoals {
  /** Tempo médio de resolução desejado por prioridade, em horas. */
  resolutionHoursTargets: Record<Priority, number>;
  /** Nota média de satisfação desejada (escala 0-5). */
  csatTarget: number;
  /** Volume médio de chamados atendidos pelo time por dia. */
  dailyVolumeTarget: number;
}

/**
 * Benchmarks comuns de mercado pra SLA de resolução por prioridade em service desk de TI
 * (Urgente/P1 4h, Alta/P2 8h, Média/P3 24h, Baixa/P4 72h) — não são números calculados
 * especificamente pra essa operação. CSAT e volume diário são placeholders neutros — ajustável
 * em Configurações.
 */
export const DEFAULT_PERFORMANCE_GOALS: PerformanceGoals = {
  resolutionHoursTargets: { Urgente: 4, Alta: 8, Média: 24, Baixa: 72 },
  csatTarget: 4.2,
  dailyVolumeTarget: 25,
};

const PERFORMANCE_GOALS_KEY = "insight-sd:performance-goals:v3";

export async function loadPerformanceGoals(): Promise<PerformanceGoals> {
  try {
    const stored = await get<PerformanceGoals>(PERFORMANCE_GOALS_KEY);
    return stored ?? DEFAULT_PERFORMANCE_GOALS;
  } catch (error) {
    console.error("Falha ao carregar metas de desempenho do IndexedDB", error);
    return DEFAULT_PERFORMANCE_GOALS;
  }
}

export async function savePerformanceGoals(goals: PerformanceGoals): Promise<void> {
  try {
    await set(PERFORMANCE_GOALS_KEY, goals);
  } catch (error) {
    console.error("Falha ao salvar metas de desempenho no IndexedDB", error);
    throw error;
  }
}
