# Deterministic comparability gate

All thirteen checks must pass. The engine performs no automatic unit conversion, imputation, title matching, temporal overlap/proration, district allocation or synthetic coverage.

1. Meaning/population: exactly one approved evidence-backed method for the native metric, semantic category and population pairing. Source versions are pinned. A vacancy stock and training output do not meet this requirement.
2. Units: exact compatible canonical units under that method; vacancies, persons, centres and seats are distinct.
3. Time: identical period type and exact start/end boundaries; neither input partial. Publication date is not observation date.
4. Geography: exact/documented mapping to the same identifier, level and nonempty canonical base version.
5–7. Occupation, skill and sector: all method-required or present classifications must have explicit versions and evidence. Equal system/code/version may match; differing identities need an approved confirmed EXACT_EQUIVALENCE or DOCUMENTED_CROSSWALK with versioned endpoints and source-checksum evidence. RELATED/PARENT_CHILD/PARTIAL/ambiguous/unreviewed links do not suffice. A selected skill/occupation/industry dimension requires its corresponding classification even if a method omits it.
8. Taxonomy: every required classification version is explicit.
9. Mappings: every required classification mapping passed review and provenance checks.
10. Granularity: geography levels and classification strata agree. Aggregate totals cannot populate finer dimensions.
11. Coverage: both inputs have explicit full coverage of the same measured population, supported by traceable coverage evidence. No unknown denominator or assumed coverage ratio.
12. Quality: VALID, no unresolved input flags, and OBSERVED or documented DERIVED inputs. WARNING, QUARANTINED, ESTIMATED and SCENARIO inputs cannot unlock arithmetic.
13. Sources: connected source, version, checksum and immutable canonical publication identity match retained Evidence.

READY means every condition passes. PARTIAL means both observations exist, no explicit incompatibility was found, but necessary evidence is missing; it still cannot calculate. NOT_READY covers explicit incompatibilities or missing observations. The legacy API projects these decisions into its established ten dimensions without relaxing the gate.

## Existing data

NCS counts are a historical administrative vacancy stock observed 14 July 2025. PMKVY trained/certified counts are fiscal-year training output; centres are infrastructure counted 30 June 2026. Native units, temporal semantics and populations differ. No authoritative occupation/skill crosswalk or comparable population coverage is connected. Result: **UNAVAILABLE / NOT_READY**.

Matching geography permits inspecting source context, not arithmetic. The current read model pairs exact canonical geography records without aggregation, downscaling or summing overlapping national/state records. Source-context assessment counts must not be described as jobs, workers or skill gaps.

Before enabling any future method, ingest and independently validate comparable measures, population definitions, classification versions, reviewed crosswalks, coverage and period/geography matching. Add a reviewed versioned method and source evidence; extend coverage/options for its supported dimensions. Do not make the method registry an implicit unit-based matcher.
