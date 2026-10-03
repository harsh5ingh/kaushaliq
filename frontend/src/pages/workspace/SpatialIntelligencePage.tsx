import { useCallback, useState } from "react";
import { useLocale } from "../../hooks/usePreferences";
import { useWorkspaceFilters } from "../../hooks/useWorkspaceFilters";
import { regions, type RegionId } from "../../data/labourMarket";
import { average, queryObservations } from "../../analytics/simulatedLabourMarket";
import { WorkspaceFilters } from "../../components/workspace/WorkspaceFilters";
import { SpatialIntelligenceView, type SpatialNode } from "../../components/workspace/SpatialIntelligenceView";
import { Panel, SectionHeader } from "../../components/ui/Panel";
import { industries, skills } from "../../data/labourMarket";

const layerKeys = ["workforce", "skills", "industries", "occupations", "demand", "gaps"] as const;
type Layer = typeof layerKeys[number];
export function SpatialIntelligencePage() {
  const { t } = useLocale(); const { filters } = useWorkspaceFilters();
  const [layer, setLayer] = useState<Layer>("demand");
  const [selected, setSelected] = useState<RegionId>(filters.regionId ?? regions[0].id);
  const observationsForView = queryObservations(filters);
  const nodes: SpatialNode[] = regions.filter(region => !filters.regionId || region.id === filters.regionId).map(region => {
    const rows = observationsForView.filter(item => item.regionId === region.id);
    const layerValue: Record<Layer, number> = {
      workforce: region.weight * 100, skills: region.skillIds.length / 8 * 100, industries: region.industryIds.length / 4 * 100,
      occupations: region.occupationIds.length / 7 * 100, demand: average(rows, "demandIndex"), gaps: average(rows, "gapIndex") * 2,
    };
    return { id: region.id, label: t(region.nameKey), position: region.spatial, value: Math.min(100, Math.round(layerValue[layer])) };
  });
  const selectedRegion = regions.find(region => region.id === selected) ?? regions[0];
  const regionRows = observationsForView.filter(item => item.regionId === selectedRegion.id);
  const regionalSkills = [...new Set(regionRows.map(item => item.skillId))];
  const regionalIndustries = [...new Set(regionRows.map(item => item.industryId))];
  const choose = useCallback((id: RegionId) => setSelected(id), []);
  return <>
    <WorkspaceFilters visible={["period", "industry", "skill", "occupation", "experience"]} />
    <div className="scenario-disclosure"><span className="spatial-disclosure-mark" aria-hidden="true">◇</span><span>{t("workspace.spatialDisclosure")}</span></div>
    <div className="spatial-toolbar"><span>{t("workspace.spatialLayer")}</span><div role="group" aria-label={t("workspace.spatialLayer")} className="spatial-layer-controls">
      {layerKeys.map(key => <button key={key} type="button" className={layer === key ? "is-active" : ""} aria-pressed={layer === key} onClick={() => setLayer(key)}>{t(`workspace.layer.${key}`)}</button>)}
    </div></div>
    <div className="spatial-layout">
      <section className="spatial-visual-section" aria-label={t("workspace.spatialTitle")}>
        <SpatialIntelligenceView nodes={nodes} selected={selected} layer={layer} onSelect={choose} />
        <div className="spatial-node-list" aria-label={t("workspace.nodeSelect")}>
          {regions.filter(region => !filters.regionId || region.id === filters.regionId).map(region => <button key={region.id} type="button" aria-pressed={selected === region.id} onClick={() => choose(region.id)}>{t(region.nameKey)}</button>)}
        </div>
      </section>
      <Panel className="spatial-detail">
        <SectionHeader eyebrow={t("workspace.selectedRegion")} title={t(selectedRegion.nameKey)} />
        <p className="spatial-state-name">{t(selectedRegion.stateKey)}</p>
        <div className="spatial-index"><span>{t(`workspace.layer.${layer}`)}</span><strong>{nodes.find(item => item.id === selected)?.value ?? 0}</strong><small>{t("workspace.indexUnit")}</small></div>
        <div className="spatial-related"><div><span>{t("workspace.relatedIndustries")}</span><strong>{t(industries.find(item => item.id === regionalIndustries[0])?.nameKey ?? "entity.industry.technology")}</strong></div>
          <div><span>{t("workspace.relatedSkills")}</span><strong>{t(skills.find(item => item.id === regionalSkills[0])?.nameKey ?? "entity.skill.analytics")}</strong></div>
          <div><span>{t("workspace.avgDemand")}</span><strong>{Math.round(average(regionRows, "demandIndex"))}</strong></div>
        </div>
        <p className="workspace-caveat">{t("workspace.insightNote")}</p>
      </Panel>
    </div>
  </>;
}
