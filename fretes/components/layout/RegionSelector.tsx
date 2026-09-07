"use client";

import { REGION_FILTER_ALL, useShipmentData } from "@/lib/context/ShipmentDataContext";

export function RegionSelector() {
  const { availableRegions, selectedRegion, setSelectedRegion } = useShipmentData();

  if (availableRegions.length === 0) return null;

  return (
    <select
      value={selectedRegion}
      onChange={(e) => setSelectedRegion(e.target.value)}
      className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
      title="Região (UF) considerada em todas as páginas"
    >
      <option value={REGION_FILTER_ALL}>Todas as regiões</option>
      {availableRegions.map((region) => (
        <option key={region} value={region}>
          {region}
        </option>
      ))}
    </select>
  );
}
