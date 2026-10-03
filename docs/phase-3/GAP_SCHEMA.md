# Canonical gap contract

`backend/src/gaps/models.py` defines strict Pydantic models with unknown fields rejected. `GapPage` and `GapEvidenceResponse` are the FastAPI response schemas; frontend decoders validate network responses before rendering arithmetic.

## Inputs and original observations

`GapMeasure` is a read-only projection, not a second demand or supply dataset. It retains signal/source/source-record/provenance identifiers; source version and immutable publication hash; reference period, exact dates and period type; observation/as-of/publication dates; geography identifier/level/base version and source label/code; metric, population and semantic category; source-normalized value plus original value/unit; quality and status; classifications, explicit coverage and Evidence. Missing population, classifications, mappings or coverage remain null/absent. Counts of published records are never population coverage.

Classification identities include code, system, version, mapping status and evidence. Existing approved mapping contracts are reused. Consumed crosswalks retain their complete `MappingRelationship` metadata in `mapping_references`, their evidence in the result, and their identifiers/versions in transformation steps.

## Reviewed calculation method

`CalculationMethod` pins approved demand/supply metrics, semantic categories, populations, units, allowed dimensions, required classifications, source versions, methodology, evidence and limitations. The production `APPROVED_METHODS` registry is empty. Methods are server-side reviewed configuration/code, never a query parameter, upload or frontend approval switch. Test methods occur only in isolated automated fixtures.

## Results

`GapResult` contains a stable result identifier, dimension, original input measures, READY/PARTIAL/NOT_READY, compatibility status, thirteen checks with machine reasons and explanations, quality flags, source/mapping evidence, method/version, engine version, reproducible steps and limitations.

Only READY may contain `gap_status=DERIVED`, `gap_value`, `uncovered_amount`, `coverage_ratio` and `gap_direction`. Non-ready results require all four arithmetic fields to be null and `gap_status=UNAVAILABLE`. The result validator rejects missing/duplicated checks and arithmetic inconsistent with preserved inputs.

Arithmetic uses Decimal representations of canonical numeric inputs: demand minus supply; uncovered=max(difference,0); supply/demand. The API serializes finite numbers, with inputs bounded to JavaScript's safe numeric range. Negative differences are a measured surplus, not a negative uncovered amount. Zero demand leaves coverage null with `ZERO_DEMAND_DENOMINATOR`; coverage is not capped at 100%. No forecasting or causal inference is performed.

## Public APIs

- `GET /api/v1/intelligence/gaps`: bounded, filtered assessments. Filters: dimension, geography_id/level, common reference_period, skill/occupation/sector code, readiness, quality_status, gap_direction; limit 1–500, offset≥0. Defaults to skill assessments across paired geographies. The UI starts with national source context.
- `/gaps/coverage`: machine-readable capability coverage and connected filter options.
- `/gaps/quality`: assessment/reason counts and existing supply quality/quarantine metadata.
- `/gaps/evidence?result_id=…&dimension=…`: exact version-bound assessment with safe source metadata; absent identity is 404.
- Existing `/compatibility` and `/gap/status` remain available with their ten-check legacy DTO, delegated to the same engine. No duplicate compatibility API was added.

Page states are READY, PARTIAL, NOT_READY, EMPTY or UNAVAILABLE; publication failures are structured 503 errors. EMPTY is a valid query with no paired records, not a measured zero. All responses include verified data mode and demand/supply/base publication identities. No raw filesystem path, account, session or resume field is exposed.
