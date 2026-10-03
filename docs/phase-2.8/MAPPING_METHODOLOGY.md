# Mapping and reproducibility

Existing source acquisition, receipts, SHA-256 validation, HTML table parser, reviewed geography aliases and atomic JSON writer are reused. The optional registry argument leaves original acquisition behavior intact. The demand adapter is additive, not a second pipeline or labour model.

1. Verify source/terms registry metadata and raw receipts/checksums.
2. Require reviewed release identity, observation date and publication date, Annexure header, sequential rows and total shape.
3. Deduplicate identical responsive HTML table copies only. Conflicting copies, unexpected schema or duplicate labels stop publication; they are not averaged.
4. Extract native Active Vacancies strings and stable row locators into staging.
5. Validate numeric grouping, explicit unit, finite integral nonnegative bounds and duplicate row identity. Invalid/duplicate records are quarantined with reason/evidence. Source dash becomes UNAVAILABLE, not zero.
6. Normalize point period independently from publication/retrieval date and map geography against the existing canonical reference.
7. Require exact labels or explicitly reviewed alias (Total→India). Do not distribute multi-state/unspecified counts. Historical separate Daman & Diu is not assigned to today's merged UT. Source DNH dash remains absent.
8. Create independent occupation, skill and sector mapping records; source absence remains UNAVAILABLE. No codes inferred from titles.
9. Validate IDs, mappings, normalized/raw consistency, provenance, geography membership and published total reconciliation. Fail closed on reconciliation/schema drift; preserve the previous publication.
10. Publish strict canonical records, quality/coverage and a hash-bound manifest tied to the existing base version.

`data/staging/demand/extracted.json` retains the extracted rows, `data/processed/demand/validated.json` validated normalized signals, `data/canonical/demand/` snapshot and manifest, `data/metadata/demand_quality.json` and `demand_coverage.json` machine summaries. Raw files are acquired once and never modified by compilation. Build outputs are reproducible from those raw inputs. Build validates before writing publication artifacts; API manifest validation fails closed if deployment artifacts do not match.

## Authoritative taxonomy rules

An explicit source code in the identical target system can match only a versioned, evidence-bearing reference entry. A documented crosswalk additionally requires APPROVED review, evidence and an existing verified target. Conflicting targets are AMBIGUOUS with no selected code. Title-only matches are REQUIRES_REVIEW/AMBIGUOUS, never authoritative. Missing labels/codes are UNAVAILABLE; nonmatching supplied labels/codes remain UNMAPPED. Confidence is `confirmed` only for approved exact/documented mappings; no invented numerical confidence score.

Current source has no occupation/skill/sector dimensions: **zero NCO/NSQF/NOS/NIC demand mappings**. Exact/documented mapping logic is tested in isolated fixtures; test references never enter canonical production data.

The demand–supply readiness contract lists geography, occupation/skill, sector, period, unit, population and methodology. Current PLFS rates and PMKVY administrative counts are incompatible with NCS vacancy stock. No subtraction, gap, score, interpolation, forecast or estimated district allocation is performed.
