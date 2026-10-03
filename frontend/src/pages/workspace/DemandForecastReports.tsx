import { samplePath } from "../../features/real-intelligence/legacySample";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText } from "lucide-react";
import { useLocale } from "../../hooks/usePreferences";
import { useWorkspaceFilters } from "../../hooks/useWorkspaceFilters";
import { periods, skills } from "../../data/labourMarket";
import { average, queryObservations, rankings, scenarioSeries, trendSeries } from "../../analytics/simulatedLabourMarket";
import { WorkspaceFilters } from "../../components/workspace/WorkspaceFilters";
import { WorkspaceMetrics } from "../../components/workspace/WorkspaceMetrics";
import { RankingChart, ScenarioChart, TrendChart } from "../../components/workspace/AnalyticsCharts";
import { ChartCard } from "../../components/charts/ChartCard";
import { Panel, SectionHeader } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function DemandIntelligencePage() {
  const { t } = useLocale(); const { filters } = useWorkspaceFilters();
  const rows = queryObservations(filters);
  return <><WorkspaceFilters visible={["period", "region", "industry", "occupation", "skill"]} />
    <WorkspaceMetrics items={[{ label: "workspace.avgDemand", value: Math.round(average(rows, "demandIndex")), note: "workspace.indexUnit" }, { label: "workspace.avgSupply", value: Math.round(average(rows, "supplyIndex")), note: "workspace.indexUnit" }, { label: "workspace.avgGap", value: Math.round(average(rows, "gapIndex")), note: "workspace.indexUnit" }, { label: "workspace.observationCount", value: rows.length, note: "workspace.observationCountNote" }]} />
    <div className="workspace-grid workspace-grid-primary">
      <ChartCard title={t("workspace.trendHeading")} subtitle={t("workspace.demandIntro")} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}><TrendChart data={trendSeries(rows)} title={t("workspace.trendHeading")} /></ChartCard>
      <ChartCard title={t("workspace.topSkills")} subtitle={t("workspace.rankingDescription")} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}><RankingChart data={rankings(rows, "skillId")} title={t("workspace.topSkills")} /></ChartCard>
    </div>
    <div className="workspace-grid workspace-grid-secondary"><ChartCard title={t("workspace.topRegions")} subtitle={t("workspace.regionScore")} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}><RankingChart data={rankings(rows, "regionId")} title={t("workspace.topRegions")} /></ChartCard>
      <Panel><SectionHeader eyebrow={t("workspace.insightNote")} title={t("workspace.relationships")} />
        <div className="dashboard-dimensions">{skills.slice(0, 4).map(item => <Link key={item.id} to={samplePath(`/skills?skill=${item.id}`)}><span>{t(item.nameKey)}</span><ArrowUpRight size={16} /></Link>)}</div>
      </Panel></div>
  </>;
}

export function ForecastIntelligencePage() {
  const { t } = useLocale(); const { filters } = useWorkspaceFilters();
  const rows = queryObservations(filters); const base = scenarioSeries(rows, .025);
  const growth = scenarioSeries(rows, .075); const conservative = scenarioSeries(rows, .005);
  const finalPoint = (points: ReturnType<typeof scenarioSeries>) => points.at(-1)?.demand ?? 0;
  return <><WorkspaceFilters visible={["period", "region", "industry", "skill"]} />
    <div className="scenario-disclosure"><StatusBadge kind="scenario" /><span>{t("workspace.scenarioDisclosure")}</span></div>
    <WorkspaceMetrics items={[{ label: "workspace.scenarioBaseline", value: finalPoint(base), note: "workspace.indexUnit" }, { label: "workspace.scenarioGrowth", value: finalPoint(growth), note: "workspace.indexUnit", tone: "positive" }, { label: "workspace.scenarioConservative", value: finalPoint(conservative), note: "workspace.indexUnit", tone: "neutral" }]} />
    <ChartCard title={t("workspace.forecastTitle")} subtitle={t("workspace.forecastIntro")} source={t("workspace.scenarioDisclosure")} period={t("workspace.indexUnit")}>
      <ScenarioChart baseline={base} growth={growth} conservative={conservative} title={t("workspace.forecastTitle")} />
    </ChartCard>
    <Panel className="scenario-method-note"><SectionHeader eyebrow={t("workspace.scenarioDisclosure")} title={t("workspace.insightNote")} /><p>{t("workspace.dataStatusDetail")}</p></Panel>
  </>;
}

const reportFixtures = [
  { title: "workspace.reportSkills" as const, scope: "workspace.reportScopeIndia" as const, path: "/skills" },
  { title: "workspace.reportRegional" as const, scope: "workspace.reportScopeIndia" as const, path: "/regions" },
  { title: "workspace.reportTechnology" as const, scope: "workspace.reportScopeTechnology" as const, path: "/industries?industry=technology" },
  { title: "workspace.reportEmerging" as const, scope: "workspace.reportScopeIndia" as const, path: "/demand" },
];
export function IntelligenceReportsPage() {
  const { t } = useLocale(); const { filters } = useWorkspaceFilters();
  const rows = queryObservations(filters);
  const [open, setOpen] = useState<number | null>(null);
  return <><WorkspaceFilters visible={["period", "region", "industry"]} />
    <section className="report-list" aria-label={t("workspace.reportsTitle")}>
      {reportFixtures.map((report, index) => <Panel key={report.title} className="report-row">
        <span className="report-icon"><FileText size={20} aria-hidden="true" /></span>
        <div className="report-content"><div className="report-heading"><h2>{t(report.title)}</h2><StatusBadge kind="sample" /></div>
          <dl><div><dt>{t("workspace.reportScope")}</dt><dd>{t(report.scope)}</dd></div><div><dt>{t("workspace.reportPeriod")}</dt><dd>{t(periods.at(-1)!.labelKey)}</dd></div><div><dt>{t("workspace.reportStatus")}</dt><dd>{t("workspace.reportSample")}</dd></div></dl>
          <p>{t("workspace.reportInsight")}</p>
          {open === index && <div className="report-detail"><strong>{t("workspace.avgDemand")}: {Math.round(average(rows, "demandIndex"))}</strong><span>{t("workspace.insightNote")}</span></div>}
        </div>
        <div className="report-actions"><button className="button button-secondary" type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)}>{open === index ? t("workspace.viewLess") : t("workspace.viewBrief")}</button><Link className="text-link" to={samplePath(report.path)}>{t("workspace.openEntity")}<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      </Panel>)}
    </section>
  </>;
}
