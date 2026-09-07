import { get, set, del } from "idb-keyval";
import type { ImportMeta, Ticket } from "@/lib/types/ticket";

const TICKETS_KEY = "insight-sd:tickets:v1";
const META_KEY = "insight-sd:import-meta:v1";

export interface StoredData {
  tickets: Ticket[];
  meta: ImportMeta;
}

export async function saveTickets(tickets: Ticket[], meta: ImportMeta): Promise<void> {
  try {
    await set(TICKETS_KEY, tickets);
    await set(META_KEY, meta);
  } catch (error) {
    console.error("Falha ao salvar chamados no IndexedDB", error);
    throw error;
  }
}

export async function loadTickets(): Promise<StoredData | null> {
  try {
    const [tickets, meta] = await Promise.all([
      get<Ticket[]>(TICKETS_KEY),
      get<ImportMeta>(META_KEY),
    ]);
    if (!tickets || !meta) return null;
    return { tickets, meta };
  } catch (error) {
    console.error("Falha ao carregar chamados do IndexedDB", error);
    return null;
  }
}

export async function clearTickets(): Promise<void> {
  try {
    await del(TICKETS_KEY);
    await del(META_KEY);
  } catch (error) {
    console.error("Falha ao limpar chamados do IndexedDB", error);
    throw error;
  }
}
