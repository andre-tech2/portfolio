import type { HeatmapCell } from "@/lib/metrics/types";

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function intensityFor(count: number, maxCount: number): number {
  return count === 0 ? 0 : 0.12 + 0.78 * (count / maxCount);
}

interface ActivityHeatmapProps {
  data: HeatmapCell[];
  onSelect?: (weekday: number, hour: number) => void;
}

export function ActivityHeatmap({ data, onSelect }: ActivityHeatmapProps) {
  const maxCount = Math.max(1, ...data.map((c) => c.count));

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] flex-col gap-1">
          <div className="flex gap-1 pl-10">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="flex-1 text-center text-[9px] text-[var(--text-muted)]">
                {hour % 3 === 0 ? hour : ""}
              </div>
            ))}
          </div>
          {WEEKDAY_LABELS.map((label, weekday) => (
            <div key={weekday} className="flex items-center gap-1">
              <div className="w-9 shrink-0 text-[10px] text-[var(--text-muted)]">{label}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = data.find((c) => c.weekday === weekday && c.hour === hour);
                const count = cell?.count ?? 0;
                const intensity = intensityFor(count, maxCount);
                return (
                  <div
                    key={hour}
                    title={`${label} ${String(hour).padStart(2, "0")}h — ${count} chamado${count === 1 ? "" : "s"}`}
                    onClick={onSelect && count > 0 ? () => onSelect(weekday, hour) : undefined}
                    className={`h-6 flex-1 rounded-sm ${onSelect && count > 0 ? "cursor-pointer" : ""}`}
                    style={{ background: `rgba(57, 135, 229, ${intensity})` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-[var(--text-muted)]">
        <span>Menos chamados</span>
        <div
          className="h-3 w-24 rounded-sm"
          style={{
            background: `linear-gradient(to right, rgba(57, 135, 229, ${intensityFor(1, 10)}), rgba(57, 135, 229, 0.9))`,
          }}
        />
        <span>Mais chamados</span>
      </div>
    </div>
  );
}
