import type { Evidence, Source } from "../real-intelligence/contracts";
export type TrainingMetric = "TRAINED" | "CERTIFIED" | "TRAINING_CENTRES";
export interface SupplySignal {
  supply_signal_id: string; source_id: string; reference_period: string; period_start: string; period_end: string;
  period_type: "FISCAL_YEAR" | "POINT"; publication_date: string; as_of: string; partial: boolean;
  geography_id: string; geography_level: string; source_geography_label: string; metric: TrainingMetric;
  semantic_category: "TRAINING_OUTPUT" | "TRAINING_INFRASTRUCTURE"; value: number; normalized_value: number;
  unit: "persons" | "centres"; original_value: string; original_unit: string; status: "OBSERVED"; evidence: Evidence;
}
export interface SupplyResponse { version: string; items: SupplySignal[]; total: number; status: "OBSERVED" | "UNAVAILABLE"; sources: Source[] }
export interface SupplyCoverage {
  version: string; items: { dimension: string; status: string; national: number; state_ut: number; district: number; periods: string[] }[];
  quality: { output_records: number; infrastructure_records: number; quarantined: { period: string; difference: number }[] };
  options: { metric: TrainingMetric[]; reference_period: string[]; geography_level: string[]; geographies: { geography_id: string; geography_level: string; name: string }[]; metric_dimensions: Record<TrainingMetric, { geographies: string[]; periods: string[] }> };
}
export interface Compatibility {
  version: string; demand_version: string; status: "INCOMPATIBLE" | "UNAVAILABLE" | "INSUFFICIENT_EVIDENCE";
  checks: { dimension: string; status: string; reason_code: string }[]; reason_codes: string[]; gap_value: null; gap_status: "UNAVAILABLE";
  demand: { source_geography_label: string; reference_period: string; evidence: Evidence } | null; supply: SupplySignal | null; sources: Source[];
}
export interface Taxonomies {
  version: string; status: "REFERENCE_ONLY" | "UNAVAILABLE"; reference_only: true; total: number;
  items: { reference_id: string; code: string; title: string; taxonomy_system: string; taxonomy_version: string; parent_code: string | null; status: string; evidence: Evidence }[];
  taxonomy_sources: { taxonomy_source_id: string; publisher: string; name: string; status: string; source_url: string }[]; sources: Source[];
}
function object(v: unknown): Record<string, unknown> { if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Invalid supply contract"); return v as Record<string, unknown>; }
function list(v: unknown): unknown[] { if (!Array.isArray(v)) throw new Error("Invalid supply collection"); return v; }
function strings(r: Record<string, unknown>, keys: string[]) { if (keys.some(k => typeof r[k] !== "string")) throw new Error("Invalid supply metadata"); }
function count(v: unknown) { if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0) throw new Error("Invalid observed count"); }
function base(v: unknown) {
  const r = object(v); strings(r, ["version", "methodology_version"]); if (r.data_mode !== "verified") throw new Error("Unverified supply publication");
  list(r.sources).forEach(s => { const source = object(s); strings(source, ["source_id", "publisher", "dataset_name", "sha256", "methodology", "notes"]); if (source.connected !== true) throw new Error("Unconnected supply source"); });
  if (object(r.capacity).status !== "UNAVAILABLE") throw new Error("Unsupported capacity"); return r;
}
function evidence(v: unknown, sources: unknown[]) { const e = object(v); strings(e, ["source_id", "locator", "raw_sha256"]); const s = sources.map(object).find(s => s.source_id === e.source_id); if (!s || s.sha256 !== e.raw_sha256 || !list(e.transformations).every(v => typeof v === "string")) throw new Error("Unbound supply evidence"); }
export function decodeSupply(v: unknown): SupplyResponse {
  const r = base(v); count(r.total); if (!["OBSERVED", "UNAVAILABLE"].includes(String(r.status))) throw new Error("Invalid supply status");
  list(r.items).forEach(v => { const row = object(v); strings(row, ["supply_signal_id", "source_id", "reference_period", "period_start", "period_end", "publication_date", "as_of", "source_geography_label", "geography_id", "original_value", "original_unit"]); count(row.value);
    const centres = row.metric === "TRAINING_CENTRES";
    if (row.status !== "OBSERVED" || !["TRAINED", "CERTIFIED", "TRAINING_CENTRES"].includes(String(row.metric)) || row.value !== row.normalized_value || typeof row.partial !== "boolean" || row.unit !== (centres ? "centres" : "persons") || row.semantic_category !== (centres ? "TRAINING_INFRASTRUCTURE" : "TRAINING_OUTPUT") || row.period_type !== (centres ? "POINT" : "FISCAL_YEAR") || ["occupation_code", "skill_code", "qualification_code", "sector_code"].some(k => row[k] !== null)) throw new Error("Unsupported supply semantics");
    if (String(row.period_start) > String(row.period_end) || String(row.as_of) > String(row.publication_date) || (centres && row.period_start !== row.period_end)) throw new Error("Invalid training chronology");
    evidence(row.evidence, list(r.sources)); if (object(row.evidence).source_id !== row.source_id) throw new Error("Mismatched observation source");
  }); if (r.status === "UNAVAILABLE" && list(r.items).length) throw new Error("False unavailable state"); return r as unknown as SupplyResponse;
}
export function decodeCoverage(v: unknown): SupplyCoverage {
  const r = base(v), options = object(r.options), quality = object(r.quality);
  count(quality.output_records); count(quality.infrastructure_records); list(quality.quarantined).forEach(v => count(object(v).difference));
  list(options.geographies).forEach(v => strings(object(v), ["geography_id", "name", "geography_level"]));
  for (const key of ["metric", "reference_period", "geography_level"]) if (!list(options[key]).every(v => typeof v === "string")) throw new Error("Invalid filters");
  for (const dimensions of Object.values(object(options.metric_dimensions))) { const d = object(dimensions); if (![...list(d.geographies), ...list(d.periods)].every(v => typeof v === "string")) throw new Error("Invalid metric dimensions"); }
  list(r.items).forEach(v => { const c = object(v); strings(c, ["dimension", "status"]); for (const k of ["national", "state_ut", "district"]) count(c[k]); });
  return r as unknown as SupplyCoverage;
}
export function decodeCompatibility(v: unknown): Compatibility {
  const r = base(v); strings(r, ["demand_version"]); if (r.gap_status !== "UNAVAILABLE" || r.gap_value !== null || !["INCOMPATIBLE", "UNAVAILABLE", "INSUFFICIENT_EVIDENCE"].includes(String(r.status))) throw new Error("Unsupported gap claim");
  list(r.checks).forEach(v => strings(object(v), ["dimension", "status", "reason_code"]));
  if (r.demand) evidence(object(r.demand).evidence, list(r.sources)); if (r.supply) evidence(object(r.supply).evidence, list(r.sources));
  return r as unknown as Compatibility;
}
export function decodeTaxonomies(v: unknown): Taxonomies {
  const r = base(v); count(r.total); if (r.reference_only !== true || !["REFERENCE_ONLY", "UNAVAILABLE"].includes(String(r.status))) throw new Error("Reference is not demand");
  list(r.items).forEach(v => { const row = object(v); strings(row, ["reference_id", "code", "title", "taxonomy_system", "taxonomy_version", "status"]); evidence(row.evidence, list(r.sources)); });
  list(r.taxonomy_sources).forEach(v => strings(object(v), ["taxonomy_source_id", "publisher", "name", "status", "source_url"])); return r as unknown as Taxonomies;
}
