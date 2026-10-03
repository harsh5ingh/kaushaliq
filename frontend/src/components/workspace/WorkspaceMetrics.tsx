import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useLocale } from "../../hooks/usePreferences";
import type { MessageKey } from "../../app/i18n/config";
export function WorkspaceMetrics({ items }: { items: readonly { label: MessageKey; value: number | string; note?: MessageKey; tone?: "positive" | "negative" | "neutral" }[] }) {
  const { t } = useLocale();
  return <div className="workspace-metrics">{items.map(item => <article className="workspace-metric" key={item.label}>
    <p>{t(item.label)}</p><strong>{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</strong>
    {item.note && <small>{t(item.note)}</small>}
    {item.tone && <span className={`metric-tone ${item.tone}`} aria-label={t(item.tone === "positive" ? "workspace.directionUp" : item.tone === "negative" ? "workspace.directionDown" : "workspace.directionNeutral")}>
      {item.tone === "positive" ? <ArrowUpRight size={15} /> : item.tone === "negative" ? <ArrowDownRight size={15} /> : <Minus size={15} />}
      {t("workspace.simulated")}
    </span>}
  </article>)}</div>;
}
