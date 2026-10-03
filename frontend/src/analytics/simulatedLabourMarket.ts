import { observations, periods, skills, type ExperienceLevel, type IndustryId, type Observation, type OccupationId, type RegionId, type SkillCategory, type SkillId } from "../data/labourMarket";

export type PeriodRange = "6m" | "12m" | "all";
export interface Filters { range: PeriodRange; regionId?: RegionId; industryId?: IndustryId; occupationId?: OccupationId; skillId?: SkillId; category?: SkillCategory; experience?: ExperienceLevel }
export interface SeriesPoint { period: string; demand: number; supply: number; gap: number }
export interface RankPoint { id: string; score: number; supply: number; gap: number }
const rangeSize: Record<PeriodRange, number> = { "6m": 2, "12m": 4, all: periods.length };

export function queryObservations(filters: Filters): Observation[] {
  const floor = periods.length - rangeSize[filters.range];
  return observations.filter(item => item.periodIndex >= floor
    && (!filters.regionId || item.regionId === filters.regionId)
    && (!filters.industryId || item.industryId === filters.industryId)
    && (!filters.occupationId || item.occupationId === filters.occupationId)
    && (!filters.skillId || item.skillId === filters.skillId)
    && (!filters.category || skills.find(skill => skill.id === item.skillId)?.category === filters.category)
    && (!filters.experience || item.experience === filters.experience));
}

export function average(items: readonly Observation[], key: "demandIndex" | "supplyIndex" | "gapIndex"): number {
  return items.length ? items.reduce((sum, item) => sum + item[key], 0) / items.length : 0;
}

export function trendSeries(items: readonly Observation[]): SeriesPoint[] {
  return periods.map(period => {
    const group = items.filter(item => item.period === period.id);
    return { period: period.id, demand: Math.round(average(group, "demandIndex")), supply: Math.round(average(group, "supplyIndex")), gap: Math.round(average(group, "gapIndex")) };
  }).filter(point => items.some(item => item.period === point.period));
}

export function rankings(items: readonly Observation[], dimension: "skillId" | "regionId" | "industryId" | "occupationId", metric: "demandIndex" | "gapIndex" = "demandIndex"): RankPoint[] {
  const ids = new Set(items.map(item => item[dimension]));
  return [...ids].map(id => {
    const group = items.filter(item => item[dimension] === id);
    return { id, score: Math.round(average(group, metric)), supply: Math.round(average(group, "supplyIndex")), gap: Math.round(average(group, "gapIndex")) };
  }).sort((a, b) => b.score - a.score);
}

export function relatedIds(items: readonly Observation[], dimension: "skillId" | "industryId" | "occupationId" | "regionId"): string[] {
  return [...new Set(items.map(item => item[dimension]))];
}

export function scenarioSeries(items: readonly Observation[], factor: number): SeriesPoint[] {
  const history = trendSeries(items).slice(-2);
  const last = history.at(-1);
  if (!last) return [];
  const futureKeys = ["workspace.q2026q3", "workspace.q2026q4", "workspace.q2027q1", "workspace.q2027q2"];
  const projections = futureKeys.map((period, index) => {
    const steps = index + 1;
    const demand = Math.round(last.demand * (1 + factor) ** steps);
    const supply = Math.round(last.supply * 1.012 ** steps);
    return { period, demand, supply, gap: Math.max(0, demand - supply) };
  });
  return [...history, ...projections];
}

