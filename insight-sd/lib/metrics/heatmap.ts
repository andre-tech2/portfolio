import type { Ticket } from "@/lib/types/ticket";
import type { HeatmapCell } from "./types";

/** Grade completa 7 (dia da semana) x 24 (hora) de volume de chamados criados. */
export function buildHeatmap(tickets: Ticket[]): HeatmapCell[] {
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    if (!ticket.createdAt) continue;
    const weekday = ticket.createdAt.getDay();
    const hour = ticket.createdAt.getHours();
    const key = `${weekday}-${hour}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ weekday, hour, count: counts.get(`${weekday}-${hour}`) ?? 0 });
    }
  }
  return cells;
}
