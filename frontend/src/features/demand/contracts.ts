import type { Evidence, Source } from "../real-intelligence/contracts";

export interface DemandSignal {
  signal_id: string; source_id: string; source_record_id: string; provenance_id: string;
  reference_period: string; period_start: string; period_end: string; publication_date: string;
  geography_id: string | null; geography_level: string; source_geography_label: string;
  metric: "active_vacancies"; value: number; unit: "vacancies"; original_value: string; original_unit: string;
  normalized_value: number; status: "OBSERVED"; quality_status: "VALID" | "WARNING"; mapping_status: string;
  occupation_code: string | null; skill_code: string | null; sector_code: string | null; evidence: Evidence;
}
export interface DemandResponse { version: string; status: "OBSERVED" | "UNAVAILABLE"; items: DemandSignal[]; total: number; sources: Source[] }
export interface DemandCoverage {
  version: string; sources: Source[];
  quality: { published_records: number; valid_records: number; warning_records: number; quarantined: { label: string; reason: string }[]; mapping_counts: Record<string, Record<string, number>> };
  options: { geographies: { geography_id: string; geography_level: string; name: string }[]; reference_period: string[]; geography_level: string[]; quality_status: string[] };
}

function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid demand contract"); return value as Record<string, unknown>; }
function list(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error("Invalid demand collection"); return value; }
function texts(row: Record<string, unknown>, keys: string[]) { if (keys.some(key => typeof row[key] !== "string")) throw new Error("Invalid demand metadata"); }
function count(value: unknown) { if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid observed count"); }
function base(value: unknown) { const row = object(value); texts(row, ["version", "methodology_version"]); if (row.data_mode !== "verified") throw new Error("Unverified demand response"); list(row.sources).forEach(s => { const source = object(s); texts(source, ["source_id", "publisher", "dataset_name", "url", "methodology", "notes"]); if (source.connected !== true) throw new Error("Unconnected demand source"); }); return row; }
export function decodeDemand(value: unknown): DemandResponse {
  const row = base(value); count(row.total); if (!["OBSERVED", "UNAVAILABLE"].includes(String(row.status))) throw new Error("Invalid demand status");
  list(row.items).forEach(item => {
    const r = object(item); texts(r, ["signal_id", "source_id", "reference_period", "source_geography_label", "period_start", "period_end", "publication_date", "original_value", "mapping_status"]); count(r.value);
    if (r.value !== r.normalized_value || r.status !== "OBSERVED" || r.metric !== "active_vacancies" || r.unit !== "vacancies" || !["VALID", "WARNING"].includes(String(r.quality_status)) || r.period_start !== r.period_end || (r.geography_id !== null && typeof r.geography_id !== "string") || r.occupation_code !== null || r.skill_code !== null || r.sector_code !== null) throw new Error("Unsupported demand observation");
    const ev = object(r.evidence); texts(ev, ["source_id", "locator", "raw_sha256"]); if (!/^[a-f0-9]{64}$/.test(String(ev.raw_sha256)) || !list(ev.transformations).every(v => typeof v === "string")) throw new Error("Invalid demand evidence");
    const source = list(row.sources).map(object).find(s => s.source_id === r.source_id);
    if (!source || ev.source_id !== r.source_id || source.sha256 !== ev.raw_sha256) throw new Error("Unbound demand source evidence");
  });
  if (row.status === "UNAVAILABLE" && list(row.items).length) throw new Error("Inconsistent empty demand state");
  return row as unknown as DemandResponse;
}
export function decodeDemandCoverage(value: unknown): DemandCoverage {
  const row = base(value), quality = object(row.quality), options = object(row.options);
  for (const key of ["published_records", "valid_records", "warning_records"]) count(quality[key]);
  list(quality.quarantined).forEach(v => texts(object(v), ["label", "reason"]));
  for (const counts of Object.values(object(quality.mapping_counts))) for (const n of Object.values(object(counts))) count(n);
  list(options.geographies).forEach(v => texts(object(v), ["geography_id", "name", "geography_level"]));
  for (const key of ["reference_period", "geography_level", "quality_status"]) if (!list(options[key]).every(v => typeof v === "string")) throw new Error("Invalid filter options");
  return row as unknown as DemandCoverage;
}
