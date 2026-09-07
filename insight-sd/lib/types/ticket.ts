export type SlaStatus = "Within SLA" | "SLA Violated";

export interface Ticket {
  id: string;
  status: string;
  agent: string;
  priority: string;
  department: string | null;
  category: string | null;
  subcategory: string | null;
  item: string | null;
  subject: string | null;
  ticketType: string | null;
  group: string | null;
  origin: string | null;
  firstResponseSlaStatus: SlaStatus | null;
  resolutionSlaStatus: SlaStatus | null;
  firstResponseHours: number | null;
  resolutionHours: number | null;
  createdAt: Date | null;
  closedAt: Date | null;
  resolvedAt: Date | null;
  lastUpdatedAt: Date | null;
  dueAt: Date | null;
  satisfaction: number | null;
  requesterEmail: string | null;
  requesterName: string | null;
  isVip: boolean;
}

export interface ImportMeta {
  importedAt: Date;
  fileName: string;
  ticketCount: number;
  warningCount: number;
}
