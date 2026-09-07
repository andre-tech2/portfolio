/** Formata horas em minutos/horas/dias — dias sempre arredondados, sem casa decimal quebrada. */
export function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours / 24)} dias`;
}
