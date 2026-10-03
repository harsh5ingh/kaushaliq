import { useState } from "react";
import { useLocale } from "../../hooks/usePreferences";
import { SecondaryButton } from "../../components/ui/Buttons";
import { VisualizationFrame } from "../../components/visualization/VisualizationFrame";
import type { DemandSignal } from "./contracts";

export function VacancyComparison({ rows, period, onEvidence }: { rows: DemandSignal[]; period: string; onEvidence: (row: DemandSignal) => void }) {
  const { t, locale } = useLocale(); const [expanded, setExpanded] = useState(false);
  const nf = new Intl.NumberFormat(locale);
  const assigned = rows.filter(r => r.geography_level === "state" || r.geography_level === "ut").sort((a, b) => b.value - a.value || a.source_geography_label.localeCompare(b.source_geography_label));
  const max = Math.max(...assigned.map(r => r.value), 0);
  return <VisualizationFrame title={t("demand.comparison")} description={t("demand.comparisonNote")} source="NCS · PIB" period={period} annotation={t("demand.comparisonCaveat")}>
    {assigned.length ? <><ol className="demand-bars" aria-label={t("demand.comparison")}>
      {(expanded ? assigned : assigned.slice(0, 10)).map(row => <li key={row.signal_id}><button type="button" onClick={() => onEvidence(row)} aria-label={`${row.source_geography_label}: ${nf.format(row.value)} · ${t("demand.vacancies")} · ${t("real.evidence")}`}>
        <span lang="en">{row.source_geography_label}</span><span className="demand-bar-track" aria-hidden="true"><i style={{ width: `${max ? row.value / max * 100 : 0}%` }} /></span><strong>{nf.format(row.value)}</strong>
      </button></li>)}
    </ol>{assigned.length > 10 && <SecondaryButton onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>{t(expanded ? "demand.showLess" : "demand.showAll", { count: assigned.length })}</SecondaryButton>}</> : <p className="real-note">{t("demand.noRegional")}</p>}
    <details className="viz-table-details"><summary>{t("demand.table")}</summary><div className="real-table-wrap" tabIndex={0} role="region" aria-label={t("demand.table")}><table>
      <caption>{t("demand.tableContext", { period })}</caption><thead><tr><th>{t("real.region")}</th><th>{t("demand.vacancies")}</th><th>{t("demand.mapping")}</th><th>{t("real.evidence")}</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.signal_id}><th scope="row" lang="en">{row.source_geography_label}</th><td>{nf.format(row.value)}</td><td>{t(row.geography_id ? "demand.mapped" : "demand.unmapped")}</td><td><button type="button" className="real-evidence-link" onClick={() => onEvidence(row)} aria-label={`${t("real.evidence")} · ${row.source_geography_label}`}>{t("real.evidence")}</button></td></tr>)}</tbody>
    </table></div></details>
  </VisualizationFrame>;
}
