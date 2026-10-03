# Supply publication and API schema

Schema `supply-1.0`; transformation `pmkvy-output-infrastructure-1.0`. Canonical artifact `data/canonical/supply/snapshot.json`, with adjacent manifest. Base linkage and raw checksums are validated before indexed reads.

## SupplySignal

- Identity: `supply_signal_id`, `source_id`, `source_record_id`, `provenance_id`.
- Time: `reference_period`, `period_start`, `period_end`, `period_type`, nullable `observation_date`, `publication_date`, `as_of`, `partial`.
- Geography: existing `geography_id`, `geography_level`, original source label, geography mapping status.
- Classification: nullable occupation/skill/qualification/sector code-and-system pairs. All are null for current publications; absence is never filled from a title or the release context.
- Meaning: `metric`, `semantic_category`, `programme`, `population`, `unit`.
- Value: integral source-native `value`, original string `original_value`, `original_unit`, integral `normalized_value`.
- Status: OBSERVED/DERIVED/ESTIMATED/SCENARIO contract; current adapter permits OBSERVED only. Quality VALID/WARNING; current published rows VALID. Unavailable and quarantined records are outside the observation list.
- Method: `mapping_status`, `methodology_version`, shared `Evidence` with source ID, locator, raw hash and transformations.

Numbers are nonnegative safe integers; booleans, fractional/nonfinite values and unsupported unit/category pairs are rejected. Current normalization removes numeric grouping and the reviewed AP footnote marker only; it does not estimate values.

Output has FISCAL_YEAR April–March intervals, reported-person units and nullable point observation date. Infrastructure has POINT semantics on 2026-06-30, centre units and matching observation date. Publication and as-of remain separate. Partial FY2026-27 is never treated as completed FY output.

Only TRAINED, CERTIFIED and TRAINING_CENTRES occur in the dataset/API filter options. The extensible model reserves future metric/category types, but SEATS/CAPACITY/ENROLLED/COMPLETED/PLACEMENTS are not published as observations.

## Read endpoints

All use `/api/v1/intelligence`:

1. `GET /supply`: observations and explicit OBSERVED/UNAVAILABLE status.
2. `GET /supply/coverage`: record coverage and source-backed filter options.
3. `GET /supply/sources`: sanitized source DTOs.
4. `GET /supply/taxonomies`: `kind=occupation|skill|qualification|industry`; reference-only results, bounded search and pagination.
5. `GET /supply/quality`: reconciliation/quarantine/missing coverage.
6. `GET /compatibility`: deterministic dimension checks and evidence; optional demand/supply observation IDs.
7. `GET /gap/status`: assessment metadata with `gap_status=UNAVAILABLE`, `gap_value=null`; no arithmetic.

Supply filters: geography ID/level, reference period, metric, source ID, semantic category, quality status, occupation/skill/qualification/sector code. Field values are bounded to 120 characters. `limit=1..1000`, nonnegative offset. Unsupported combinations return empty items with an unavailable reason, not invented zeros. Reference filter options cannot imply observed classifications.

Each envelope includes publication version, methodology version, verified mode, unavailable capacity and sanitized sources. Observation evidence remains the existing Evidence shape. Internal raw paths/private account paths are omitted from source responses. Missing or inconsistent publication returns structured 503 `SUPPLY_PUBLICATION_UNAVAILABLE`, with no simulation fallback.

Existing `/api/v1/training`, `/api/v1/labour` and Phase 2.8 demand contracts are unchanged.
