import { useLocale } from "../../hooks/usePreferences";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { industries, occupations, periods, regions, skills } from "../../data/labourMarket";
import type { RankPoint, SeriesPoint } from "../../analytics/simulatedLabourMarket";
import type { MessageKey } from "../../app/i18n/config";

function labelFor(id: string, t: (key: MessageKey) => string) {
  return [...skills, ...regions, ...industries, ...occupations].find(entity => entity.id === id)?.nameKey
    ? t([...skills, ...regions, ...industries, ...occupations].find(entity => entity.id === id)!.nameKey) : id;
}
function periodLabel(value: string, t: (key: MessageKey) => string) {
  const period = periods.find(item => item.id === value);
  if (period) return t(period.labelKey);
  const future = ["workspace.q2026q3", "workspace.q2026q4", "workspace.q2027q1", "workspace.q2027q2"] as const;
  return future.some(key => key === value) ? t(value as typeof future[number]) : value;
}
export function TrendChart({ data, title, showSupply = true }: { data: SeriesPoint[]; title: string; showSupply?: boolean }) {
  const { t } = useLocale();
  if (!data.length) return <p className="chart-empty" role="status">{t("workspace.noObservations")}</p>;
  return <div className="workspace-chart" role="img" aria-label={title}>
    <ResponsiveContainer width="100%" height={270}>
      <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -12 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="period" tickFormatter={value => periodLabel(String(value), t)} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip labelFormatter={value => periodLabel(String(value), t)} formatter={(value, name) => [value, name === "demand" ? t("workspace.demandIndex") : name === "supply" ? t("workspace.supplyIndex") : t("workspace.gapIndex")]} contentStyle={{ background: "var(--bg-surface)", borderColor: "var(--border-control)", color: "var(--text-primary)" }} />
        <Legend formatter={value => value === "demand" ? t("workspace.demandIndex") : value === "supply" ? t("workspace.supplyIndex") : t("workspace.gapIndex")} />
        <Line type="monotone" dataKey="demand" stroke="var(--chart-series-1)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} />
        {showSupply && <Line type="monotone" dataKey="supply" stroke="var(--chart-series-2)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} />}
        <Line type="monotone" dataKey="gap" stroke="var(--chart-series-3)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
export function ScenarioChart({ baseline, growth, conservative, title }: { baseline: SeriesPoint[]; growth: SeriesPoint[]; conservative: SeriesPoint[]; title: string }) {
  const { t } = useLocale();
  const data = baseline.map((point, index) => ({ period: point.period, baseline: point.demand, growth: growth[index]?.demand, conservative: conservative[index]?.demand }));
  if (!data.length) return <p className="chart-empty" role="status">{t("workspace.noObservations")}</p>;
  return <div className="workspace-chart" role="img" aria-label={title}><ResponsiveContainer width="100%" height={290}>
    <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -12 }}>
      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
      <XAxis dataKey="period" tickFormatter={value => periodLabel(String(value), t)} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} />
      <YAxis domain={[0, 100]} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={false} tickLine={false} />
      <Tooltip labelFormatter={value => periodLabel(String(value), t)} formatter={value => [value, t("workspace.demandIndex")]} contentStyle={{ background: "var(--bg-surface)", borderColor: "var(--border-control)" }} />
      <Legend formatter={value => value === "baseline" ? t("workspace.scenarioBaseline") : value === "growth" ? t("workspace.scenarioGrowth") : t("workspace.scenarioConservative")} />
      <Line type="monotone" dataKey="baseline" stroke="var(--chart-series-1)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} />
      <Line type="monotone" dataKey="growth" stroke="var(--chart-series-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      <Line type="monotone" dataKey="conservative" stroke="var(--chart-series-3)" strokeWidth={2} strokeDasharray="2 4" dot={false} isAnimationActive={false} />
    </LineChart>
  </ResponsiveContainer></div>;
}
export function RankingChart({ data, title }: { data: RankPoint[]; title: string }) {
  const { t } = useLocale();
  const rows = data.slice(0, 7).map(row => ({ ...row, label: labelFor(row.id, t) }));
  if (!rows.length) return <p className="chart-empty" role="status">{t("workspace.noObservations")}</p>;
  return <div className="workspace-chart" role="img" aria-label={title}>
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 12 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={125} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={value => [value, t("workspace.indexLabel")]} contentStyle={{ background: "var(--bg-surface)", borderColor: "var(--border-control)", color: "var(--text-primary)" }} />
        <Bar dataKey="score" name={t("workspace.demandIndex")} fill="var(--chart-series-1)" radius={[0, 3, 3, 0]} isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
