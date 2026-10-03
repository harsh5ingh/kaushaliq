import { samplePath } from "../../features/real-intelligence/legacySample";
import { useLocale } from "../../hooks/usePreferences";
import { industries, occupations, regions, skills } from "../../data/labourMarket";
import { average, queryObservations, rankings, trendSeries } from "../../analytics/simulatedLabourMarket";
import { useWorkspaceFilters } from "../../hooks/useWorkspaceFilters";
import { WorkspaceFilters } from "../../components/workspace/WorkspaceFilters";
import { WorkspaceMetrics } from "../../components/workspace/WorkspaceMetrics";
import { RankingChart, TrendChart } from "../../components/workspace/AnalyticsCharts";
import { ChartCard } from "../../components/charts/ChartCard";
import { Panel, SectionHeader } from "../../components/ui/Panel";
import { Link } from "react-router-dom";

export function OverviewDashboard() {
  const { t } = useLocale();
  const { filters } = useWorkspaceFilters();
  const observations = queryObservations(filters);
  const trend = trendSeries(observations);
  const regionRanks = rankings(observations, "regionId");
  const industryRanks = rankings(observations, "industryId");
  const metrics = [
    { label: "workspace.avgDemand" as const, value: Math.round(average(observations, "demandIndex")), note: "workspace.indexUnit" as const },
    { label: "workspace.avgSupply" as const, value: Math.round(average(observations, "supplyIndex")), note: "workspace.indexUnit" as const },
    { label: "workspace.avgGap" as const, value: Math.round(average(observations, "gapIndex")), note: "workspace.indexUnit" as const },
    { label: "workspace.observationCount" as const, value: observations.length, note: "workspace.observationCountNote" as const },
  ];
  return <>
    <WorkspaceFilters />
    <WorkspaceMetrics items={metrics} />
    {!observations.length ? <Panel><p role="status">{t("workspace.noObservations")}</p></Panel> : <>
      <div className="workspace-grid workspace-grid-primary">
        <ChartCard title={t("workspace.trendHeading")} subtitle={t("workspace.trendDescription")} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}>
          <TrendChart data={trend} title={t("workspace.trendHeading")} />
        </ChartCard>
        <ChartCard title={t("workspace.topIndustries")} subtitle={t("workspace.rankingDescription")} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}>
          <RankingChart data={industryRanks} title={t("workspace.topIndustries")} />
        </ChartCard>
      </div>
      <div className="workspace-grid workspace-grid-secondary">
        <Panel><SectionHeader eyebrow={t("workspace.regionNode")} title={t("workspace.regionScore")} />
          <div className="regional-rank-list">{regionRanks.slice(0, 6).map((row, index) => <Link key={row.id} to={samplePath(`/regions?region=${row.id}`)}>
            <span className="rank-position">{String(index + 1).padStart(2, "0")}</span><span>{t(regions.find(item => item.id === row.id)!.nameKey)}</span>
            <span className="rank-track"><i style={{ width: `${row.score}%` }} /></span><strong>{row.score}</strong>
          </Link>)}</div>
        </Panel>
        <Panel><SectionHeader eyebrow={t("workspace.relationships")} title={t("workspace.rankingHeading")} />
          <div className="dashboard-dimensions">{[
            [t("common.skills"), skills.length, "/skills"], [t("common.occupations"), occupations.length, "/occupations"],
            [t("common.industries"), industries.length, "/industries"], [t("common.regions"), regions.length, "/regions"],
          ].map(([label, count, href]) => <Link key={String(href)} to={samplePath(String(href))}><span>{label}</span><strong>{count}</strong></Link>)}</div>
          <p className="workspace-caveat">{t("workspace.insightNote")}</p>
        </Panel>
      </div>
    </>}
  </>;
}
