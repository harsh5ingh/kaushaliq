import { useLocale } from "../../hooks/usePreferences";
import { useWorkspaceFilters } from "../../hooks/useWorkspaceFilters";
import { industries, occupations, regions, skills, type IndustryId, type OccupationId, type RegionId, type SkillId } from "../../data/labourMarket";
import { average, queryObservations, rankings, trendSeries } from "../../analytics/simulatedLabourMarket";
import { WorkspaceFilters } from "../../components/workspace/WorkspaceFilters";
import { WorkspaceMetrics } from "../../components/workspace/WorkspaceMetrics";
import { RankingChart, TrendChart } from "../../components/workspace/AnalyticsCharts";
import { RelationshipList } from "../../components/workspace/RelationshipList";
import { ChartCard } from "../../components/charts/ChartCard";
import { Panel } from "../../components/ui/Panel";
import type { MessageKey } from "../../app/i18n/config";
import type { Filters } from "../../analytics/simulatedLabourMarket";
import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";

type ProfileKind = "skill" | "region" | "industry" | "occupation";
function ProfileSelector({ kind, value, label, options }: { kind: ProfileKind; value: string; label: string; options: readonly { id: string; nameKey: MessageKey }[] }) {
  const { t } = useLocale();
  const [, setParams] = useSearchParams();
  function change(event: ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(window.location.search);
    if (event.target.value) next.set(kind, event.target.value); else next.delete(kind);
    setParams(next, { replace: true });
  }
  return <label className="profile-selector"><span>{label}</span><select value={value} onChange={change} aria-label={label}>
    {options.map(item => <option key={item.id} value={item.id}>{t(item.nameKey)}</option>)}
  </select></label>;
}

