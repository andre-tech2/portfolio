"use client";

import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { useTicketData } from "@/lib/context/TicketDataContext";

export function RequireData({ children }: { children: ReactNode }) {
  const { metrics, isLoading, allTicketsCount } = useTicketData();

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-[var(--text-muted)]">Carregando...</div>;
  }

  if (!metrics) {
    if (allTicketsCount > 0) {
      return (
        <div className="flex flex-1 items-center justify-center px-6 py-24 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhum chamado criado no período selecionado. Tente escolher um período maior no topo da
            página.
          </p>
        </div>
      );
    }
    return <EmptyState />;
  }

  return <>{children}</>;
}
