import type { TopEntry } from "./types";

export const FALLBACK_LABEL = "Não informado";

export function topNBy<T>(items: T[], keyFn: (item: T) => string | null, n: number): TopEntry[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = keyFn(item) ?? FALLBACK_LABEL;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = items.length;
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
