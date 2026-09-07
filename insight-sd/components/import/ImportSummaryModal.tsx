"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ParseIssue } from "@/lib/csv/parseTickets";

interface ImportSummaryModalProps {
  ticketCount: number;
  warnings: ParseIssue[];
  onClose: () => void;
}

export function ImportSummaryModal({ ticketCount, warnings, onClose }: ImportSummaryModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Importação concluída</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {ticketCount} chamados importados
          {warnings.length > 0 ? `, ${warnings.length} avisos` : ""}.
        </p>

        {warnings.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-[var(--border-hairline)] p-3">
            <ul className="space-y-1 text-xs text-[var(--text-muted)]">
              {warnings.slice(0, 20).map((w, i) => (
                <li key={i}>
                  Ticket {w.ticketId || "?"}: {w.message}
                </li>
              ))}
              {warnings.length > 20 && <li>... e mais {warnings.length - 20} avisos</li>}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-glow-2)] px-4 py-2 text-sm font-semibold text-white"
        >
          Fechar
        </button>
      </div>
    </div>,
    document.body
  );
}
