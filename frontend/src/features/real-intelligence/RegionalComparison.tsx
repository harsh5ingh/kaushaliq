import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { api } from "../../services/api";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { VisualizationFrame } from "../../components/visualization/VisualizationFrame";
import { UnavailableIntelligence } from "../../components/visualization/UnavailableIntelligence";
import { useIntelligenceData } from "./dataContext";
import { decodeLabour, type LabourObservation } from "./contracts";
import { EvidencePanel } from "./EvidencePanel";

/** Same source slice across states. Sorting preserves observations and creates no new index. */
export function RegionalComparison() {
  const { t, locale } = useLocale(); const { catalog } = useIntelligenceData(); const [params] = useSearchParams();
  const period = params.get("period") || "2023-24", sex = params.get("sex") || "persons", sector = params.get("sector") || "combined", activity = params.get("activity") || "US";
  const [indicator, setIndicator] = useState<LabourObservation["indicator"]>("LFPR");
  const [order, setOrder] = useState("descending"); const [attempt, retry] = useState(0);
  const regions = catalog?.regions.filter(region => region.region_type !== "country") ?? [];
  const key = `${period}:${sex}:${sector}:${activity}:${indicator}:${attempt}`;
  const [result, setResult] = useState<{ key: string; rows: LabourObservation[]; missing: string[]; error: boolean } | null>(null);
  const [evidence, setEvidence] = useState<LabourObservation | null>(null);
  useEffect(() => {
    if (!catalog) return;
    const controller = new AbortController();
    // Only one published state period/status exists. Do not imply requests manufacture history.
    if (period !== "2023-24" || activity !== "US") { queueMicrotask(() => setResult({ key, rows: [], missing: [], error: false })); return () => controller.abort(); }
    Promise.all(catalog.regions.filter(region => region.region_type !== "country").map(async region => {
      const query = new URLSearchParams({ region_id: region.region_id, period, sex, sector, activity_status: activity, indicator });
      const response = await api.get(`/v1/labour?${query}`, decodeLabour, controller.signal);
      return { id: region.region_id, rows: response.items };
    })).then(responses => {
      if (!controller.signal.aborted) setResult({ key, rows: responses.flatMap(response => response.rows), missing: responses.filter(response => !response.rows.length).map(response => response.id), error: false });
    }).catch(() => { if (!controller.signal.aborted) setResult({ key, rows: [], missing: [], error: true }); });
    return () => controller.abort();
  }, [catalog, key, period, sex, sector, activity, indicator]);
  const current = result?.key === key ? result : null;
  const names = new Map(regions.map(region => [region.region_id, region.name]));
  const rows = [...(current?.rows ?? [])].sort((a, b) => order === "alphabetical" ? (names.get(a.region_id) ?? "").localeCompare(names.get(b.region_id) ?? "") : (order === "ascending" ? a.value - b.value : b.value - a.value) || a.region_id.localeCompare(b.region_id));
  const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return <VisualizationFrame kind={rows.length ? "observed" : "unavailable"} title={t("viz.comparison")} description={t("viz.comparisonNote")} source="MoSPI — PLFS" period={`${period} · ${t("real.age")} · ${t(["persons", "female", "male"].includes(sex) ? `real.${sex}` as "real.persons" : "viz.unavailable")} · ${t(["combined", "rural", "urban"].includes(sector) ? `real.${sector}` as "real.combined" : "viz.unavailable")}`} controls={<div className="viz-comparison-controls">
    <label>{t("viz.compareIndicator")}<select aria-label={t("viz.compareIndicator")} value={indicator} onChange={e => setIndicator(e.target.value as LabourObservation["indicator"])}>{(["LFPR", "WPR", "UR"] as const).map(key => <option key={key} value={key}>{t(`real.${key}`)}</option>)}</select></label>
    <label>{t("viz.sort")}<select aria-label={t("viz.sort")} value={order} onChange={e => setOrder(e.target.value)}>{(["descending", "ascending", "alphabetical"] as const).map(key => <option key={key} value={key}>{t(`viz.${key}`)}</option>)}</select></label>
  </div>}>
    {!current ? <LoadingState label={t("real.loading")} /> : current.error ? <ErrorState description={t("real.error")} onRetry={() => retry(n => n + 1)} /> : !rows.length ? <UnavailableIntelligence title={t("real.unavailable")} description={t("real.unavailableDetail")} /> : <>
      <ul className="viz-comparison-list" aria-label={t("viz.comparison")}><li className="viz-dot-scale" aria-hidden="true"><span /><div><span>0%</span><span>50%</span><span>100%</span></div><span /></li>{rows.map(row => <li key={row.observation_id}><button type="button" className="viz-dot-row" onClick={() => setEvidence(row)} aria-label={`${names.get(row.region_id)} · ${t(`real.${indicator}`)} ${nf.format(row.value)}% · ${row.period} · ${t("real.evidence")}`}>
        <span lang="en">{names.get(row.region_id)}</span><span className="viz-dot-track" aria-hidden="true"><i style={{ insetInlineStart: `${row.value}%` }} /></span><strong>{nf.format(row.value)}%</strong>
      </button></li>)}</ul>
      {Boolean(current.missing.length) && <p className="viz-annotation">{t("viz.comparisonMissing")} <span lang="en">{current.missing.map(id => names.get(id)).join(" · ")}</span></p>}
      <details className="viz-table-details"><summary>{t("viz.table")}</summary><div className="real-table-wrap" tabIndex={0}><table><caption>{t(`real.${indicator}`)} · {period} · MoSPI — PLFS</caption><thead><tr><th>{t("real.region")}</th><th>{t("real.percent")}</th><th>{t("real.evidence")}</th></tr></thead><tbody>{rows.map(row => <tr key={row.observation_id}><th scope="row" lang="en">{names.get(row.region_id)}</th><td>{nf.format(row.value)}%</td><td><button type="button" className="real-evidence-link" onClick={() => setEvidence(row)}>{t("real.evidence")}<span className="sr-only"> {names.get(row.region_id)}</span></button></td></tr>)}</tbody></table></div></details>
    </>}
    {evidence && <EvidencePanel evidence={evidence.evidence} period={`${evidence.period} · ${names.get(evidence.region_id)} · ${t("real.age")}`} onClose={() => setEvidence(null)} />}
  </VisualizationFrame>;
}
