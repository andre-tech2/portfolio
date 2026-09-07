"use client";

import { useState } from "react";
import { ImportCsvButton } from "@/components/import/ImportCsvButton";
import { ImportSummaryModal } from "@/components/import/ImportSummaryModal";
import { Logo } from "@/components/layout/Logo";
import { useTicketData } from "@/lib/context/TicketDataContext";
import type { ParseIssue } from "@/lib/csv/parseTickets";

export function EmptyState() {
  const [summary, setSummary] = useState<{ ticketCount: number; warnings: ParseIssue[] } | null>(null);
  const { restoreSampleData } = useTicketData();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="glass-card max-w-lg p-10">
        <Logo
          className="mx-auto mb-6 h-16 w-16 rounded-2xl"
          style={{ boxShadow: "0 0 40px rgba(11,31,59,0.35)" }}
        />
        <h1 className="text-2xl font-semibold">Bem-vindo ao Insight SD</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Importe o arquivo (CSV ou Excel) exportado do sistema de chamados para gerar o dashboard: visão
          geral do time, recomendações de melhoria e análise individual de agentes. Toda vez que você
          exportar um arquivo novo, é só importar de novo aqui — o dashboard atual é sempre substituído
          pelo mais recente.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <ImportCsvButton variant="primary" onImported={setSummary} />
          <button
            type="button"
            onClick={() => void restoreSampleData()}
            className="text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            Ou carregar dados de exemplo de novo
          </button>
        </div>
      </div>

      {summary && (
        <ImportSummaryModal
          ticketCount={summary.ticketCount}
          warnings={summary.warnings}
          onClose={() => setSummary(null)}
        />
      )}
    </div>
  );
}
