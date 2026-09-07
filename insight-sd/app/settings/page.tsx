"use client";

import { useState } from "react";
import { DEFAULT_PERFORMANCE_GOALS, PRIORITY_ORDER, type Priority } from "@/lib/settings/performanceGoals";
import { DEFAULT_SLA_GOALS } from "@/lib/settings/slaGoals";
import { useTicketData } from "@/lib/context/TicketDataContext";

export default function SettingsPage() {
  const { slaGoals, setSlaGoals, performanceGoals, setPerformanceGoals, restoreSampleData } = useTicketData();
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
  const [target, setTarget] = useState(String(slaGoals.target));
  const [critical, setCritical] = useState(String(slaGoals.critical));
  const [saved, setSaved] = useState(false);

  const [resolutionTargets, setResolutionTargets] = useState<Record<Priority, string>>(() => {
    const initial = {} as Record<Priority, string>;
    for (const priority of PRIORITY_ORDER) {
      initial[priority] = String(performanceGoals.resolutionHoursTargets[priority]);
    }
    return initial;
  });
  const [resolutionSaved, setResolutionSaved] = useState(false);

  const [csatTarget, setCsatTarget] = useState(String(performanceGoals.csatTarget));
  const [dailyVolumeTarget, setDailyVolumeTarget] = useState(String(performanceGoals.dailyVolumeTarget));
  const [otherGoalsSaved, setOtherGoalsSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const targetNum = Number(target);
    const criticalNum = Number(critical);
    if (Number.isNaN(targetNum) || Number.isNaN(criticalNum)) return;
    if (criticalNum >= targetNum) return;

    setSlaGoals({ target: targetNum, critical: criticalNum });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setTarget(String(DEFAULT_SLA_GOALS.target));
    setCritical(String(DEFAULT_SLA_GOALS.critical));
    setSlaGoals(DEFAULT_SLA_GOALS);
  }

  const invalid = Number(critical) >= Number(target);

  function handleSaveResolutionGoals(e: React.FormEvent) {
    e.preventDefault();
    const parsed = {} as Record<Priority, number>;
    for (const priority of PRIORITY_ORDER) {
      const num = Number(resolutionTargets[priority]);
      if (Number.isNaN(num) || num <= 0) return;
      parsed[priority] = num;
    }

    setPerformanceGoals({ ...performanceGoals, resolutionHoursTargets: parsed });
    setResolutionSaved(true);
    setTimeout(() => setResolutionSaved(false), 2000);
  }

  function handleResetResolutionGoals() {
    const reset = {} as Record<Priority, string>;
    for (const priority of PRIORITY_ORDER) {
      reset[priority] = String(DEFAULT_PERFORMANCE_GOALS.resolutionHoursTargets[priority]);
    }
    setResolutionTargets(reset);
    setPerformanceGoals({ ...performanceGoals, resolutionHoursTargets: DEFAULT_PERFORMANCE_GOALS.resolutionHoursTargets });
  }

  const resolutionInvalid = PRIORITY_ORDER.some((p) => {
    const num = Number(resolutionTargets[p]);
    return Number.isNaN(num) || num <= 0;
  });

  function handleSaveOtherGoals(e: React.FormEvent) {
    e.preventDefault();
    const csatNum = Number(csatTarget);
    const volumeNum = Number(dailyVolumeTarget);
    if (Number.isNaN(csatNum) || csatNum <= 0 || csatNum > 5) return;
    if (Number.isNaN(volumeNum) || volumeNum <= 0) return;

    setPerformanceGoals({ ...performanceGoals, csatTarget: csatNum, dailyVolumeTarget: volumeNum });
    setOtherGoalsSaved(true);
    setTimeout(() => setOtherGoalsSaved(false), 2000);
  }

  function handleResetOtherGoals() {
    setCsatTarget(String(DEFAULT_PERFORMANCE_GOALS.csatTarget));
    setDailyVolumeTarget(String(DEFAULT_PERFORMANCE_GOALS.dailyVolumeTarget));
    setPerformanceGoals({
      ...performanceGoals,
      csatTarget: DEFAULT_PERFORMANCE_GOALS.csatTarget,
      dailyVolumeTarget: DEFAULT_PERFORMANCE_GOALS.dailyVolumeTarget,
    });
  }

  const otherGoalsInvalid =
    Number.isNaN(Number(csatTarget)) ||
    Number(csatTarget) <= 0 ||
    Number(csatTarget) > 5 ||
    Number.isNaN(Number(dailyVolumeTarget)) ||
    Number(dailyVolumeTarget) <= 0;

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Ajustes que valem pra todas as páginas do app.
        </p>
      </div>

      <div className="glass-card space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dados de demonstração</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Este é um projeto de portfólio: tudo que você importar fica salvo só no seu navegador
            (IndexedDB), nunca em um servidor. Use o botão abaixo pra apagar tudo e voltar ao
            conjunto de dados de exemplo, gerado na hora.
          </p>
        </div>
        {!confirmingRestore ? (
          <button
            type="button"
            onClick={() => setConfirmingRestore(true)}
            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Restaurar dados de exemplo
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--status-warning)]">
              Isso substitui os dados atuais. Confirmar?
            </span>
            <button
              type="button"
              disabled={restoring}
              onClick={handleRestore}
              className="rounded-lg bg-[var(--status-critical)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
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

      <form onSubmit={handleSave} className="glass-card space-y-5 p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Meta de SLA</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Usada nos gauges, no ranking da equipe e nas recomendações pra decidir o que é saudável,
            alerta ou crítico.
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Meta (verde a partir de, em %)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Limiar crítico (vermelho abaixo de, em %)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={critical}
            onChange={(e) => setCritical(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        {invalid && (
          <p className="text-xs text-[var(--status-critical)]">
            O limiar crítico precisa ser menor que a meta.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={invalid}
            className="rounded-lg bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-glow-2)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            Restaurar padrão ({DEFAULT_SLA_GOALS.target}% / {DEFAULT_SLA_GOALS.critical}%)
          </button>
          {saved && <span className="text-xs text-[var(--status-good)]">Salvo.</span>}
        </div>
      </form>

      <form onSubmit={handleSaveResolutionGoals} className="glass-card space-y-5 p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Meta de tempo médio de resolução, por prioridade</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Usada na Visão Geral e no Relatório pra colorir o tempo médio de cada prioridade conforme
            bate ou não a meta dela. Valores iniciais são benchmarks comuns de mercado — ajuste pro que
            fizer sentido pra sua operação.
          </p>
        </div>

        {PRIORITY_ORDER.map((priority) => (
          <label key={priority} className="block text-sm">
            <span className="text-[var(--text-secondary)]">{priority} (em horas)</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={resolutionTargets[priority]}
              onChange={(e) => setResolutionTargets((prev) => ({ ...prev, [priority]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
            />
          </label>
        ))}

        {resolutionInvalid && (
          <p className="text-xs text-[var(--status-critical)]">Todas as metas precisam ser números maiores que zero.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={resolutionInvalid}
            className="rounded-lg bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-glow-2)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleResetResolutionGoals}
            className="text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            Restaurar padrão
          </button>
          {resolutionSaved && <span className="text-xs text-[var(--status-good)]">Salvo.</span>}
        </div>
      </form>

      <form onSubmit={handleSaveOtherGoals} className="glass-card space-y-5 p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Meta de satisfação e de volume</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Usada na Visão Geral pra colorir o CSAT e o volume diário do time conforme bate ou não a
            meta. Valores iniciais são placeholders neutros — ajuste pro que fizer sentido pra sua
            operação.
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">CSAT (nota média, de 0 a 5)</span>
          <input
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={csatTarget}
            onChange={(e) => setCsatTarget(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-[var(--text-secondary)]">Volume diário do time (chamados/dia)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={dailyVolumeTarget}
            onChange={(e) => setDailyVolumeTarget(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none"
          />
        </label>

        {otherGoalsInvalid && (
          <p className="text-xs text-[var(--status-critical)]">
            CSAT precisa estar entre 0 e 5, e o volume diário precisa ser maior que zero.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={otherGoalsInvalid}
            className="rounded-lg bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-glow-2)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleResetOtherGoals}
            className="text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            Restaurar padrão ({DEFAULT_PERFORMANCE_GOALS.csatTarget} / {DEFAULT_PERFORMANCE_GOALS.dailyVolumeTarget}/dia)
          </button>
          {otherGoalsSaved && <span className="text-xs text-[var(--status-good)]">Salvo.</span>}
        </div>
      </form>
    </div>
  );
}
