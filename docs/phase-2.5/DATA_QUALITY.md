# Data quality

Current published status: **VALIDATED_WITH_QUARANTINE**. See [machine-readable report](../../data/metadata/quality_report.json).

Checks: original raw checksum/receipt; expected table headings and age/status scope; exact row/column shapes; source encodings; Pydantic required fields and enums; percent bounds/nonnegative integral counts; valid date intervals; deterministic unique IDs; source/region/taxonomy references; evidence checksum linkage; code-prefix hierarchy; WPR≤LFPR for the same population; national PLFS cross-publication equality; training state totals; canonical manifest integrity. Wrong shapes or unexpected discrepancies abort publication. Missing numeric values are not filled.

Accepted: 1,341 PLFS rates; 287 PMKVY counts; 332 NIC references;37 regions. No occupation or skill rows.

## Explicit exclusions

- Chandigarh rural LFPR/WPR/UR: source blank, all3sex cells omitted (9 unavailable rates).
- Lakshadweep PMKVY: absent source row, no manufactured zero.
- National PMKVY FY2024-25 trained: published 2,038,319 vs state sum2,038,199, difference120. Quarantined national row only. Source/raw retained; state rows and other seven totals reconcile. UI surfaces the exception. No silent correction.
- NIC division02 absent; groups021–024 kept with null parent and documented transformation. No class/subclass/full-taxonomy claim.
- Post-January2025 PLFS not joined to pre-change history.
- DGE/NCO bulk reproduction not attempted pending terms/permission.

Raw → staging → processed → canonical is reproducible offline. Staging/processed checkpoints represent accepted extraction, not arbitrary source documents. Failed build writes `failed_build.json`; this is a diagnostic, never API data. The published snapshot remains unchanged on validation failure.

Tests exercise invalid values/dates/units/denominators/categories, duplicate IDs, invalid geography/provenance/parents, national disagreement, immutable cached acquisition, rejected restricted sources, missing vs zero, training quarantine, and identical offline rebuild hashes. Browser/API tests exercise 422 bounds, empty unsupported filters, known published rates, evidence, frontend failure without sample fallback and language/responsive handling.

This is validation against preserved source publications, not proof that publishers have no sampling/administrative errors. PLFS sampling estimates, temporal limits and training cohort/reporting limitations remain visible.
