import { useLocale } from "../../hooks/usePreferences";
import { getIntelligenceKinds } from "../../app/config/intelligence";
import type { IntelligenceKind } from "../../types/intelligence";

export function StatusBadge({ kind }: { kind: IntelligenceKind | "unavailable" }) {
  const { t } = useLocale();

const intelligenceKinds = getIntelligenceKinds(t);

  const status = kind === "unavailable" ? { label: t("viz.unavailable"), description: t("real.unavailableDetail") } : intelligenceKinds[kind];
  return <span className={`status-badge status-${kind}`} title={status.description}>
    <span className="status-dot" aria-hidden="true" />{status.label}
  </span>;
}
