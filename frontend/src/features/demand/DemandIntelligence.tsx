import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SecondaryButton } from "../../components/ui/Buttons";
import { EvidencePanel } from "../real-intelligence/EvidencePanel";
import { VacancyComparison } from "./VacancyComparison";
import { useDemand } from "./useDemand";
import type { DemandSignal } from "./contracts";

const filterKeys = ["geography_id", "geography_level", "reference_period", "quality_status", "occupation_code", "occupation_system", "skill_code", "sector_code", "metric", "source_id"];
export function DemandIntelligence() {
  const { t, locale } = useLocale(); const [params, setParams] = useSearchParams();
  const query = new URLSearchParams([...params].filter(([key, value]) => filterKeys.includes(key) && value)).toString();
  const { data, coverage, failed, retry } = useDemand(query); const [selected, setSelected] = useState<DemandSignal | null>(null);
  const nf = new Intl.NumberFormat(locale);
  function change(key: string, value: string) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); }
  if (failed) return <ErrorState description={t("demand.error")} onRetry={retry} />;
  if (!data || !coverage) return <LoadingState label={t("demand.loading")} />;
  const period = coverage.options.reference_period[0];
  const total = data.items.find(r => r.geography_id === "in") ?? (data.items.length === 1 ? data.items[0] : null);
  const unassigned = data.items.filter(r => !r.geography_id);
  const source = data.sources[0];
  return <div className="demand-intelligence" data-query={query}>
    <div className="real-section-heading"><p className="demand-kicker">{t("demand.kicker")}</p><h2>{t("demand.title")}</h2><p>{t("demand.intro")}</p></div>
    <div className="real-filter-bar">
      <label>{t("real.region")}<select aria-label={t("real.region")} value={params.get("geography_id") ?? ""} onChange={e => change("geography_id", e.target.value)}><option value="">{t("demand.allRegions")}</option>{coverage.options.geographies.map(g => <option value={g.geography_id} key={g.geography_id}>{g.name}</option>)}{params.get("geography_id") && !coverage.options.geographies.some(g => g.geography_id === params.get("geography_id")) && <option value={params.get("geography_id")!}>{t("real.unavailable")}</option>}</select></label>
      <label>{t("demand.level")}<select aria-label={t("demand.level")} value={params.get("geography_level") ?? ""} onChange={e => change("geography_level", e.target.value)}><option value="">{t("demand.allLevels")}</option>{coverage.options.geography_level.map(l => <option value={l} key={l}>{t(l === "country" ? "demand.country" : l === "state" ? "demand.state" : l === "ut" ? "demand.ut" : l === "multi_state" ? "demand.multi" : "demand.unknown")}</option>)}{params.get("geography_level") === "district" && <option value="district">{t("demand.districtUnavailable")}</option>}</select></label>
      <label>{t("real.period")}<select aria-label={t("real.period")} value={params.get("reference_period") ?? period} onChange={e => change("reference_period", e.target.value)}>{coverage.options.reference_period.map(p => <option key={p}>{p}</option>)}{params.get("reference_period") && !coverage.options.reference_period.includes(params.get("reference_period")!) && <option value={params.get("reference_period")!}>{t("real.unavailable")}</option>}</select></label>
      <label>{t("demand.quality")}<select aria-label={t("demand.quality")} value={params.get("quality_status") ?? ""} onChange={e => change("quality_status", e.target.value)}><option value="">{t("demand.allQuality")}</option>{coverage.options.quality_status.map(q => <option value={q} key={q}>{t(q === "VALID" ? "demand.valid" : "demand.warning")}</option>)}</select></label>
      <SecondaryButton onClick={() => setParams(new URLSearchParams())}>{t("demand.reset")}</SecondaryButton>
    </div>
    <p className="real-context">NCS · PIB · {t("demand.asOf", { period })} · <StatusBadge kind="observed" /></p>
    <p className="demand-caveat">{t("demand.historical")}</p>
    {!data.items.length ? <EmptyState title={t("real.unavailable")} description={t("demand.empty")} /> : <>
      <div className="demand-summary">
        {total && <article className="real-metric demand-native"><div><h3>{t("demand.active")}</h3><StatusBadge kind="observed" /></div><strong>{nf.format(total.value)}</strong><p><span lang="en">{total.source_geography_label}</span> · {t("demand.vacancies")} · {period}</p><SecondaryButton onClick={() => setSelected(total)}>{t("real.evidence")}</SecondaryButton></article>}
        <div className="demand-reading"><h3>{t("demand.readingTitle")}</h3><p>{t("demand.reading")}</p><p>{t("demand.resultCount", { count: nf.format(data.total) })}</p></div>
      </div>
      <VacancyComparison rows={data.items} period={period} onEvidence={setSelected} />
      {unassigned.length > 0 && <section className="demand-unassigned"><h3>{t("demand.unassignedTitle")}</h3><p className="real-note">{t("demand.unassignedNote")}</p><ul>{unassigned.map(r => <li key={r.signal_id}><span lang="en">{r.source_geography_label}</span><strong>{nf.format(r.value)}</strong><button type="button" className="real-evidence-link" onClick={() => setSelected(r)} aria-label={`${t("real.evidence")} · ${r.source_geography_label}`}>{t("real.evidence")}</button></li>)}</ul></section>}
    </>}
    <section className="demand-foundation"><div><h3>{t("demand.mappingTitle")}</h3><p>{t("demand.taxonomyNote")}</p><dl>{(["occupation", "skill", "sector"] as const).map(key => <div key={key}><dt>{t(key === "occupation" ? "common.occupations" : key === "skill" ? "common.skills" : "common.industries")}</dt><dd>{t("real.unavailable")}</dd></div>)}</dl></div>
      <div><h3>{t("demand.qualityTitle")}</h3><p>{t("demand.qualityNote", { valid: coverage.quality.valid_records, warning: coverage.quality.warning_records })}</p><p>{t("demand.missingNote")}</p><ul>{coverage.quality.quarantined.map((r, i) => <li key={i} lang="en">{r.label}</li>)}</ul></div>
      <div><h3>{t("demand.trendTitle")}</h3><StatusBadge kind="unavailable" /><p>{t("demand.trendNote")}</p><p>{t("demand.gapNote")}</p></div>
    </section>
    <p className="real-note">{t("real.sourceLanguage")}</p>
    <Link to="/supply" className="supply-explore-link">{t("supply.supplyLink")}</Link>
    {selected && source && <EvidencePanel source={source} evidence={selected.evidence} period={`${selected.reference_period} · ${selected.source_geography_label} · ${t("demand.vacancies")}`} onClose={() => setSelected(null)} />}
  </div>;
}
