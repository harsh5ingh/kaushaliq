# Phase 2.8 — Core LMIS demand foundation

Phase 2.8 adds the first source-native demand publication and a read-only intelligence experience. It does not claim a complete demand–supply or forecasting engine.

## Implemented

- Audited prior data/account/visualization reports and existing source/pipeline/provider/test architecture; recorded plan before code changes.
- Acquired the official NCS/PIB active-vacancy Annexure and copyright-policy artifacts with existing immutable acquisition/receipt/checksum handling.
- Added strict canonical demand and mapping contracts, deterministic count/time/geography normalization, reviewed taxonomy mapping rules, quarantine, reconciliation and source/coverage/quality publication.
- Preserved raw values, units, observation versus publication dates, source locators and transformations. Separately bound demand publication to the unchanged Phase2.5 base dataset.
- Added public read APIs and cached dimension indexes. Empty/incompatible queries are explicitly unavailable; broken publication is a 503, never simulated replacement.
- Upgraded `/demand` using the existing real-mode provider boundary, theme/localization/API/visualization/evidence primitives. Actual counts, geography/period/quality filters, State/UT comparisons, unassigned source buckets, keyboard evidence and a structured table. One-point trend, taxonomy, district, gap and forecast coverage remain honestly unavailable.
- Added central English/Hindi resources. Published official names/methodology remain in their source language with the existing explanatory note.
- Linked Reports demand coverage to the current demand publication instead of presenting the old base catalog's demand-unavailable flag as current. Updated workspace source disclosure without changing other observed values.

No dependencies, database, scraping infrastructure, account endpoints, auth behavior, AI/ML, 3D/GIS, composite demand index or forecasting were added. Optional backend `DEMAND_DATA_PATH` override uses centralized settings; default reads the locally published snapshot. No frontend environment variable or secret is introduced.

## Architecture and alignment

Reuse: acquisition/registry validation/parser/geography aliases/atomic writer; existing base repository and published regions; FastAPI/client conventions; real-mode shell; VisualizationFrame, StatusBadge, EvidencePanel; semantic styles and bilingual resources. Do not rebuild pipeline/auth/homepage or create a competing labour dataset. New demand repository holds public aggregate data only; private account SQLite remains separate.

Preserved: PLFS/NIC/PMKVY values and canonical SHA, public route access, authentication/session/CSRF/demo boundaries, public homepage/logo/footer, theme/system/cross-tab persistence, language persistence, keyboard/reduced-motion behavior and explicit legacy regression mode. Test-generated screenshots may be refreshed by existing suites; previous report text and pre-existing uncommitted work are retained.

New phase requirements: genuine demand source, strict DemandSignal, original/normalized separation, explicit date/unit/geography semantics, mapping evidence/status, quarantine/quality/coverage, indexed public read queries, evidence-first demand UI, backend/browser tests and phase documentation.

Audit limitations retained: no NCO/NSQF/NOS demand crosswalk; no district/GIS or national representative demand; no sufficient comparable demand time series; no compatible supply/capacity denominators. Forecast, gap analytics, live-source acquisition, AI and Phase2.9 are intentionally not implemented.

## Verification and review

See VERIFICATION.md and CHANGE_MANIFEST.md for actual commands/results/artifacts. Existing backend compile/build/lint passed before editing; prior browser reports were inspected and all existing browser suites are rerun after implementation. An initial browser run exposed new filter-label ambiguity, corrected with explicit accessible labels. Parallel legacy Edge suites encountered `ERR_NETWORK_IO_SUSPENDED`; sequential reruns all passed, establishing the final result without deleting/weaking tests.

No commit or push. Phase2.9 must first establish approved demand taxonomy/feed acquisition and compatible supply units/populations, not jump to a forecast.

Final verification: backend compile, 54 tests, frontend build/lint and all 11 browser suites pass (121 checks). New suite: 11 checks and 23 captures; representative screenshots manually inspected across all requested widths. Data values, source status and original base publication remain unchanged by visualization. No new dependencies or private data paths are exposed.
