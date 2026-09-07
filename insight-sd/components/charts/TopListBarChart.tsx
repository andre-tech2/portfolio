import { HorizontalBarList } from "./HorizontalBarList";
import type { TopEntry } from "@/lib/metrics/types";

export function TopListBarChart({ data, onSelect }: { data: TopEntry[]; onSelect?: (key: string) => void }) {
  return <HorizontalBarList data={data} color="var(--series-1)" onSelect={onSelect} />;
}
