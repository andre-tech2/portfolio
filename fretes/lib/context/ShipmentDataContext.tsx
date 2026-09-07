"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { filterShipmentsByRange, type DateRangePreset } from "@/lib/dateRange";
import { buildMetricsContext } from "@/lib/metrics/buildContext";
import type { MetricsContext } from "@/lib/metrics/types";
import { generateSampleShipments } from "@/lib/seed/sampleShipments";
import {
  DEFAULT_DELIVERY_GOALS,
  loadDeliveryGoals,
  saveDeliveryGoals,
  type DeliveryGoals,
} from "@/lib/settings/deliveryGoals";
import { loadShipments, saveShipments } from "@/lib/storage/shipmentStore";
import type { ImportMeta, Shipment } from "@/lib/types/shipment";

export const REGION_FILTER_ALL = "all";

interface ShipmentDataContextValue {
  /** Envios já filtrados pelo período e pela região selecionados — é isso que toda página deve consumir. */
  shipments: Shipment[];
  allShipmentsCount: number;
  meta: ImportMeta | null;
  metrics: MetricsContext | null;
  isLoading: boolean;
  dateRangePreset: DateRangePreset;
  setDateRangePreset: (preset: DateRangePreset) => void;
  availableRegions: string[];
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  deliveryGoals: DeliveryGoals;
  setDeliveryGoals: (goals: DeliveryGoals) => void;
  restoreSampleData: () => Promise<void>;
}

const ShipmentDataContext = createContext<ShipmentDataContextValue | null>(null);

export function ShipmentDataProvider({ children }: { children: ReactNode }) {
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [meta, setMeta] = useState<ImportMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("30d");
  const [selectedRegion, setSelectedRegion] = useState<string>(REGION_FILTER_ALL);
  const [deliveryGoals, setDeliveryGoalsState] = useState<DeliveryGoals>(DEFAULT_DELIVERY_GOALS);

  const loadSample = useCallback(async () => {
    const sample = generateSampleShipments();
    const importMeta: ImportMeta = { importedAt: new Date(), shipmentCount: sample.length };
    await saveShipments(sample, importMeta);
    setAllShipments(sample);
    setMeta(importMeta);
  }, []);

  const restoreSampleData = useCallback(async () => {
    await loadSample();
  }, [loadSample]);

  useEffect(() => {
    let cancelled = false;
    loadShipments().then(async (stored) => {
      if (cancelled) return;
      if (stored) {
        setAllShipments(stored.shipments);
        setMeta(stored.meta);
        setIsLoading(false);
        return;
      }
      await loadSample();
      if (!cancelled) setIsLoading(false);
    });
    loadDeliveryGoals().then((goals) => {
      if (!cancelled) setDeliveryGoalsState(goals);
    });
    return () => {
      cancelled = true;
    };
  }, [loadSample]);

  const setDeliveryGoals = useCallback((goals: DeliveryGoals) => {
    setDeliveryGoalsState(goals);
    void saveDeliveryGoals(goals);
  }, []);

  const latestShipmentDate = useMemo(() => {
    let latest: Date | null = null;
    for (const s of allShipments) {
      if (!latest || s.shippedAt > latest) latest = s.shippedAt;
    }
    return latest;
  }, [allShipments]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    for (const s of allShipments) set.add(s.region);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [allShipments]);

  const shipments = useMemo(() => {
    const byRange = filterShipmentsByRange(allShipments, dateRangePreset, latestShipmentDate);
    return selectedRegion === REGION_FILTER_ALL ? byRange : byRange.filter((s) => s.region === selectedRegion);
  }, [allShipments, dateRangePreset, latestShipmentDate, selectedRegion]);

  const metrics = useMemo(() => (shipments.length > 0 ? buildMetricsContext(shipments) : null), [shipments]);

  const value: ShipmentDataContextValue = {
    shipments,
    allShipmentsCount: allShipments.length,
    meta,
    metrics,
    isLoading,
    dateRangePreset,
    setDateRangePreset,
    availableRegions,
    selectedRegion,
    setSelectedRegion,
    deliveryGoals,
    setDeliveryGoals,
    restoreSampleData,
  };

  return <ShipmentDataContext.Provider value={value}>{children}</ShipmentDataContext.Provider>;
}

export function useShipmentData(): ShipmentDataContextValue {
  const ctx = useContext(ShipmentDataContext);
  if (!ctx) throw new Error("useShipmentData deve ser usado dentro de ShipmentDataProvider");
  return ctx;
}
