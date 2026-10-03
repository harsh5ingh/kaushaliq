import type { Evidence, Source } from '../real-intelligence/contracts';
export type Readiness = 'READY' | 'PARTIAL' | 'NOT_READY';
export type Dimension = 'skill' | 'occupation' | 'industry' | 'geography';
export interface GapMeasure {
  signal_id: string; source_id: string; source_record_id: string; provenance_id: string; source_version: string;
  publication_version: string; reference_period: string; period_start: string; period_end: string; period_type: string;
  geography_id: string | null; geography_level: string; geography_version: string; source_geography_label: string;
  metric: string; semantic_category: string; population: string | null; value: number; normalized_value: number;
  unit: string; original_value: string; original_unit: string; status: 'OBSERVED' | 'DERIVED'; quality_status: string;
  classifications: Record<string, { code: string; system: string; version: string | null }>;
  coverage_fraction: number | null; coverage_population: string | null; coverage_evidence: Evidence | null;
  evidence: Evidence;
}
export interface GapAssessment {
  schema_version: 'gap-1.0'; result_id: string; dimension_type: Dimension; dimension_id: string | null;
  readiness: Readiness; compatibility_status: string; gap_status: 'DERIVED' | 'UNAVAILABLE';
  demand: GapMeasure | null; supply: GapMeasure | null; gap_value: number | null; uncovered_amount: number | null;
  coverage_ratio: number | null; gap_direction: 'SHORTFALL' | 'SURPLUS' | 'BALANCED' | null;
  quality_status: string; quality_flags: string[]; checks: { dimension: string; status: 'COMPATIBLE' | 'INCOMPATIBLE' | 'INSUFFICIENT_EVIDENCE'; reason_code: string; explanation: string }[];
  reason_codes: string[]; method_id: string | null; method_version: string | null; engine_version: string; methodology: string | null;
  transformations: string[]; evidence: Evidence[]; limitations: string[];
}
export interface GapEnvelope {
  version: string; demand_version: string; supply_version: string; base_version: string; data_mode: 'verified'; sources: Source[];
}
export interface GapResponse extends GapEnvelope {
  status: Readiness | 'EMPTY' | 'UNAVAILABLE'; gap_status: 'DERIVED' | 'UNAVAILABLE'; readiness: Readiness;
  total: number; calculated_total: number; items: GapAssessment[]; dimension: Dimension;
}
export interface GapCoverage extends GapEnvelope {
  options: { geographies: { geography_id: string; name: string; geography_level: string }[]; reference_period: string[];
    skill_code: string[]; occupation_code: string[]; sector_code: string[]; readiness: Readiness[]; quality_status: string[]; gap_direction: string[] };
  items: { dimension: string; readiness: Readiness; gap_status: 'DERIVED' | 'UNAVAILABLE'; calculated_records: number }[];
}
const dims = ['metric','unit','time','geography','occupation','skill','sector','taxonomy','mapping','granularity','coverage','quality','source'];
function obj(v: unknown): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid gap metadata'); return v as Record<string, unknown>; }
function list(v: unknown): unknown[] { if (!Array.isArray(v)) throw new Error('Invalid gap collection'); return v; }
function strings(v: Record<string, unknown>, keys: string[]) { if (keys.some(k => typeof v[k] !== 'string')) throw new Error('Invalid gap strings'); }
function evidence(v: unknown, sources: Source[]) { const e = obj(v); strings(e,['source_id','locator','raw_sha256']); if (!/^[a-f0-9]{64}$/.test(String(e.raw_sha256))) throw new Error('Invalid checksum'); list(e.transformations).forEach(s => { if(typeof s !== 'string') throw new Error('Invalid transformation'); }); const source = sources.find(s => s.source_id === e.source_id); if(!source?.connected || source.sha256 !== e.raw_sha256) throw new Error('Untraceable evidence'); }
function envelope(v: unknown) { const r = obj(v); strings(r,['version','demand_version','supply_version','base_version']); if(r.data_mode !== 'verified') throw new Error('No simulation'); const sources = list(r.sources) as Source[]; sources.forEach(s => { strings(obj(s),['source_id','dataset_name','publisher','url','license']); }); return { r, sources }; }
function measure(v: unknown, sources: Source[]) { if(v === null) return null; const r = obj(v); strings(r,['signal_id','source_id','source_record_id','provenance_id','source_version','publication_version','reference_period','period_start','period_end','geography_level','geography_version','metric','unit','original_value','original_unit','quality_status']); if(typeof r.value !== 'number' || !Number.isFinite(r.value) || r.value < 0 || r.value > Number.MAX_SAFE_INTEGER || r.normalized_value !== r.value || String(r.period_end) < String(r.period_start)) throw new Error('Invalid source measure'); evidence(r.evidence,sources); obj(r.classifications); return r as unknown as GapMeasure; }
export function decodeGaps(v: unknown): GapResponse {
  const {r,sources} = envelope(v);
  if(!['READY','PARTIAL','NOT_READY','EMPTY','UNAVAILABLE'].includes(String(r.status)) || !Number.isSafeInteger(r.total) || !Number.isSafeInteger(r.calculated_total)) throw new Error('Invalid gap state');
  list(r.items).forEach(value => {
    const a = obj(value); strings(a,['result_id','engine_version','compatibility_status','quality_status']);
    if(a.schema_version !== 'gap-1.0' || !['READY','PARTIAL','NOT_READY'].includes(String(a.readiness))) throw new Error('Unsupported gap schema');
    const d = measure(a.demand,sources), s = measure(a.supply,sources); const checks = list(a.checks).map(obj);
    checks.forEach(c => { strings(c,['dimension','reason_code','explanation']); if(![...dims,'observations'].includes(String(c.dimension)) || !['COMPATIBLE','INCOMPATIBLE','INSUFFICIENT_EVIDENCE'].includes(String(c.status))) throw new Error('Invalid check'); });
    list(a.evidence).forEach(e => evidence(e,sources)); list(a.transformations); list(a.limitations); list(a.quality_flags); list(a.reason_codes);
    if(a.readiness !== 'READY') { if(a.gap_status !== 'UNAVAILABLE' || [a.gap_value,a.coverage_ratio,a.uncovered_amount,a.gap_direction].some(n => n !== null)) throw new Error('Non-ready arithmetic forbidden'); }
    else {
      if(!d || !s || a.gap_status !== 'DERIVED' || a.compatibility_status !== 'COMPATIBLE' || !a.method_id || !a.method_version || !a.methodology || a.quality_status !== 'VALID'
        || dims.some(dim => checks.filter(c => c.dimension === dim && c.status === 'COMPATIBLE').length !== 1) || checks.length !== dims.length
        || d.unit !== s.unit || d.period_type !== s.period_type || d.period_start !== s.period_start || d.period_end !== s.period_end
        || d.geography_id !== s.geography_id || d.geography_level !== s.geography_level || d.geography_version !== s.geography_version
        || d.coverage_fraction !== 1 || s.coverage_fraction !== 1 || !d.coverage_population || d.coverage_population !== s.coverage_population
        || !['OBSERVED','DERIVED'].includes(d.status) || !['OBSERVED','DERIVED'].includes(s.status) || d.quality_status !== 'VALID' || s.quality_status !== 'VALID') throw new Error('Unreviewed calculation');
      evidence(d.coverage_evidence,sources); evidence(s.coverage_evidence,sources);
      const gap = d.value - s.value, ratio = d.value === 0 ? null : s.value / d.value;
      if(typeof a.gap_value !== 'number' || !Number.isFinite(a.gap_value) || Math.abs(a.gap_value-gap) > Number.EPSILON*Math.max(1,Math.abs(gap))*4
        || a.uncovered_amount !== Math.max(a.gap_value,0) || a.coverage_ratio !== ratio
        || a.gap_direction !== (gap > 0 ? 'SHORTFALL' : gap < 0 ? 'SURPLUS' : 'BALANCED')) throw new Error('Invalid arithmetic');
    }
  });
  return r as unknown as GapResponse;
}
export function decodeGapCoverage(v: unknown): GapCoverage {
  const {r} = envelope(v), o = obj(r.options);
  list(o.geographies).forEach(g => strings(obj(g),['geography_id','name','geography_level']));
  for(const k of ['reference_period','skill_code','occupation_code','sector_code','readiness','quality_status','gap_direction']) list(o[k]);
  list(r.items).forEach(i => strings(obj(i),['dimension','readiness','gap_status']));
  return r as unknown as GapCoverage;
}
