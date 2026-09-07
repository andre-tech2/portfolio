"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MissingColumnsError, UnsupportedFileError, parseTicketsFile, type ParseIssue } from "@/lib/csv/parseTickets";
import { filterTicketsByRange, type DateRangePreset } from "@/lib/dateRange";
import { buildMetricsContext } from "@/lib/metrics/buildContext";
import type { MetricsContext } from "@/lib/metrics/types";
import {
  DEFAULT_PERFORMANCE_GOALS,
  loadPerformanceGoals,
  savePerformanceGoals,
  type PerformanceGoals,
} from "@/lib/settings/performanceGoals";
import { DEFAULT_SLA_GOALS, loadSlaGoals, saveSlaGoals, type SlaGoals } from "@/lib/settings/slaGoals";
import {
  loadRecommendationResolutions,
  saveRecommendationResolutions,
  type RecommendationResolutions,
} from "@/lib/storage/recommendationStore";
import { generateSampleTickets } from "@/lib/seed/sampleTickets";
import { clearTickets, loadTickets, saveTickets } from "@/lib/storage/ticketStore";
import { filterTicketsByDomain, type TicketDomainFilter } from "@/lib/ticketDomain";
import type { ImportMeta, Ticket } from "@/lib/types/ticket";

export const DEPARTMENT_FILTER_ALL = "all";

export const DEFAULT_AGENT = "André André";

interface TicketDataContextValue {
  /** Chamados já filtrados pelo período selecionado — é isso que toda página deve consumir. */
  tickets: Ticket[];
  /** Todo o arquivo importado, sem nenhum filtro do topo (período/área/mundo) — só pra visões de histórico de longo prazo que precisam ignorar esses filtros de propósito. */
  allTickets: Ticket[];
  allTicketsCount: number;
  meta: ImportMeta | null;
  metrics: MetricsContext | null;
  isLoading: boolean;
  selectedAgent: string | null;
  setSelectedAgent: (agent: string) => void;
  dateRangePreset: DateRangePreset;
  setDateRangePreset: (preset: DateRangePreset) => void;
  availableDepartments: string[];
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedDomain: TicketDomainFilter;
  setSelectedDomain: (domain: TicketDomainFilter) => void;
  slaGoals: SlaGoals;
  setSlaGoals: (goals: SlaGoals) => void;
  performanceGoals: PerformanceGoals;
  setPerformanceGoals: (goals: PerformanceGoals) => void;
  resolvedRecommendations: RecommendationResolutions;
  resolveRecommendation: (id: string, title: string) => void;
  reopenRecommendation: (id: string) => void;
  importTickets: (file: File) => Promise<{ ticketCount: number; warnings: ParseIssue[] }>;
  clearData: () => Promise<void>;
  restoreSampleData: () => Promise<void>;
  importError: string | null;
  clearImportError: () => void;
}

const TicketDataContext = createContext<TicketDataContextValue | null>(null);

