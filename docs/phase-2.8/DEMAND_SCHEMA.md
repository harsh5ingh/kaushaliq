# Canonical demand contract

`backend/src/demand/models.py` defines strict `DemandSignal`, `TaxonomyMapping` and `DemandSnapshot`. Publication schema `demand-1.0`, transformation `ncs-active-stock-1.0`. Existing labour schema `1.0` is preserved byte-identical; the demand manifest binds its geography/base version.

Each signal preserves stable source-derived signal/source-record/provenance identifiers; source ID; reference period, start/end, explicit period type and observed date; separately stored publication date; canonical geography ID/level and original geography label/code; source and canonical occupation/skill/sector labels, codes and classification systems; metric, normalized value/unit and original value/unit; nullable direction; observation status; mapping and quality statuses; mapping IDs; raw SHA-256, row locator and transformation evidence.

No absent field is forced to a guessed classification or zero. IDs are stable SHA-256 digests of source identity and row identity, not random IDs. Geography IDs remain existing KaushalIQ internal references; they are **not invented official district/LGD codes**.

Observation statuses: `OBSERVED`, `DERIVED`, `ESTIMATED`, `SCENARIO`. Current publication is exclusively OBSERVED. No estimate, scenario or derived labour metric is published. API envelopes preserve a single actual status or MIXED for unlike future kinds; they do not relabel non-observed records OBSERVED. The current frontend deliberately rejects unsupported kinds. Future FORECAST is not disguised as an observed DemandSignal; the response contract currently declares forecast UNAVAILABLE.

Quality: VALID, WARNING, QUARANTINED, UNMAPPED, UNAVAILABLE. Mapping: EXACT, DOCUMENTED, AMBIGUOUS, UNMAPPED, REQUIRES_REVIEW, UNAVAILABLE. Confirmed mapping needs a target, method, reviewed evidence and approved review status. Unresolved mappings cannot assign targets. `geography_mapping_status` describes the explicit geographic match; overall taxonomy `mapping_status` remains UNAVAILABLE because NCS supplies no occupation/skill/sector classification. A valid geography does not imply an NCO mapping.

Explicit temporal normalization supports POINT, MONTH, QUARTER, Indian FISCAL_YEAR and CALENDAR_YEAR. Fiscal years start April, never silently substituted for PLFS July–June intervals. Cumulative-period contracts are reserved for explicitly supplied boundaries; no guessed cumulative interval is generated. Current source is POINT `2025-07-14`; it has no historical sequence.

Original vacancy text such as `40,05,028` is retained; Decimal parsing normalizes grouping. Vacancies/lakh vacancies/crore vacancies are supported with explicit conversion, integral finite nonnegative bounds and a safe browser integer limit. Employer counts, persons and percentage units are rejected by this vacancy adapter. Normalized values are stored separately and checked against the original on publication/read.

## Read APIs

- GET `/api/v1/intelligence/demand`: source-native records; version, data mode, methodology version, explicit status/reason, filtered total, public sources and unavailable forecast/gap contracts.
- `/coverage`: machine-readable source/dimension/role/level coverage, validation summary and data-backed filter options.
- `/sources`: publication and terms provenance with whitelisted metadata; no raw filesystem paths.
- `/occupations`: explicit unavailable breakdown and unresolved occupation mappings; no invented NCO reference or observed demand.
- `/geographies`: per-row geographic mappings plus source missingness.
- `/quality`: safe quality and mapping evidence.

Base query supports geography ID/level, occupation code/system, skill code, sector code, reference period, source, metric, quality, mapping status and observation status. Unsupported combinations return `status=UNAVAILABLE`, an explanation and `items=[]`, never zero-series substitutes. Limit 1–1000, offset nonnegative, filter strings bounded to 120 characters. Defaults expose at most 100 records (current publication 37). Data-aware filters do not offer unobserved taxonomy dimensions. All routes are public, read-only and independent of account/profile data.

Missing/corrupt/base-mismatched publications return 503 `DEMAND_PUBLICATION_UNAVAILABLE`. No download, simulation selection or account access is performed by reads. Frontend responses must bind each evidence hash to its source and use matching versions for observation/coverage queries; deployment races fail closed and can be retried. Cached indexed sets support common dimensions without a second database or N+1 requests.
