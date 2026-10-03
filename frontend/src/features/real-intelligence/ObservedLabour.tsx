import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ObservedTrend } from "./ObservedTrend";
import { useLocale } from "../../hooks/usePreferences";
import { api } from "../../services/api";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SecondaryButton } from "../../components/ui/Buttons";
import { useIntelligenceData } from "./dataContext";
import { decodeLabour, type LabourObservation } from "./contracts";
import { EvidencePanel } from "./EvidencePanel";

const periods = ["2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24"];
const indicators = ["LFPR", "WPR", "UR"] as const;
export function ObservedLabour({ showHistory = true }: { showHistory?: boolean }) {
  const { t, locale } = useLocale(); const { catalog } = useIntelligenceData(); const [params, setParams] = useSearchParams();
  const region = params.get("region") || "in"; const period = params.get("period") || "2023-24";
  const sex = params.get("sex") || "persons"; const sector = params.get("sector") || "combined"; const status = params.get("activity") || "US";
  const [result, setResult] = useState<{ key: string; rows: LabourObservation[] | null; failed: boolean } | null>(null); const [attempt, retry] = useState(0);
  const requestKey = `${region}:${sex}:${sector}:${status}:${attempt}`;
  const rows = result?.key === requestKey ? result.rows : null; const failed = result?.key === requestKey ? result.failed : false;
  const [evidence, setEvidence] = useState<LabourObservation | null>(null); const [indicator, setIndicator] = useState<"LFPR" | "WPR" | "UR">("LFPR");
  function change(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); setParams(next); }
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({ region_id: region, sex, sector, activity_status: status });
    api.get(`/v1/labour?${query}`, decodeLabour, abort.signal).then(response => setResult({ key: requestKey, rows: response.items, failed: false })).catch(() => { if (!abort.signal.aborted) setResult({ key: requestKey, rows: null, failed: true }); });
    return () => abort.abort();
  }, [region, sex, sector, status, requestKey]);
  const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const selected = rows?.filter(row => row.period === period) ?? [];
  const history = rows?.filter(row => row.indicator === indicator).sort((a, b) => a.period_start.localeCompare(b.period_start)) ?? [];
  const regionName = catalog?.regions.find(r => r.region_id === region)?.name || region;
  return <section className="observed-labour">
    <div className="real-section-heading"><h2>{t("real.overview")}</h2><p>{t("real.intro")}</p></div>
    <div className="real-filter-bar">
      <label>{t("real.region")}<select aria-label={t("real.region")} value={region} onChange={e => change("region", e.target.value)}>{catalog?.regions.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}</select></label>
      <label>{t("real.period")}<select aria-label={t("real.period")} value={period} onChange={e => change("period", e.target.value)}>{periods.map(p => <option key={p}>{p}</option>)}</select></label>
      <label>{t("real.sex")}<select aria-label={t("real.sex")} value={sex} onChange={e => change("sex", e.target.value)}>{(["persons", "female", "male"] as const).map(s => <option key={s} value={s}>{t(`real.${s}`)}</option>)}</select></label>
      <label>{t("real.sector")}<select aria-label={t("real.sector")} value={sector} onChange={e => change("sector", e.target.value)}>{(["combined", "rural", "urban"] as const).map(s => <option key={s} value={s}>{t(`real.${s}`)}</option>)}</select></label>
      <label>{t("real.activity")}<select aria-label={t("real.activity")} value={status} onChange={e => change("activity", e.target.value)}><option value="US">{t("real.US")}</option><option value="CWS">{t("real.CWS")}</option></select></label>
    </div>
    <p className="real-context">{regionName} · {period} · {t("real.age")} · MoSPI — PLFS</p>
    {failed ? <ErrorState description={t("real.error")} onRetry={() => retry(n => n + 1)} /> : !rows ? <LoadingState label={t("real.loading")} /> : <>
      <div className="real-metrics">{indicators.map(key => {
        const row = selected.find(r => r.indicator === key);
        return <article className="real-metric" key={key}><div><h3>{t(`real.${key}`)}</h3><StatusBadge kind={row ? "observed" : "unavailable"} /></div><strong>{row ? `${nf.format(row.value)}%` : "—"}</strong>
          <p>{row ? t(key === "UR" ? "real.forceDenominator" : "real.popDenominator") : t("real.unavailableDetail")}</p><small className="viz-metric-context">{regionName} · {period} · {t("real.age")}<br />MoSPI — PLFS</small>
          {row && <SecondaryButton onClick={() => setEvidence(row)}>{t("real.evidence")}</SecondaryButton>}</article>;
      })}</div>
      {!selected.length && <EmptyState title={t("real.unavailable")} description={t("real.unavailableDetail")} compact />}
      {showHistory && (history.length ? <ObservedTrend rows={history} regionName={regionName} onEvidence={setEvidence} controls={<label className="real-chart-control">{t("real.history")}<select aria-label={t("real.history")} value={indicator} onChange={e => setIndicator(e.target.value as typeof indicator)}>{indicators.map(key => <option value={key} key={key}>{t(`real.${key}`)}</option>)}</select></label>} /> : <EmptyState title={t("real.unavailable")} description={t("real.unavailableDetail")} compact />)}
    </>}

    {evidence && <EvidencePanel evidence={evidence.evidence} period={`${evidence.period} · ${regionName} · ${t("real.age")} · ${t(evidence.activity_status === "US" ? "real.US" : "real.CWS")}`} onClose={() => setEvidence(null)} />}
  </section>;
}