export function TicketDataProvider({ children }: { children: ReactNode }) {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<ImportMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgentState, setSelectedAgentState] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEPARTMENT_FILTER_ALL);
  const [selectedDomain, setSelectedDomain] = useState<TicketDomainFilter>("all");
  const [slaGoals, setSlaGoalsState] = useState<SlaGoals>(DEFAULT_SLA_GOALS);
  const [performanceGoals, setPerformanceGoalsState] = useState<PerformanceGoals>(DEFAULT_PERFORMANCE_GOALS);
  const [resolvedRecommendations, setResolvedRecommendations] = useState<RecommendationResolutions>({});

  const loadSample = useCallback(async () => {
    const sample = generateSampleTickets();
    const importMeta: ImportMeta = {
      importedAt: new Date(),
      fileName: "dados-de-exemplo.csv",
      ticketCount: sample.length,
      warningCount: 0,
    };
    await saveTickets(sample, importMeta);
    setAllTickets(sample);
    setMeta(importMeta);
  }, []);

  const restoreSampleData = useCallback(async () => {
    await loadSample();
  }, [loadSample]);

  useEffect(() => {
    let cancelled = false;
    loadTickets().then(async (stored) => {
      if (cancelled) return;
      if (stored) {
        setAllTickets(stored.tickets);
        setMeta(stored.meta);
        setIsLoading(false);
        return;
      }
      // Primeira visita: nunca importou nada — carrega um conjunto de exemplo pra não abrir vazio.
      await loadSample();
      if (!cancelled) setIsLoading(false);
    });
    loadSlaGoals().then((goals) => {
      if (!cancelled) setSlaGoalsState(goals);
    });
    loadPerformanceGoals().then((goals) => {
      if (!cancelled) setPerformanceGoalsState(goals);
    });
    loadRecommendationResolutions().then((resolutions) => {
      if (!cancelled) setResolvedRecommendations(resolutions);
    });
    return () => {
      cancelled = true;
    };
  }, [loadSample]);

  const setSlaGoals = useCallback((goals: SlaGoals) => {
    setSlaGoalsState(goals);
    void saveSlaGoals(goals);
  }, []);

  const setPerformanceGoals = useCallback((goals: PerformanceGoals) => {
    setPerformanceGoalsState(goals);
    void savePerformanceGoals(goals);
  }, []);

  const resolveRecommendation = useCallback((id: string, title: string) => {
    setResolvedRecommendations((prev) => {
      const next = { ...prev, [id]: { title, resolvedAt: new Date() } };
      void saveRecommendationResolutions(next);
      return next;
    });
  }, []);

  const reopenRecommendation = useCallback((id: string) => {
    setResolvedRecommendations((prev) => {
      const next = { ...prev };
      delete next[id];
      void saveRecommendationResolutions(next);
      return next;
    });
  }, []);

  const latestTicketDate = useMemo(() => {
    let latest: Date | null = null;
    for (const t of allTickets) {
      if (t.createdAt && (!latest || t.createdAt > latest)) latest = t.createdAt;
    }
    return latest;
  }, [allTickets]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTickets) {
      if (t.department) set.add(t.department);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [allTickets]);

  const tickets = useMemo(() => {
    const byRange = filterTicketsByRange(allTickets, dateRangePreset, latestTicketDate);
    const byDepartment =
      selectedDepartment === DEPARTMENT_FILTER_ALL
        ? byRange
        : byRange.filter((t) => t.department === selectedDepartment);
    return filterTicketsByDomain(byDepartment, selectedDomain);
  }, [allTickets, dateRangePreset, latestTicketDate, selectedDepartment, selectedDomain]);

  const metrics = useMemo(() => (tickets.length > 0 ? buildMetricsContext(tickets) : null), [tickets]);

  // Deriva o agente efetivo em vez de sincronizar via effect: evita que a
  // seleção do usuário e a mudança de dataset (novo import) briguem por quem
  // manda no estado. Se a escolha do usuário não existir mais no dataset
  // atual, cai pro agente padrão (André) e, na falta dele, pro de maior volume.
  const selectedAgent = useMemo(() => {
    if (!metrics || metrics.agentStats.length === 0) return null;
    if (selectedAgentState && metrics.agentStats.some((a) => a.agent === selectedAgentState)) {
      return selectedAgentState;
    }
    const defaultExists = metrics.agentStats.some((a) => a.agent === DEFAULT_AGENT);
    return defaultExists ? DEFAULT_AGENT : metrics.agentStats[0].agent;
  }, [metrics, selectedAgentState]);

  const setSelectedAgent = useCallback((agent: string) => {
    setSelectedAgentState(agent);
  }, []);

  const importTickets = useCallback(async (file: File) => {
    setImportError(null);
    try {
      const { tickets: parsedTickets, issues } = await parseTicketsFile(file);
      const importMeta: ImportMeta = {
        importedAt: new Date(),
        fileName: file.name,
        ticketCount: parsedTickets.length,
        warningCount: issues.length,
      };

      await saveTickets(parsedTickets, importMeta);
      setAllTickets(parsedTickets);
      setMeta(importMeta);

      return { ticketCount: parsedTickets.length, warnings: issues };
    } catch (error) {
      const message =
        error instanceof MissingColumnsError || error instanceof UnsupportedFileError
          ? error.message
          : "Não foi possível ler esse arquivo. Confirme que é um CSV ou Excel (.xlsx/.xls/.xlsm) exportado do sistema de chamados.";
      setImportError(message);
      throw error;
    }
  }, []);

  const clearData = useCallback(async () => {
    await clearTickets();
    setAllTickets([]);
    setMeta(null);
    setSelectedAgentState(null);
    setSelectedDepartment(DEPARTMENT_FILTER_ALL);
    setSelectedDomain("all");
  }, []);

  const clearImportError = useCallback(() => setImportError(null), []);

  const value: TicketDataContextValue = {
    tickets,
    allTickets,
    allTicketsCount: allTickets.length,
    meta,
    metrics,
    isLoading,
    selectedAgent,
    setSelectedAgent,
    dateRangePreset,
    setDateRangePreset,
    availableDepartments,
    selectedDepartment,
    setSelectedDepartment,
    selectedDomain,
    setSelectedDomain,
    slaGoals,
    setSlaGoals,
    performanceGoals,
    setPerformanceGoals,
    resolvedRecommendations,
    resolveRecommendation,
    reopenRecommendation,
    importTickets,
    clearData,
    restoreSampleData,
    importError,
    clearImportError,
  };

  return <TicketDataContext.Provider value={value}>{children}</TicketDataContext.Provider>;
}

export function useTicketData(): TicketDataContextValue {
  const ctx = useContext(TicketDataContext);
  if (!ctx) throw new Error("useTicketData deve ser usado dentro de TicketDataProvider");
  return ctx;
}
