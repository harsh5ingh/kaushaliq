import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { api } from "../../services/api";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useIntelligenceData } from "./dataContext";
import { decodeTraining, type TrainingObservation } from "./contracts";
import { EvidencePanel } from "./EvidencePanel";

export function ObservedTraining() {
  const { t, locale } = useLocale(); const { catalog } = useIntelligenceData();
  const [region, setRegion] = useState("in"); const [result, setResult] = useState<{ key: string; rows: TrainingObservation[] | null; failed: boolean } | null>(null); const [attempt, retry] = useState(0); const [evidence, setEvidence] = useState<TrainingObservation | null>(null);
  const requestKey = `${region}:${attempt}`; const rows = result?.key === requestKey ? result.rows : null; const failed = result?.key === requestKey ? result.failed : false;
  useEffect(() => {
    const abort = new AbortController();
    api.get(`/v1/training?region_id=${encodeURIComponent(region)}`, decodeTraining, abort.signal).then(response => setResult({ key: requestKey, rows: response.items, failed: false })).catch(() => { if (!abort.signal.aborted) setResult({ key: requestKey, rows: null, failed: true }); });
    return () => abort.abort();
  }, [region, requestKey]);
  return <section><div className="real-section-heading"><h2>{t("real.training")}</h2><p>{t("real.trainingNote")}</p></div>
    <label className="real-chart-control">{t("real.region")}<select aria-label={t("real.region")} value={region} onChange={e => setRegion(e.target.value)}>{catalog?.regions.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}</select></label>
    <p className="real-note">{t("real.quarantine")}</p><p className="real-note">{t("real.trainingMissing")}</p>
    <Link to="/supply" className="supply-explore-link">{t("supply.supplyLink")}</Link>
    {failed ? <ErrorState description={t("real.error")} onRetry={() => retry(n => n+1)} /> : !rows ? <LoadingState label={t("real.loading")} /> : !rows.length ? <EmptyState title={t("real.unavailable")} description={t("real.unavailableDetail")} /> : <div className="real-table-wrap"><table><caption>MSDE — PMKVY · {t("real.observed")}</caption><thead><tr><th>{t("real.period")}</th><th>{t("real.name")}</th><th>{t("real.count")}</th><th>{t("real.evidence")}</th></tr></thead><tbody>{rows.map(row => <tr key={row.observation_id}><th scope="row">{row.period}{row.partial && <small>{t("real.partial")}</small>}</th><td>{t(row.indicator === "trained" ? "real.trained" : "real.certified")}</td><td>{new Intl.NumberFormat(locale).format(row.value)}</td><td><button className="real-evidence-link" onClick={() => setEvidence(row)}>{t("real.evidence")}<span className="sr-only"> {row.period} {t(row.indicator === "trained" ? "real.trained" : "real.certified")}</span></button></td></tr>)}</tbody></table></div>}
    {evidence && <EvidencePanel evidence={evidence.evidence} period={`${evidence.period} · ${catalog?.regions.find(r => r.region_id === region)?.name}`} onClose={() => setEvidence(null)} />}
  </section>;
}