function ProfileLayout({ kind, title, intro, selectLabel, options, id, nameKey, growth, filters, visibleFilters, related, dataDimension }: {
  kind: ProfileKind; title: MessageKey; intro: MessageKey; selectLabel: MessageKey;
  options: readonly { id: string; nameKey: MessageKey }[]; id: string; nameKey: MessageKey; growth: number;
  filters: Filters; visibleFilters: readonly ("period" | "region" | "industry" | "occupation" | "skill" | "category" | "experience")[];
  related: { skills: string[]; occupations: string[]; industries: string[]; regions: string[] }; dataDimension: "skillId" | "regionId" | "industryId" | "occupationId";
}) {
  const { t } = useLocale();
  const entityFilters = { ...filters, [kind === "region" ? "regionId" : kind === "industry" ? "industryId" : kind === "occupation" ? "occupationId" : "skillId"]: id } as Filters;
  const rows = queryObservations(entityFilters);
  const trend = trendSeries(rows);
  const comparison = rankings(rows, dataDimension === "regionId" ? "skillId" : "regionId", "gapIndex");
  const formattedGrowth = `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;
  return <>
    <WorkspaceFilters visible={visibleFilters} />
    <div className="profile-toolbar"><ProfileSelector kind={kind} value={id} label={t(selectLabel)} options={options} />
      <span className="profile-entity-name">{t(nameKey)}</span></div>
    <WorkspaceMetrics items={[
      { label: "workspace.avgDemand", value: Math.round(average(rows, "demandIndex")), note: "workspace.indexUnit" },
      { label: "workspace.avgSupply", value: Math.round(average(rows, "supplyIndex")), note: "workspace.indexUnit" },
      { label: "workspace.avgGap", value: Math.round(average(rows, "gapIndex")), note: "workspace.indexUnit" },
      { label: "workspace.growthRate", value: formattedGrowth, note: "workspace.insightNote", tone: "positive" },
    ]} />
    {!rows.length ? <Panel><p role="status">{t("workspace.noObservations")}</p></Panel> : <>
      <div className="workspace-grid workspace-grid-primary">
        <ChartCard title={t("workspace.demandVsSupply")} subtitle={t(intro)} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}>
          <TrendChart data={trend} title={t(title)} />
        </ChartCard>
        <ChartCard title={t("workspace.topSkillGap")} subtitle={t("workspace.rankingDescription")} source={t("workspace.dataStatus")} period={t("workspace.indexUnit")}>
          <RankingChart data={comparison} title={t("workspace.topSkillGap")} />
        </ChartCard>
      </div>
      <div className="workspace-grid workspace-grid-secondary">
        <RelationshipList titleKey="workspace.relatedSkills" kind="skills" ids={related.skills} filterKey="skill" />
        <RelationshipList titleKey="workspace.relatedOccupations" kind="occupations" ids={related.occupations} filterKey="occupation" />
        <RelationshipList titleKey="workspace.relatedIndustries" kind="industries" ids={related.industries} filterKey="industry" />
        <RelationshipList titleKey="workspace.relatedRegions" kind="regions" ids={related.regions} filterKey="region" />
      </div>
    </>}
  </>;
}

export function SkillsIntelligencePage() {
  const { filters } = useWorkspaceFilters();
  const base = queryObservations({ ...filters, skillId: undefined });
  const id = filters.skillId ?? rankings(base, "skillId")[0]?.id ?? skills[0].id;
  const skill = skills.find(item => item.id === id as SkillId) ?? skills[0];
  return <ProfileLayout kind="skill" title="workspace.skillsTitle" intro="workspace.skillsIntro" selectLabel="workspace.filterSkill" options={skills} id={skill.id} nameKey={skill.nameKey} growth={skill.growth} filters={filters} visibleFilters={["period", "region", "industry", "occupation", "category", "experience"]} related={{ skills: [skill.id], occupations: skill.occupationIds, industries: skill.industryIds, regions: skill.regionIds }} dataDimension="skillId" />;
}

export function RegionsIntelligencePage() {
  const { filters } = useWorkspaceFilters();
  const id = filters.regionId ?? regions[0].id;
  const region = regions.find(item => item.id === id as RegionId) ?? regions[0];
  return <ProfileLayout kind="region" title="workspace.regionsTitle" intro="workspace.regionsIntro" selectLabel="workspace.filterRegion" options={regions} id={region.id} nameKey={region.nameKey} growth={region.growth} filters={filters} visibleFilters={["period", "industry", "skill", "occupation", "experience"]} related={{ skills: region.skillIds, occupations: region.occupationIds, industries: region.industryIds, regions: [region.id] }} dataDimension="regionId" />;
}

export function IndustriesIntelligencePage() {
  const { filters } = useWorkspaceFilters();
  const id = filters.industryId ?? industries[0].id;
  const industry = industries.find(item => item.id === id as IndustryId) ?? industries[0];
  return <ProfileLayout kind="industry" title="workspace.industriesTitle" intro="workspace.industriesIntro" selectLabel="workspace.filterIndustry" options={industries} id={industry.id} nameKey={industry.nameKey} growth={industry.growth} filters={filters} visibleFilters={["period", "region", "occupation", "skill", "experience"]} related={{ skills: industry.skillIds, occupations: industry.occupationIds, industries: [industry.id], regions: industry.regionIds }} dataDimension="industryId" />;
}

export function OccupationsIntelligencePage() {
  const { filters } = useWorkspaceFilters();
  const id = filters.occupationId ?? occupations[0].id;
  const occupation = occupations.find(item => item.id === id as OccupationId) ?? occupations[0];
  return <ProfileLayout kind="occupation" title="workspace.occupationsTitle" intro="workspace.occupationsIntro" selectLabel="workspace.filterOccupation" options={occupations} id={occupation.id} nameKey={occupation.nameKey} growth={occupation.growth} filters={filters} visibleFilters={["period", "region", "industry", "skill", "experience"]} related={{ skills: occupation.skillIds, occupations: [occupation.id], industries: occupation.industryIds, regions: occupation.regionIds }} dataDimension="occupationId" />;
}
