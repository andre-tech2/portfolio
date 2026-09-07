import type { Shipment } from "@/lib/types/shipment";

export interface TopEntry {
  key: string;
  count: number;
  percentage: number;
}

export interface OnTimeOverall {
  onTime: number;
  late: number;
  unknown: number;
  percentage: number | null;
}

export interface DelayedShipment {
  id: string;
  carrier: string;
  region: string;
  status: Shipment["status"];
  delayHours: number;
  dueAt: Date;
}

export interface CarrierStat {
  carrier: string;
  volume: number;
  onTimePercentage: number | null;
  avgTransitDays: number | null;
  occurrenceCount: number;
  occurrencePercentage: number | null;
  avgFreightCost: number | null;
  delayedCount: number;
}

export interface CarrierHealthScore {
  carrier: string;
  score: number;
}

export interface RegionStat {
  region: string;
  volume: number;
  onTimePercentage: number | null;
  avgTransitDays: number | null;
  avgFreightCost: number | null;
}

export interface OccurrenceShipment {
  id: string;
  carrier: string;
  region: string;
  status: Shipment["status"];
  reason: string;
  occurredAt: Date;
  freightCost: number;
}

export interface TrendPoint {
  periodLabel: string;
  periodStart: Date;
  count: number;
  onTimePercentage: number | null;
}

export type RecommendationSeverity = "info" | "warning" | "critical";

export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  impactCount: number;
  relatedShipments?: Shipment[];
}

export interface MetricsContext {
  totalShipments: number;
  onTimeOverall: OnTimeOverall;
  avgTransitDays: number | null;
  avgFreightCost: number | null;
  inTransitCount: number;
  delayedShipments: DelayedShipment[];
  delayedTotalCount: number;
  carrierStats: CarrierStat[];
  carrierHealthScores: CarrierHealthScore[];
  regionStats: RegionStat[];
  occurrences: OccurrenceShipment[];
  occurrenceTotalCount: number;
  topOccurrenceReasons: TopEntry[];
  trend: TrendPoint[];
}
