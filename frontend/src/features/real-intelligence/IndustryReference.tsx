import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { useIntelligenceData } from "./dataContext";
import { EvidencePanel } from "./EvidencePanel";
import type { Industry } from "./contracts";
import { SecondaryButton } from "../../components/ui/Buttons";

export function IndustryReference() {
  const { t } = useLocale(); const { catalog } = useIntelligenceData(); const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("industry")?.replace("nic2008-", "") || ""); const [level, setLevel] = useState(""); const [selected, setSelected] = useState<Industry | null>(null);
  const rows = catalog?.industries.filter(r => (!level || r.level === level) && `${r.name} ${r.nic_code}`.toLowerCase().includes(query.toLowerCase())) || [];
  const [page, setPage] = useState(1); const pages = Math.max(1, Math.ceil(rows.length / 25)); const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * 25, currentPage * 25);
  return <section><div className="real-section-heading"><h2>{t("real.industries")}</h2><p>{t("real.industryNote")}</p></div><p className="real-note">{t("real.sourceLanguage")}</p>
    <div className="real-filter-bar"><label>{t("real.search")}<input aria-label={t("real.search")} type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label><label>{t("real.level")}<select aria-label={t("real.level")} value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}><option value="">{t("real.all")}</option>{(["section", "division", "group"] as const).map(l => <option key={l} value={l}>{t(`real.${l}`)}</option>)}</select></label></div>
    <div className="real-table-wrap"><table><caption>{t("real.reference")} · MoSPI · NIC-2008</caption><thead><tr><th>{t("real.code")}</th><th>{t("real.name")}</th><th>{t("real.level")}</th><th>{t("real.evidence")}</th></tr></thead><tbody>{visible.map(row => <tr key={row.industry_id}><th scope="row">{row.nic_code}</th><td lang="en">{row.name}</td><td>{t(`real.${row.level}`)}</td><td><button className="real-evidence-link" onClick={() => setSelected(row)}>{t("real.evidence")}<span className="sr-only"> {row.nic_code}</span></button></td></tr>)}</tbody></table></div>
    <div className="real-pagination"><span role="status">{t("real.results", {count: rows.length})} · {t("real.page", {page: currentPage,total: pages})}</span><SecondaryButton disabled={currentPage === 1} onClick={() => setPage(n => n - 1)}>{t("real.previous")}</SecondaryButton><SecondaryButton disabled={currentPage === pages} onClick={() => setPage(n => n + 1)}>{t("real.next")}</SecondaryButton></div>
    {selected && <EvidencePanel evidence={selected.evidence} period="NIC-2008 · Sixth Economic Census" onClose={() => setSelected(null)} />}
  </section>;
}
