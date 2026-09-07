/**
 * As colunas "(em horas)" do export vêm formatadas como duração "HH:MM:SS"
 * (ex: "15:33:26"), não como número decimal. H pode passar de 23 em tickets
 * que levaram vários dias — não é hora do relógio.
 */
export function parseDurationToHours(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const parts = trimmed.split(":");
  if (parts.length !== 3) return null;

  const [h, m, s] = parts.map(Number);
  if ([h, m, s].some((n) => Number.isNaN(n))) return null;

  return h + m / 60 + s / 3600;
}
