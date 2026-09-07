import { get, set } from "idb-keyval";

export interface RecommendationResolution {
  /** Título capturado no momento em que foi marcada como resolvida — a regra pode parar de gerar essa recomendação depois, então isso é o único registro do que era. */
  title: string;
  resolvedAt: Date;
}

export type RecommendationResolutions = Record<string, RecommendationResolution>;

const KEY = "insight-sd:recommendation-resolutions:v1";

/**
 * Independente dos chamados importados — sobrevive a "Limpar dados" e a reimportações, igual à
 * meta de SLA. É acompanhamento operacional do gestor, não parte do dataset em si.
 */
export async function loadRecommendationResolutions(): Promise<RecommendationResolutions> {
  try {
    const stored = await get<RecommendationResolutions>(KEY);
    return stored ?? {};
  } catch (error) {
    console.error("Falha ao carregar recomendações resolvidas do IndexedDB", error);
    return {};
  }
}

export async function saveRecommendationResolutions(data: RecommendationResolutions): Promise<void> {
  try {
    await set(KEY, data);
  } catch (error) {
    console.error("Falha ao salvar recomendações resolvidas no IndexedDB", error);
    throw error;
  }
}
