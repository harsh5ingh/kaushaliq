import { useLocale } from "../../hooks/usePreferences";
import { industries, occupations, regions, skills } from "../../data/labourMarket";
import { useWorkspaceFilters } from "../../hooks/useWorkspaceFilters";

type FilterName = "period" | "region" | "industry" | "occupation" | "skill" | "category" | "experience";
export function WorkspaceFilters({ visible = ["period", "region", "industry", "occupation", "skill", "category", "experience"] }: { visible?: readonly FilterName[] }) {
  const { t } = useLocale();
  const { filters, setFilter, reset } = useWorkspaceFilters();
  const fields: Record<FilterName, { label: string; value: string; options: readonly { value: string; label: string }[] }> = {
    period: { label: t("workspace.filterPeriod"), value: filters.range === "all" ? "" : filters.range,
      options: [{ value: "6m", label: t("workspace.last6Months") }, { value: "12m", label: t("workspace.last12Months") }] },
    region: { label: t("workspace.filterRegion"), value: filters.regionId ?? "", options: regions.map(item => ({ value: item.id, label: t(item.nameKey) })) },
    industry: { label: t("workspace.filterIndustry"), value: filters.industryId ?? "", options: industries.map(item => ({ value: item.id, label: t(item.nameKey) })) },
    occupation: { label: t("workspace.filterOccupation"), value: filters.occupationId ?? "", options: occupations.map(item => ({ value: item.id, label: t(item.nameKey) })) },
    skill: { label: t("workspace.filterSkill"), value: filters.skillId ?? "", options: skills.map(item => ({ value: item.id, label: t(item.nameKey) })) },
    category: { label: t("workspace.filterCategory"), value: filters.category ?? "", options: (["data", "software", "security", "business", "healthcare", "engineering"] as const).map(value => ({ value, label: t(`workspace.category.${value}`) })) },
    experience: { label: t("workspace.filterExperience"), value: filters.experience ?? "", options: (["entry", "mid", "senior"] as const).map(value => ({ value, label: t(`workspace.${value}`) })) },
  };
  const allLabels: Record<FilterName, string> = { period: t("workspace.allPeriods"), region: t("workspace.allRegions"), industry: t("workspace.allIndustries"), occupation: t("workspace.allOccupations"), skill: t("workspace.allSkills"), category: t("workspace.allCategories"), experience: t("workspace.allExperience") };
  const active = Object.values(filters).some((value, index) => index === 0 ? value !== "all" : Boolean(value));
  return <section className="workspace-filterbar" aria-label={t("workspace.filteredTo")}>
    {visible.map(name => { const field = fields[name]; return <label className="workspace-filter" key={name}>
      <span>{field.label}</span><select value={field.value} onChange={event => setFilter(name, event.target.value)} aria-label={field.label}>
        <option value="">{allLabels[name]}</option>{field.options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>; })}
    {active && <button type="button" className="button button-quiet filter-reset" onClick={reset}>{t("workspace.resetFilters")}</button>}
  </section>;
}
