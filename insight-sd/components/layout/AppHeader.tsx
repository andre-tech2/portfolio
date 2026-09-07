"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AgentSelector } from "./AgentSelector";
import { DateRangeSelector } from "./DateRangeSelector";
import { DepartmentSelector } from "./DepartmentSelector";
import { DomainSelector } from "./DomainSelector";
import { Logo } from "./Logo";
import { ImportCsvButton } from "@/components/import/ImportCsvButton";
import { ImportSummaryModal } from "@/components/import/ImportSummaryModal";
import { useTicketData } from "@/lib/context/TicketDataContext";
import type { ParseIssue } from "@/lib/csv/parseTickets";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/overview", label: "Visão Geral" },
  { href: "/team", label: "Equipe" },
  { href: "/critical", label: "Crítico Agora" },
  { href: "/recommendations", label: "Recomendações" },
  { href: "/agents/overview", label: "Agente · Indicadores" },
  { href: "/agents/trends", label: "Agente · Tendências" },
  { href: "/report", label: "Relatório" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { metrics, meta, allTicketsCount, dateRangePreset, clearData } = useTicketData();
  const [summary, setSummary] = useState<{ ticketCount: number; warnings: ParseIssue[] } | null>(null);
  const [theme, setThemeState] = useState<Theme>("light");
  const isAgentPage = pathname?.startsWith("/agents") ?? false;

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <header className="no-print sticky top-0 z-40 bg-[#461CDC]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 rounded-lg" style={{ boxShadow: "0 0 20px rgba(0,0,0,0.35)" }} />
          <div>
            <p className="text-sm font-bold tracking-wide text-white">
              INSIGHT SD{" "}
              <a
                href="https://www.linkedin.com/in/andrelsandre"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-normal tracking-normal text-white/60 hover:text-white hover:underline"
              >
                por André André
              </a>
            </p>
            {meta && (
              <p className="text-[11px] text-white/70">
                {dateRangePreset === "all"
                  ? `${meta.ticketCount} chamados`
                  : `${metrics?.totalTickets ?? 0} de ${allTicketsCount} chamados`}{" "}
                · importado {meta.importedAt.toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        {allTicketsCount > 0 && (
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {allTicketsCount > 0 && <DomainSelector />}
          {allTicketsCount > 0 && <DepartmentSelector />}
          {allTicketsCount > 0 && <DateRangeSelector />}
          {isAgentPage && metrics && <AgentSelector />}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
            className="rounded-lg p-2 text-lg leading-none text-white/70 transition-colors hover:text-white"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <Link
            href="/settings"
            title="Configurações"
            aria-label="Configurações"
            className={`rounded-lg p-2 text-lg leading-none transition-colors ${
              pathname === "/settings" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            ⚙
          </Link>
          {allTicketsCount > 0 && <ImportCsvButton variant="header" onImported={setSummary} />}
          {allTicketsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Limpar todos os dados importados?")) void clearData();
              }}
              className="text-xs text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              Limpar dados
            </button>
          )}
        </div>
      </div>

      {summary && (
        <ImportSummaryModal
          ticketCount={summary.ticketCount}
          warnings={summary.warnings}
          onClose={() => setSummary(null)}
        />
      )}
    </header>
  );
}
