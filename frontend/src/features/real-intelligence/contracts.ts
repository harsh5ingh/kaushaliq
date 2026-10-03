export interface Evidence { source_id: string; locator: string; raw_sha256: string; transformations: string[] }
export interface Source { source_id: string; publisher: string; dataset_name: string; url: string; license: string; license_url: string | null; version: string | null; observation_period: string | null; geography: string; granularity: string; methodology: string; notes: string; connected: boolean; retrieved_at?: string; sha256?: string }
export interface Region { region_id: string; name: string; source_name: string; parent_region_id: string | null; region_type: "country" | "state" | "ut"; official_code: string | null; geometry_reference: string | null; evidence: Evidence }
export interface Industry { industry_id: string; nic_code: string; name: string; level: "section" | "division" | "group"; parent_id: string | null; evidence: Evidence }
export interface Coverage { dimension: string; status: "OBSERVED" | "UNAVAILABLE"; source_ids: string[]; note: string }
export interface Catalog { schema_version: "1.0"; version: string; sources: Source[]; regions: Region[]; industries: Industry[]; occupations: unknown[]; skills: unknown[]; coverage: Coverage[]; quality: { status: string; records: Record<string, number>; quarantined: { source_id: string; period: string; indicator: string; difference: number }[] } }
export interface LabourObservation { observation_id: string; indicator: "LFPR" | "WPR" | "UR"; region_id: string; period: string; period_start: string; period_end: string; sex: "male" | "female" | "persons"; sector: "rural" | "urban" | "combined"; activity_status: "US" | "CWS"; age_group: "15+"; value: number; unit: "percent"; status: "OBSERVED"; denominator: string; methodology_version: "PLFS pre-January-2025"; evidence: Evidence }
export interface TrainingObservation { observation_id: string; region_id: string; period: string; indicator: "trained" | "certified"; value: number; partial: boolean; as_of: string; unit: "reported persons"; evidence: Evidence }
export interface Envelope<T> { items: T[]; total: number; status: "OBSERVED" | "UNAVAILABLE"; version: string }

// Validate network contracts rather than treating arbitrary JSON as trusted typed data.
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid data response");
  return value as Record<string, unknown>;
}
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error("Invalid collection"); return value; }
function strings(row: Record<string, unknown>, keys: string[]) { if (keys.some(key => typeof row[key] !== "string")) throw new Error("Invalid metadata"); }
function checkEvidence(value: unknown) { const row = object(value); strings(row, ["source_id", "locator", "raw_sha256"]); if (!array(row.transformations).every(v => typeof v === "string")) throw new Error("Invalid provenance"); }
export function decodeCatalog(value: unknown): Catalog {
  const row = object(value); strings(row, ["version", "schema_version"]); if (row.schema_version !== "1.0") throw new Error("Unsupported contract");
  array(row.regions).forEach(value => { const r = object(value); strings(r, ["region_id", "name", "source_name", "region_type"]); checkEvidence(r.evidence); });
  array(row.industries).forEach(value => { const r = object(value); strings(r, ["industry_id", "nic_code", "name", "level"]); checkEvidence(r.evidence); });
  array(row.sources).forEach(value => { const r = object(value); strings(r, ["source_id", "publisher", "url", "license", "dataset_name"]); if (typeof r.connected !== "boolean") throw new Error("Invalid source status"); });
  array(row.coverage).forEach(value => { const r = object(value); strings(r, ["dimension", "status", "note"]); array(r.source_ids); });
  array(row.skills); array(row.occupations); const quality = object(row.quality); strings(quality, ["status"]); object(quality.records); array(quality.quarantined);
  return row as unknown as Catalog;
}
export function decodeLabour(value: unknown): Envelope<LabourObservation> {
  const row = object(value); strings(row, ["version", "status"]);
  array(row.items).forEach(value => { const r = object(value); strings(r, ["observation_id", "indicator", "region_id", "period", "sex", "sector", "activity_status", "denominator", "period_start", "period_end", "methodology_version"]); if (r.status !== "OBSERVED" || r.unit !== "percent" || typeof r.value !== "number" || !Number.isFinite(r.value) || r.value < 0 || r.value > 100 || r.methodology_version !== "PLFS pre-January-2025" || !["LFPR", "WPR", "UR"].includes(String(r.indicator)) || !["US", "CWS"].includes(String(r.activity_status)) || !["persons", "female", "male"].includes(String(r.sex)) || !["rural", "urban", "combined"].includes(String(r.sector)) || r.age_group !== "15+" || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.period_start)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.period_end)) || String(r.period_start) > String(r.period_end)) throw new Error("Invalid observed rate"); checkEvidence(r.evidence); });
  return row as unknown as Envelope<LabourObservation>;
}
export function decodeTraining(value: unknown): Envelope<TrainingObservation> {
  const row = object(value); strings(row, ["version", "status"]);
  array(row.items).forEach(value => { const r = object(value); strings(r, ["observation_id", "region_id", "period", "indicator", "as_of"]); if (typeof r.value !== "number" || !Number.isSafeInteger(r.value) || r.value < 0 || typeof r.partial !== "boolean") throw new Error("Invalid training count"); checkEvidence(r.evidence); });
  return row as unknown as Envelope<TrainingObservation>;
}
