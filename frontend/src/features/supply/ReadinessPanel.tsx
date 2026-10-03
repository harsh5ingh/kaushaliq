import { useLocale } from "../../hooks/usePreferences";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { Compatibility } from "./contracts";
import type { MessageKey } from "../../app/i18n/config";
import type { SelectedEvidence } from "./TaxonomyDesk";
const dimensionKeys: Record<string, MessageKey> = { geography: "supply.geography", time: "supply.time", occupation: "supply.occupation", skill: "supply.skill", sector: "supply.sector", unit: "supply.unit", metric: "supply.metricSemantics", quality: "supply.qualityDimension", source: "supply.source", mapping: "supply.mapping" };
export function ReadinessPanel({ data, onEvidence }: { data: Compatibility; onEvidence: (selection: SelectedEvidence) => void }) {
  const { t } = useLocale();
  return <section className="supply-readiness" aria-labelledby="readiness-title"><header><h2 id="readiness-title">{t("supply.readiness")}</h2><StatusBadge kind="unavailable" /></header><h3>{t("supply.notReady")}</h3><p className="real-note">{t("supply.comparisonNote")}</p>
    <dl className="supply-checks">{data.checks.map(c => <div key={c.dimension}><dt>{t(dimensionKeys[c.dimension] ?? "supply.mapping")}</dt><dd><span>{t(`supply.${c.status}` as MessageKey)}</span><small>{t(`supply.${c.reason_code}` as MessageKey)}</small></dd></div>)}</dl>
    <p className="supply-gap-state">{t("supply.gap")}</p><div className="supply-evidence-actions">{([data.demand, data.supply] as const).map((r, i) => r && <button className="real-evidence-link" type="button" key={i} onClick={() => { const source = data.sources.find(s => s.source_id === r.evidence.source_id); if (source) onEvidence({ evidence: r.evidence, period: r.reference_period, source }); }}>{t("real.evidence")} · {i === 0 ? "NCS" : "PMKVY"} · {r.reference_period}</button>)}</div>
  </section>;
}
