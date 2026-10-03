# Supply quality and provenance audit

Published quality `VALIDATED_WITH_QUARANTINE`: 323 records = 287 training-output + 36 infrastructure. Machine report `data/metadata/supply_quality.json`, also exposed through the quality API. No publication errors are present; known source exceptions remain explicit.

## Validation

- Registered source URL/ID and receipt checksum; immutable cached acquisition rejects changed artifacts.
- Exact expected HTML headers/table dimensions and identical responsive-copy deduplication; conflicting/missing copies fail closed.
- Existing PMKVY column reconciliation reused, including the known national exception.
- Nonnegative, integral, finite safe numbers; no boolean/coerced invalid counts.
- Unique observation IDs and source-record identities; geography ID/level agreement.
- Programme metric/category/unit consistency; no centres→capacity or trainees→workers conversion.
- Fiscal April–March/point date semantics, as-of/publication chronology and partial-period marking.
- Source ID/hash bound to every Evidence locator and transformation.
- Canonical records compared to reviewed raw-source regeneration, including values and metadata.
- Coverage regenerated from actual records; metadata cannot claim fabricated district/capacity coverage.
- Production reference/mapping collections rejected until a reviewed taxonomy adapter exists. Research metadata cannot stand in for canonical code evidence.
- Base-version and raw-hash manifest linkage; broken publication cannot silently fall back.

## Preserved quarantine

Country trained FY2024-25: published 2,038,319 versus State/UT sum 2,038,199; discrepancy 120. The country observation remains excluded. The source cell is retained in immutable raw material and the discrepancy in quality metadata. No replacement national total is published or generated. Existing base and demand checksums remain unchanged.

## Coverage exceptions and footnotes

Lakshadweep output is absent, not zero. Its infrastructure count is a different metric from a different release. FY2026-27 output is partial through 30 June 2026, not annualized. Certification cohorts may differ from trained cohorts; no conversion rate is calculated.

AP `527$`: original string retained; only the reviewed marker is removed for integral normalization. Six Konaseema centres are already included; no double counting or district split. Published merged-UT label normalization is documented, with original source label retained. No national centre sum is manufactured.

Taxonomy, skill/occupation/sector mapping, seats, annual throughput, workforce availability and all district supply remain unavailable. These are not quarantined fabricated records; there is no defensible observation to publish.

## Security/privacy and reproducibility

New public modules have no dependency on private accounts or resumes. There is no arbitrary upload/write endpoint or credential use. Sanitized API sources omit raw filesystem paths. No new runtime network calls, mock provider or simulation fallback exist. Isolated TEST-ONLY contract fixtures stay in tests.

Offline re-publication reproduces the supply snapshot checksum. Reference/status/coverage tampering, missing artifacts, duplicate records, source drift and unavailable dimensions are covered by backend tests. Existing auth/ownership/CSRF tests remain in the full suite. This is not a security certification or proof of complete labour-market coverage.
