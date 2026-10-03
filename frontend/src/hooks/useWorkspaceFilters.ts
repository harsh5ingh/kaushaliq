import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ExperienceLevel, IndustryId, RegionId, SkillCategory, SkillId, OccupationId } from "../data/labourMarket";
import type { Filters } from "../analytics/simulatedLabourMarket";

const regionIds = ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai", "kolkata", "ahmedabad"] as const;
const industryIds = ["technology", "finance", "healthcare", "manufacturing"] as const;
const occupationIds = ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "securityAnalyst", "financialAnalyst", "healthcareAnalyst", "productionSupervisor"] as const;
const skillIds = ["python", "analytics", "cloud", "cybersecurity", "ai", "digitalSales", "healthData", "robotics"] as const;
const categories = ["data", "software", "security", "business", "healthcare", "engineering"] as const;
const experiences = ["entry", "mid", "senior"] as const;
function member<T extends string>(value: string | null, values: readonly T[]): T | undefined { return values.find(item => item === value); }

export function useWorkspaceFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo<Filters>(() => ({
    range: member(searchParams.get("period"), ["6m", "12m", "all"] as const) ?? "all",
    regionId: member<RegionId>(searchParams.get("region"), regionIds),
    industryId: member<IndustryId>(searchParams.get("industry"), industryIds),
    occupationId: member<OccupationId>(searchParams.get("occupation"), occupationIds),
    skillId: member<SkillId>(searchParams.get("skill"), skillIds),
    category: member<SkillCategory>(searchParams.get("category"), categories),
    experience: member<ExperienceLevel>(searchParams.get("experience"), experiences),
  }), [searchParams]);
  function setFilter(key: "period" | "region" | "industry" | "occupation" | "skill" | "category" | "experience", value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  }
  function reset() { setSearchParams(new URLSearchParams({ data: "sample" }), { replace: true }); }
  return { filters, searchParams, setFilter, reset };
}
