import type { MessageKey } from "../app/i18n/config";

export type RegionId = "bengaluru" | "hyderabad" | "pune" | "mumbai" | "delhi" | "chennai" | "kolkata" | "ahmedabad";
export type IndustryId = "technology" | "finance" | "healthcare" | "manufacturing";
export type SkillId = "python" | "analytics" | "cloud" | "cybersecurity" | "ai" | "digitalSales" | "healthData" | "robotics";
export type OccupationId = "softwareDeveloper" | "dataAnalyst" | "cloudEngineer" | "securityAnalyst" | "financialAnalyst" | "healthcareAnalyst" | "productionSupervisor";
export type SkillCategory = "data" | "software" | "security" | "business" | "healthcare" | "engineering";
export type ExperienceLevel = "entry" | "mid" | "senior";
export type PeriodId = "2025-Q1" | "2025-Q2" | "2025-Q3" | "2025-Q4" | "2026-Q1" | "2026-Q2";

export interface Region { id: RegionId; nameKey: MessageKey; stateKey: MessageKey; weight: number; supplyFactor: number; growth: number; industryIds: IndustryId[]; skillIds: SkillId[]; occupationIds: OccupationId[]; spatial: readonly [number, number, number] }
export interface Industry { id: IndustryId; nameKey: MessageKey; demandFactor: number; growth: number; skillIds: SkillId[]; occupationIds: OccupationId[]; regionIds: RegionId[] }
export interface Skill { id: SkillId; nameKey: MessageKey; category: SkillCategory; demandFactor: number; supplyFactor: number; growth: number; industryIds: IndustryId[]; occupationIds: OccupationId[]; regionIds: RegionId[] }
export interface Occupation { id: OccupationId; nameKey: MessageKey; demandFactor: number; growth: number; skillIds: SkillId[]; industryIds: IndustryId[]; regionIds: RegionId[] }

export const periods: readonly { id: PeriodId; labelKey: MessageKey; demandFactor: number }[] = [
  { id: "2025-Q1", labelKey: "workspace.q2025q1", demandFactor: .78 }, { id: "2025-Q2", labelKey: "workspace.q2025q2", demandFactor: .81 },
  { id: "2025-Q3", labelKey: "workspace.q2025q3", demandFactor: .84 }, { id: "2025-Q4", labelKey: "workspace.q2025q4", demandFactor: .88 },
  { id: "2026-Q1", labelKey: "workspace.q2026q1", demandFactor: .92 }, { id: "2026-Q2", labelKey: "workspace.q2026q2", demandFactor: .96 },
];
export const experienceLevels: readonly { id: ExperienceLevel; labelKey: MessageKey; factor: number }[] = [
  { id: "entry", labelKey: "workspace.entry", factor: .76 }, { id: "mid", labelKey: "workspace.mid", factor: 1 }, { id: "senior", labelKey: "workspace.senior", factor: .68 },
];

export const regions: readonly Region[] = [
  { id: "bengaluru", nameKey: "entity.region.bengaluru", stateKey: "entity.state.karnataka", weight: 1, supplyFactor: .78, growth: 9.2, industryIds: ["technology", "finance"], skillIds: ["python", "analytics", "cloud", "cybersecurity", "ai", "digitalSales"], occupationIds: ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "securityAnalyst", "financialAnalyst"], spatial: [-1.5, 0, 1.2] },
  { id: "hyderabad", nameKey: "entity.region.hyderabad", stateKey: "entity.state.telangana", weight: .88, supplyFactor: .82, growth: 8.4, industryIds: ["technology", "healthcare", "manufacturing"], skillIds: ["python", "analytics", "cloud", "ai", "healthData", "robotics"], occupationIds: ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "healthcareAnalyst", "productionSupervisor"], spatial: [-.4, 0, .2] },
  { id: "pune", nameKey: "entity.region.pune", stateKey: "entity.state.maharashtra", weight: .81, supplyFactor: .84, growth: 7.7, industryIds: ["technology", "manufacturing", "finance"], skillIds: ["python", "analytics", "cloud", "cybersecurity", "robotics"], occupationIds: ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "financialAnalyst", "productionSupervisor"], spatial: [.5, 0, 1.1] },
  { id: "mumbai", nameKey: "entity.region.mumbai", stateKey: "entity.state.maharashtra", weight: .94, supplyFactor: .76, growth: 7.1, industryIds: ["finance", "technology", "healthcare"], skillIds: ["python", "analytics", "cloud", "cybersecurity", "digitalSales", "healthData"], occupationIds: ["softwareDeveloper", "dataAnalyst", "securityAnalyst", "financialAnalyst", "healthcareAnalyst"], spatial: [1.4, 0, .4] },
  { id: "delhi", nameKey: "entity.region.delhi", stateKey: "entity.state.delhi", weight: .91, supplyFactor: .8, growth: 7.9, industryIds: ["technology", "finance", "healthcare", "manufacturing"], skillIds: ["python", "analytics", "cloud", "cybersecurity", "ai", "digitalSales", "healthData"], occupationIds: ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "securityAnalyst", "financialAnalyst", "healthcareAnalyst"], spatial: [.2, 0, -1.7] },
  { id: "chennai", nameKey: "entity.region.chennai", stateKey: "entity.state.tamilNadu", weight: .83, supplyFactor: .86, growth: 6.8, industryIds: ["technology", "healthcare", "manufacturing"], skillIds: ["python", "analytics", "cloud", "healthData", "robotics"], occupationIds: ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "healthcareAnalyst", "productionSupervisor"], spatial: [1.2, 0, 1.7] },
  { id: "kolkata", nameKey: "entity.region.kolkata", stateKey: "entity.state.westBengal", weight: .68, supplyFactor: .9, growth: 5.8, industryIds: ["technology", "healthcare", "manufacturing"], skillIds: ["python", "analytics", "cybersecurity", "healthData", "robotics"], occupationIds: ["softwareDeveloper", "dataAnalyst", "securityAnalyst", "healthcareAnalyst", "productionSupervisor"], spatial: [1.6, 0, -1.1] },
  { id: "ahmedabad", nameKey: "entity.region.ahmedabad", stateKey: "entity.state.gujarat", weight: .72, supplyFactor: .88, growth: 6.3, industryIds: ["manufacturing", "finance", "healthcare"], skillIds: ["analytics", "cloud", "cybersecurity", "digitalSales", "healthData", "robotics"], occupationIds: ["dataAnalyst", "securityAnalyst", "financialAnalyst", "healthcareAnalyst", "productionSupervisor"], spatial: [-1.1, 0, -.6] },
];

