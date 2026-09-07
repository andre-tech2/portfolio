import { get, set } from "idb-keyval";

export interface SlaGoals {
  /** % de SLA a partir do qual é considerado saudável (verde). */
  target: number;
  /** % de SLA abaixo do qual é considerado crítico (vermelho). Entre os dois = alerta (amarelo). */
  critical: number;
}

export const DEFAULT_SLA_GOALS: SlaGoals = { target: 85, critical: 70 };

const SLA_GOALS_KEY = "insight-sd:sla-goals:v1";

export async function loadSlaGoals(): Promise<SlaGoals> {
  try {
    const stored = await get<SlaGoals>(SLA_GOALS_KEY);
    return stored ?? DEFAULT_SLA_GOALS;
  } catch (error) {
    console.error("Falha ao carregar metas de SLA do IndexedDB", error);
    return DEFAULT_SLA_GOALS;
  }
}

export async function saveSlaGoals(goals: SlaGoals): Promise<void> {
  try {
    await set(SLA_GOALS_KEY, goals);
  } catch (error) {
    console.error("Falha ao salvar metas de SLA no IndexedDB", error);
    throw error;
  }
}
