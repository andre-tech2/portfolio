import { get, set, del } from "idb-keyval";
import type { ImportMeta, Shipment } from "@/lib/types/shipment";

const SHIPMENTS_KEY = "fretes:shipments:v1";
const META_KEY = "fretes:meta:v1";

export interface StoredData {
  shipments: Shipment[];
  meta: ImportMeta;
}

export async function saveShipments(shipments: Shipment[], meta: ImportMeta): Promise<void> {
  try {
    await set(SHIPMENTS_KEY, shipments);
    await set(META_KEY, meta);
  } catch (error) {
    console.error("Falha ao salvar envios no IndexedDB", error);
    throw error;
  }
}

export async function loadShipments(): Promise<StoredData | null> {
  try {
    const [shipments, meta] = await Promise.all([
      get<Shipment[]>(SHIPMENTS_KEY),
      get<ImportMeta>(META_KEY),
    ]);
    if (!shipments || !meta) return null;
    return { shipments, meta };
  } catch (error) {
    console.error("Falha ao carregar envios do IndexedDB", error);
    return null;
  }
}

export async function clearShipments(): Promise<void> {
  try {
    await del(SHIPMENTS_KEY);
    await del(META_KEY);
  } catch (error) {
    console.error("Falha ao limpar envios do IndexedDB", error);
    throw error;
  }
}
