import { useState, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale } from "../../hooks/usePreferences";
import { VisualizationFrame, ObservationLegend, ObservationTooltip } from "../../components/visualization/VisualizationFrame";
import type { LabourObservation } from "./contracts";

/** API observations only. No smoothing, missing-value fill or synthetic periods. */
export function ObservedTrend({ rows, regionName, onEvidence, controls }: { rows: LabourObservation[]; regionName: string; onEvidence: (row: LabourObservation) => void; controls?: ReactNode }) {
  const { t, locale } = useLocale(); const [selectedId, setSelectedId] = useState<string | null>(null);
  const data = [...rows].sort((a, b) => a.period_start.localeCompare(b.period_start));
  if (!data.length) return null;
  const selected = data.find(row => row.observation_id === selectedId) ?? data[data.length - 1];
  const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const label = t(`real.${selected.indicator}`);
  return <VisualizationFrame title={t("viz.historyQuestion")} description={t("real.historyNote")} source="MoSPI — PLFS" period={`${data[0].period} → ${data[data.length - 1].period}`} annotation={t("real.designBreak")} controls={controls}>
    <div className="viz-trend-layout"><div className="real-chart" role="group" aria-label={`${label} · ${regionName} · ${t("real.percent")}`}>
      <ObservationLegend label={label} />
      <ResponsiveContainer width="100%" height={300}><LineChart accessibilityLayer data={data} margin={{ left: 0, right: 20, top: 16, bottom: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="2 6" />
        <XAxis dataKey="period" stroke="var(--chart-axis)" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" stroke="var(--chart-axis)" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} width={52} />
        <ReferenceLine x={selected.period} stroke="var(--border-control)" strokeDasharray="4 4" />
        <Tooltip cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "3 4" }} content={({ active, payload }) => {
          const row = payload?.[0]?.payload as LabourObservation | undefined;
          return active && row ? <ObservationTooltip label={label} value={`${nf.format(row.value)}%`} period={row.period} context={`${regionName} · ${t("real.age")}`} source="MoSPI — PLFS" /> : null;
        }} />
        <Line type="linear" dataKey="value" name={label} stroke="var(--chart-series-1)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--bg-surface)", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} connectNulls={false} />
      </LineChart></ResponsiveContainer>
    </div><aside className="viz-inspector">
      <label>{t("viz.inspect")}<select aria-label={t("viz.inspect")} value={selected.observation_id} onChange={event => setSelectedId(event.target.value)}>{data.map(row => <option key={row.observation_id} value={row.observation_id}>{row.period}</option>)}</select></label>
      <p>{t("viz.selected")} · {t("real.observed")}</p><strong>{nf.format(selected.value)}%</strong><p>{label}</p>
      <p>{regionName} · {selected.period} · {t("real.age")}</p><p>{t(selected.indicator === "UR" ? "real.forceDenominator" : "real.popDenominator")}</p>
      <button type="button" className="real-evidence-link" onClick={() => onEvidence(selected)}>{t("real.evidence")}<span className="sr-only"> {selected.period}</span></button>
    </aside></div>
    {data.length === 1 && <p className="viz-annotation">{t("viz.single")}</p>}
    <details className="viz-table-details"><summary>{t("viz.table")}</summary><div className="real-table-wrap" tabIndex={0} role="region" aria-label={t("viz.table")}><table><caption>{label} · {t("real.percent")} · {t("real.age")}</caption><thead><tr><th>{t("real.period")}</th><th>{label}</th><th>{t("real.source")}</th><th>{t("real.evidence")}</th></tr></thead><tbody>{data.map(row => <tr key={row.observation_id}><th scope="row">{row.period}</th><td>{nf.format(row.value)}%</td><td>MoSPI — PLFS</td><td><button type="button" className="real-evidence-link" onClick={() => onEvidence(row)}>{t("real.evidence")}<span className="sr-only"> {row.period}</span></button></td></tr>)}</tbody></table></div></details>
  </VisualizationFrame>;
}
