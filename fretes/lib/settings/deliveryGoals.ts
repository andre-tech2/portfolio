import { get, set } from "idb-keyval";

export interface DeliveryGoals {
  /** % no prazo a partir do qual é considerado saudável (verde). */
  onTimeTarget: number;
  /** % no prazo abaixo do qual é considerado crítico (vermelho). Entre os dois = alerta (amarelo). */
  onTimeCritical: number;
  /** % de ocorrência a partir do qual já é considerado alerta. */
  occurrenceWarning: number;
}

export const DEFAULT_DELIVERY_GOALS: DeliveryGoals = { onTimeTarget: 90, onTimeCritical: 75, occurrenceWarning: 5 };

const DELIVERY_GOALS_KEY = "fretes:delivery-goals:v1";

export async function loadDeliveryGoals(): Promise<DeliveryGoals> {
  try {
    const stored = await get<DeliveryGoals>(DELIVERY_GOALS_KEY);
    return stored ?? DEFAULT_DELIVERY_GOALS;
  } catch (error) {
    console.error("Falha ao carregar metas de entrega do IndexedDB", error);
    return DEFAULT_DELIVERY_GOALS;
  }
}

export async function saveDeliveryGoals(goals: DeliveryGoals): Promise<void> {
  try {
    await set(DELIVERY_GOALS_KEY, goals);
  } catch (error) {
    console.error("Falha ao salvar metas de entrega no IndexedDB", error);
    throw error;
  }
}
