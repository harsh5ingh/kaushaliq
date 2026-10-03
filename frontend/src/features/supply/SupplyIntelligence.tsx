import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SecondaryButton } from "../../components/ui/Buttons";
import { EvidencePanel } from "../real-intelligence/EvidencePanel";
import { useSupply } from "./useSupply";
import { TaxonomyDesk, type SelectedEvidence } from "./TaxonomyDesk";
import { ReadinessPanel } from "./ReadinessPanel";
import type { SupplySignal, TrainingMetric } from "./contracts";
import type { MessageKey } from "../../app/i18n/config";
const keys = ["metric", "geography_id", "geography_level", "reference_period", "occupation_code", "skill_code", "qualification_code", "sector_code", "source_id", "quality_status"];
export function SupplyIntelligence() {
  const { t, locale } = useLocale(); const [params, setParams] = useSearchParams(); const [selected, setSelected] = useState<SelectedEvidence | null>(null);
  const metric = params.get("metric") ?? "TRAINED", geography = params.has("geography_id") ? params.get("geography_id")! : "in";
  const filters = new URLSearchParams([...params].filter(([k, v]) => keys.includes(k) && v)); if (!params.has("metric")) filters.set("metric", metric); if (!params.has("geography_id")) filters.set("geography_id", geography);
  const query = filters.toString(), { data, coverage, compatibility, failed, retry } = useSupply(query), nf = new Intl.NumberFormat(locale);
  function change(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); if (key === "metric") { next.delete("reference_period"); if (value === "TRAINING_CENTRES" && geography === "in") next.set("geography_id", "in-andhra-pradesh"); } setParams(next); }
  if (failed) return <ErrorState description={t("supply.error")} onRetry={retry} />;
  if (!data || !coverage || !compatibility) return <LoadingState label={t("supply.loading")} />;
  const dimensions = coverage.options.metric_dimensions[metric as TrainingMetric], rows = [...data.items].sort((a, b) => a.period_start.localeCompare(b.period_start) || a.source_geography_label.localeCompare(b.source_geography_label));
  const latest = [...rows].reverse().find(r => !r.partial), featured = geography ? latest : null;
  function evidence(row: SupplySignal) { const source = data!.sources.find(s => s.source_id === row.source_id); if (source) setSelected({ evidence: row.evidence, period: `${row.reference_period} · ${row.source_geography_label} · ${t(`supply.${row.metric}`)}`, source }); }
  return <div className="supply-intelligence" data-query={query}><div className="real-section-heading"><p className="demand-kicker">{t("supply.kicker")}</p><h2>{t("supply.title")}</h2><p>{t("supply.intro")}</p></div>
    <div className="real-filter-bar"><label>{t("supply.metric")}<select aria-label={t("supply.metric")} value={metric} onChange={e => change("metric", e.target.value)}>{coverage.options.metric.map(m => <option key={m} value={m}>{t(`supply.${m}`)}</option>)}{!coverage.options.metric.includes(metric as TrainingMetric) && <option value={metric}>{t("real.unavailable")}</option>}</select></label>
      <label>{t("real.region")}<select aria-label={t("real.region")} value={geography} onChange={e => change("geography_id", e.target.value)}><option value="">{t("supply.allRegions")}</option>{coverage.options.geographies.map(g => <option key={g.geography_id} value={g.geography_id}>{g.name}{!dimensions?.geographies.includes(g.geography_id) ? ` · ${t("supply.referenceOnly")}` : ""}</option>)}{geography && !coverage.options.geographies.some(g => g.geography_id === geography) && <option value={geography}>{t("real.unavailable")}</option>}</select></label>
      <label>{t("real.period")}<select aria-label={t("real.period")} value={params.get("reference_period") ?? ""} onChange={e => change("reference_period", e.target.value)}><option value="">{t("supply.allPeriods")}</option>{dimensions?.periods.map(p => <option value={p} key={p}>{p}</option>)}{params.get("reference_period") && !dimensions?.periods.includes(params.get("reference_period")!) && <option value={params.get("reference_period")!}>{t("real.unavailable")}</option>}</select></label>
      <SecondaryButton onClick={() => setParams({})}>{t("supply.reset")}</SecondaryButton></div><p className="demand-caveat">{t("supply.caveat")}</p>
    {!rows.length ? <EmptyState compact title={t("real.unavailable")} description={t("supply.empty")} /> : <><div className="supply-observation-heading"><div><h3>{t(metric === "TRAINING_CENTRES" ? "supply.infrastructure" : "supply.output")}</h3><p className="real-note">{t("supply.count", { count: nf.format(data.total) })}</p></div><StatusBadge kind="observed" /></div>
      {featured && <article className="supply-observation"><div><p>{t("supply.latest")}</p><h3>{t(`supply.${featured.metric}`)}</h3><strong>{nf.format(featured.value)}</strong></div><div><p><span lang="en">{featured.source_geography_label}</span> · {featured.reference_period}</p><p>{t(featured.unit === "centres" ? "supply.centres" : "supply.persons")} · PMKVY</p><button type="button" className="real-evidence-link" onClick={() => evidence(featured)}>{t("real.evidence")}</button></div></article>}
      <div className="real-table-wrap" tabIndex={0} role="region" aria-label={t("supply.table")}><table className="supply-observation-table"><caption>{t("supply.table")} · PMKVY</caption><thead><tr><th>{t("real.region")}</th><th>{t("real.period")}</th><th>{t("supply.metric")}</th><th>{t(metric === "TRAINING_CENTRES" ? "supply.centres" : "supply.persons")}</th><th>{t("supply.raw")}</th><th>{t("real.evidence")}</th></tr></thead><tbody>{rows.map(r => <tr key={r.supply_signal_id}><th scope="row" lang="en">{r.source_geography_label}</th><td>{r.reference_period}{r.partial && <small>{t("supply.partial")}</small>}</td><td>{t(`supply.${r.metric}`)}<small>{t(r.unit === "centres" ? "supply.centres" : "supply.persons")}</small></td><td>{nf.format(r.value)}</td><td>{r.original_value}</td><td><button className="real-evidence-link" type="button" aria-label={`${t("real.evidence")} · ${r.source_geography_label} · ${r.reference_period}`} onClick={() => evidence(r)}>{t("real.evidence")}</button></td></tr>)}</tbody></table></div></>}
    <section className="supply-coverage"><h2>{t("supply.coverage")}</h2><div className="real-table-wrap" tabIndex={0} role="region" aria-label={t("supply.coverage")}><table><caption>{t("supply.coverage")}</caption><thead><tr><th>{t("supply.metric")}</th><th>{t("supply.national")}</th><th>{t("supply.states")}</th><th>{t("supply.district")}</th></tr></thead><tbody>{coverage.items.map(c => <tr key={c.dimension}><th scope="row">{t(`supply.${c.dimension}` as MessageKey)}<small>{t(`supply.${c.status}` as MessageKey)}</small></th><td>{c.national ? nf.format(c.national) : t("supply.UNAVAILABLE")}</td><td>{c.state_ut ? nf.format(c.state_ut) : t("supply.UNAVAILABLE")}</td><td>{t("supply.UNAVAILABLE")}</td></tr>)}</tbody></table></div><p className="real-note">{t("supply.capacityNote")}</p></section>
    <section className="supply-quality"><h2>{t("supply.quality")}</h2><p>{t("supply.quarantine")}</p><p>{t("supply.missing")}</p></section>
    <ReadinessPanel data={compatibility} onEvidence={setSelected} /><TaxonomyDesk version={data.version} onEvidence={setSelected} />
    <p className="real-note">{t("real.sourceLanguage")}</p><Link className="supply-explore-link" to="/demand">{t("supply.demandLink")}</Link>
    {selected && <EvidencePanel {...selected} onClose={() => setSelected(null)} />}
  </div>;
}