export const industries: readonly Industry[] = [
  { id: "technology", nameKey: "entity.industry.technology", demandFactor: 1, growth: 8.4, skillIds: ["python", "analytics", "cloud", "cybersecurity", "ai", "digitalSales"], occupationIds: ["softwareDeveloper", "dataAnalyst", "cloudEngineer", "securityAnalyst"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai", "kolkata"] },
  { id: "finance", nameKey: "entity.industry.finance", demandFactor: .86, growth: 6.2, skillIds: ["python", "analytics", "cloud", "cybersecurity", "digitalSales"], occupationIds: ["dataAnalyst", "securityAnalyst", "financialAnalyst"], regionIds: ["bengaluru", "pune", "mumbai", "delhi", "ahmedabad"] },
  { id: "healthcare", nameKey: "entity.industry.healthcare", demandFactor: .78, growth: 7.1, skillIds: ["analytics", "cybersecurity", "ai", "healthData"], occupationIds: ["dataAnalyst", "securityAnalyst", "healthcareAnalyst"], regionIds: ["hyderabad", "mumbai", "delhi", "chennai", "kolkata", "ahmedabad"] },
  { id: "manufacturing", nameKey: "entity.industry.manufacturing", demandFactor: .82, growth: 5.6, skillIds: ["analytics", "cloud", "cybersecurity", "robotics"], occupationIds: ["dataAnalyst", "cloudEngineer", "securityAnalyst", "productionSupervisor"], regionIds: ["hyderabad", "pune", "delhi", "chennai", "kolkata", "ahmedabad"] },
];

export const skills: readonly Skill[] = [
  { id: "python", nameKey: "entity.skill.python", category: "software", demandFactor: 1, supplyFactor: .76, growth: 8.9, industryIds: ["technology", "finance"], occupationIds: ["softwareDeveloper", "dataAnalyst", "financialAnalyst"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai", "kolkata"] },
  { id: "analytics", nameKey: "entity.skill.analytics", category: "data", demandFactor: .96, supplyFactor: .84, growth: 7.4, industryIds: ["technology", "finance", "healthcare", "manufacturing"], occupationIds: ["dataAnalyst", "financialAnalyst", "healthcareAnalyst", "productionSupervisor"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai", "kolkata", "ahmedabad"] },
  { id: "cloud", nameKey: "entity.skill.cloud", category: "software", demandFactor: .88, supplyFactor: .72, growth: 9.1, industryIds: ["technology", "finance", "manufacturing"], occupationIds: ["softwareDeveloper", "cloudEngineer"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai"] },
  { id: "cybersecurity", nameKey: "entity.skill.cybersecurity", category: "security", demandFactor: .82, supplyFactor: .68, growth: 10.2, industryIds: ["technology", "finance", "healthcare", "manufacturing"], occupationIds: ["securityAnalyst", "cloudEngineer"], regionIds: ["bengaluru", "pune", "mumbai", "delhi", "kolkata", "ahmedabad"] },
  { id: "ai", nameKey: "entity.skill.ai", category: "data", demandFactor: .76, supplyFactor: .6, growth: 12.6, industryIds: ["technology", "healthcare"], occupationIds: ["softwareDeveloper", "dataAnalyst"], regionIds: ["bengaluru", "hyderabad", "delhi"] },
  { id: "digitalSales", nameKey: "entity.skill.digitalSales", category: "business", demandFactor: .72, supplyFactor: .88, growth: 5.8, industryIds: ["technology", "finance"], occupationIds: ["financialAnalyst"], regionIds: ["bengaluru", "mumbai", "delhi"] },
  { id: "healthData", nameKey: "entity.skill.healthData", category: "healthcare", demandFactor: .7, supplyFactor: .75, growth: 8.1, industryIds: ["healthcare"], occupationIds: ["healthcareAnalyst"], regionIds: ["hyderabad", "mumbai", "delhi", "chennai", "kolkata", "ahmedabad"] },
  { id: "robotics", nameKey: "entity.skill.robotics", category: "engineering", demandFactor: .68, supplyFactor: .64, growth: 9.7, industryIds: ["manufacturing"], occupationIds: ["productionSupervisor"], regionIds: ["hyderabad", "pune", "chennai", "kolkata", "ahmedabad"] },
];

export const occupations: readonly Occupation[] = [
  { id: "softwareDeveloper", nameKey: "entity.occupation.softwareDeveloper", demandFactor: 1, growth: 8.3, skillIds: ["python", "cloud", "ai"], industryIds: ["technology"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai", "kolkata"] },
  { id: "dataAnalyst", nameKey: "entity.occupation.dataAnalyst", demandFactor: .92, growth: 7.6, skillIds: ["python", "analytics", "ai"], industryIds: ["technology", "finance", "healthcare", "manufacturing"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai", "kolkata", "ahmedabad"] },
  { id: "cloudEngineer", nameKey: "entity.occupation.cloudEngineer", demandFactor: .82, growth: 9.6, skillIds: ["cloud", "cybersecurity"], industryIds: ["technology", "manufacturing"], regionIds: ["bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai"] },
  { id: "securityAnalyst", nameKey: "entity.occupation.securityAnalyst", demandFactor: .76, growth: 10.4, skillIds: ["cybersecurity"], industryIds: ["technology", "finance", "healthcare", "manufacturing"], regionIds: ["bengaluru", "pune", "mumbai", "delhi", "kolkata", "ahmedabad"] },
  { id: "financialAnalyst", nameKey: "entity.occupation.financialAnalyst", demandFactor: .78, growth: 6.4, skillIds: ["python", "analytics", "digitalSales"], industryIds: ["finance"], regionIds: ["bengaluru", "pune", "mumbai", "delhi", "ahmedabad"] },
  { id: "healthcareAnalyst", nameKey: "entity.occupation.healthcareAnalyst", demandFactor: .7, growth: 8.1, skillIds: ["analytics", "healthData"], industryIds: ["healthcare"], regionIds: ["hyderabad", "mumbai", "delhi", "chennai", "kolkata", "ahmedabad"] },
  { id: "productionSupervisor", nameKey: "entity.occupation.productionSupervisor", demandFactor: .74, growth: 5.9, skillIds: ["analytics", "robotics"], industryIds: ["manufacturing"], regionIds: ["hyderabad", "pune", "chennai", "kolkata", "ahmedabad"] },
];

export interface Observation { period: PeriodId; periodIndex: number; regionId: RegionId; industryId: IndustryId; skillId: SkillId; occupationId: OccupationId; experience: ExperienceLevel; demandIndex: number; supplyIndex: number; gapIndex: number }
const skillById = new Map(skills.map(item => [item.id, item]));
const occupationById = new Map(occupations.map(item => [item.id, item]));
const regionById = new Map(regions.map(item => [item.id, item]));
const experienceShare: Record<ExperienceLevel, number> = { entry: .76, mid: 1, senior: .68 };

// Deterministic local fixtures; these are simulated indices, not observed labour-market data.
export const observations: readonly Observation[] = industries.flatMap(industry => industry.skillIds.flatMap(skillId => {
  const skill = skillById.get(skillId)!;
  return industry.occupationIds.filter(id => skill.occupationIds.includes(id)).flatMap(occupationId => {
    const occupation = occupationById.get(occupationId)!;
    return industry.regionIds.filter(id => skill.regionIds.includes(id) && occupation.regionIds.includes(id)).flatMap(regionId => {
      const region = regionById.get(regionId)!;
      return periods.flatMap((period, periodIndex) => experienceLevels.map(experience => {
        const demandIndex = Math.round(42 * industry.demandFactor * skill.demandFactor * occupation.demandFactor * region.weight * period.demandFactor * experience.factor);
        const supplyIndex = Math.round(demandIndex * skill.supplyFactor * region.supplyFactor * experienceShare[experience.id]);
        return { period: period.id, periodIndex, regionId, industryId: industry.id, skillId, occupationId, experience: experience.id, demandIndex, supplyIndex, gapIndex: Math.max(0, demandIndex - supplyIndex) };
      }));
    });
  });
}));
