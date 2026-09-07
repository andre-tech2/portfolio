"use client";

import { useState } from "react";
import { DEFAULT_DELIVERY_GOALS } from "@/lib/settings/deliveryGoals";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

export default function SettingsPage() {
  const { deliveryGoals, setDeliveryGoals, restoreSampleData } = useShipmentData();
  const [confirmingRestore, setConfirmingRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      await restoreSampleData();
      setConfirmingRestore(false);
    } finally {
      setRestoring(false);
    }
  }

  const [onTimeTarget, setOnTimeTarget] = useState(String(deliveryGoals.onTimeTarget));
  const [onTimeCritical, setOnTimeCritical] = useState(String(deliveryGoals.onTimeCritical));
  const [occurrenceWarning, setOccurrenceWarning] = useState(String(deliveryGoals.occurrenceWarning));
  const [saved, setSaved] = useState(false);

  const invalid =
    Number.isNaN(Number(onTimeTarget)) ||
    Number.isNaN(Number(onTimeCritical)) ||
    Number.isNaN(Number(occurrenceWarning)) ||
    Number(onTimeCritical) >= Number(onTimeTarget);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    setDeliveryGoals({
      onTimeTarget: Number(onTimeTarget),
      onTimeCritical: Number(onTimeCritical),
      occurrenceWarning: Number(occurrenceWarning),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setOnTimeTarget(String(DEFAULT_DELIVERY_GOALS.onTimeTarget));
    setOnTimeCritical(String(DEFAULT_DELIVERY_GOALS.onTimeCritical));
    setOccurrenceWarning(String(DEFAULT_DELIVERY_GOALS.occurrenceWarning));
    setDeliveryGoals(DEFAULT_DELIVERY_GOALS);
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Ajustes que valem pra todas as páginas do app.</p>
      </div>

      <div className="solid-card space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dados de demonstração</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Este é um projeto de portfólio: os dados são sempre sintéticos e ficam salvos só no seu navegador
            (IndexedDB), nunca em um servidor. Use o botão abaixo pra gerar um novo conjunto de exemplo.
          </p>
        </div>
        {!confirmingRestore ? (
          <button
            type="button"
            onClick={() => setConfirmingRestore(true)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Restaurar dados de exemplo
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--status-warning)]">Isso substitui os dados atuais. Confirmar?</span>
            <button
              type="button"
              disabled={restoring}
              onClick={handleRestore}
              className="rounded-md bg-[var(--status-critical)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {restoring ? "Restaurando…" : "Sim, restaurar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRestore(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="solid-card space-y-5 p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Metas de entrega</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Usadas no ranking de transportadoras, em Regiões e nas Recomendações pra decidir o que é saudável,
            alerta ou crítico.
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">% no prazo — meta (verde a partir de)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={onTimeTarget}
            onChange={(e) => setOnTimeTarget(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">% no prazo — limiar crítico (vermelho abaixo de)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={onTimeCritical}
            onChange={(e) => setOnTimeCritical(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Taxa de ocorrência — alerta a partir de (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={occurrenceWarning}
            onChange={(e) => setOccurrenceWarning(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        {invalid && (
          <p className="text-xs text-[var(--status-critical)]">
            O limiar crítico precisa ser menor que a meta, e os valores precisam ser números válidos.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={invalid}
            className="rounded-md bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            Restaurar padrão
          </button>
          {saved && <span className="text-xs text-[var(--status-good)]">Salvo.</span>}
        </div>
      </form>
    </div>
  );
}
