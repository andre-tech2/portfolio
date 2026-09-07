import type { Ticket } from "@/lib/types/ticket";
import type { SlaOverall } from "./types";

function summarize(tickets: Ticket[], statusFn: (t: Ticket) => "Within SLA" | "SLA Violated" | null) {
  let withinSla = 0;
  let violated = 0;
  let unknown = 0;

  for (const ticket of tickets) {
    const status = statusFn(ticket);
    if (status === "Within SLA") withinSla++;
    else if (status === "SLA Violated") violated++;
    else unknown++;
  }

  const known = withinSla + violated;
  const percentage = known > 0 ? (withinSla / known) * 100 : null;
  return { withinSla, violated, unknown, percentage };
}

export function buildSlaOverall(tickets: Ticket[]): SlaOverall {
  return {
    firstResponse: summarize(tickets, (t) => t.firstResponseSlaStatus),
    resolution: summarize(tickets, (t) => t.resolutionSlaStatus),
  };
}
