import type { SlaStatus } from "@/lib/types/ticket";

export interface SlaBadge {
  text: string;
  tone: "critical" | "good" | "muted";
}

/** Badge padrão pra mostrar status de SLA (1ª resposta ou resolução) num TicketListModal. */
export function slaBadge(status: SlaStatus | null): SlaBadge | null {
  if (status === "Within SLA") return { text: "Dentro do prazo", tone: "good" };
  if (status === "SLA Violated") return { text: "Fora do prazo", tone: "critical" };
  return null;
}
