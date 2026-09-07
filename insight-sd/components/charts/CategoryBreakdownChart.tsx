import { HorizontalBarList } from "./HorizontalBarList";
import type { TopEntry } from "@/lib/metrics/types";

/** Mesmo componente de barras horizontais, mas com a cor "violeta" reservada
 * pras seções específicas do agente selecionado — reforça que é um recorte
 * individual, não o time todo. */
export function CategoryBreakdownChart({
  data,
  onSelect,
}: {
  data: TopEntry[];
  onSelect?: (key: string) => void;
}) {
  return <HorizontalBarList data={data} color="var(--series-7)" onSelect={onSelect} />;
}
