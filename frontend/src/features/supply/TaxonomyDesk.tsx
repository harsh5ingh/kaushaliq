import { useEffect, useState } from "react";
import { useLocale } from "../../hooks/usePreferences";
import { api } from "../../services/api";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { SecondaryButton } from "../../components/ui/Buttons";
import { decodeTaxonomies, type Taxonomies } from "./contracts";
import type { Evidence, Source } from "../real-intelligence/contracts";
import type { MessageKey } from "../../app/i18n/config";

export interface SelectedEvidence { evidence: Evidence; period: string; source: Source }
export function TaxonomyDesk({ version, onEvidence }: { version: string; onEvidence: (selection: SelectedEvidence) => void }) {
  const { t, locale } = useLocale(); const [kind, setKind] = useState("occupation"), [search, setSearch] = useState(""), [term, setTerm] = useState(""), [limit, setLimit] = useState(25), [attempt, retry] = useState(0);
  const query = new URLSearchParams({ kind, search: term, limit: String(limit) }).toString(), key = `${version}:${query}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: Taxonomies; failed?: boolean }>();
  useEffect(() => { const abort = new AbortController(); api.get(`/v1/intelligence/supply/taxonomies?${query}`, decodeTaxonomies, abort.signal).then(data => { if (abort.signal.aborted) return; if (data.version !== version) throw new Error("Reference publication changed"); setResult({ key, data }); }).catch(() => { if (!abort.signal.aborted) setResult({ key, failed: true }); }); return () => abort.abort(); }, [key, query, version]);
  const current = result?.key === key ? result : undefined, data = current?.data;
  return <section className="supply-taxonomy" aria-labelledby="taxonomy-title"><div className="real-section-heading"><h2 id="taxonomy-title">{t("supply.taxonomy")}</h2><p>{t("supply.taxonomyNote")}</p></div>
    <form className="real-filter-bar" onSubmit={e => { e.preventDefault(); setTerm(search); setLimit(25); }}>
      <label>{t("supply.kind")}<select aria-label={t("supply.kind")} value={kind} onChange={e => { setKind(e.target.value); setLimit(25); }}>{["occupation", "skill", "qualification", "industry"].map(k => <option value={k} key={k}>{t(`supply.${k}` as MessageKey)}</option>)}</select></label>
      <label>{t("supply.search")}<input type="search" maxLength={120} value={search} onChange={e => setSearch(e.target.value)} /></label><SecondaryButton type="submit">{t("supply.searchAction")}</SecondaryButton>
    </form>
    {current?.failed ? <ErrorState description={t("supply.error")} onRetry={() => retry(n => n + 1)} /> : !data ? <LoadingState label={t("supply.loading")} /> : <div data-taxonomy-kind={kind}>
      {!data.items.length ? <EmptyState compact title={t("real.unavailable")} description={t("supply.taxonomyEmpty")} /> : <><p className="real-note">{t("supply.referenceOnly")} · {new Intl.NumberFormat(locale).format(data.total)}</p><div className="real-table-wrap" tabIndex={0} role="region" aria-label={t("supply.taxonomy")}><table><caption>{t("supply.referenceOnly")}</caption><thead><tr><th>{t("supply.code")}</th><th>{t("real.name")}</th><th>{t("supply.version")}</th><th>{t("supply.parent")}</th><th>{t("real.evidence")}</th></tr></thead><tbody>{data.items.map(r => <tr key={r.reference_id}><th scope="row">{r.code}</th><td lang="en">{r.title}</td><td>{r.taxonomy_system} {r.taxonomy_version}</td><td>{r.parent_code ?? "—"}</td><td><button type="button" className="real-evidence-link" onClick={() => { const source = data.sources.find(s => s.source_id === r.evidence.source_id); if (source) onEvidence({ evidence: r.evidence, period: `${r.taxonomy_system} ${r.taxonomy_version} · ${r.code}`, source }); }} aria-label={`${t("real.evidence")} · ${r.code}`}>{t("real.evidence")}</button></td></tr>)}</tbody></table></div>{limit < data.total && <SecondaryButton onClick={() => setLimit(n => Math.min(n + 25, 1000))}>{t("supply.showMore")}</SecondaryButton>}</>}
      <ul className="supply-source-list">{data.taxonomy_sources.map(s => <li key={s.taxonomy_source_id}><span lang="en">{s.name}</span><span>{t(`supply.${s.status}` as MessageKey)}</span></li>)}</ul>
    </div>}
  </section>;
}
