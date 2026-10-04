# Phase 4 pre-implementation audit

Current checkout is clean before Phase 4 (4 October 2026). No canonical file is edited. Three SHA-256 values are recorded in verification/source-hashes-before.json.

## Actual inventory

- PLFS: 1,341 observations, 1,017 distinct indicator × geography × sex × rural/urban × activity-status series. Exactly 54 national series have seven consecutive July–June annual observations, 2017-18 through 2023-24. The other 963 series have one regional 2023-24 observation. US and CWS, sexes, denominators and sectors must remain separate.
- NCS: 37 source records, one point-stock date (14 July 2025), 34 mapped national/state/UT records and three unmatched geography labels. There is no demand time series.
- PMKVY: 287 trained/certified activity counts over FY2023-24 through FY2026-27, the last year partial to 30 June 2026. Three complete years are insufficient for the proposed baseline backtest policy. National TRAINED FY2024-25 is quarantined, not zero. A further 36 centre stocks have one observation date; centres are not seats/capacity/workforce availability.
- Geography: 37 country/state/UT references, no district observations or authoritative geometry. NIC: 332 partial references, no industrial hiring time series. No connected skill/occupation time series or approved crosswalk.
- Phase 3 gap engine remains UNAVAILABLE/NOT_READY. Neither PMKVY output nor PLFS population rates are silently reinterpreted as compatible vacancy supply.

## Reuse and boundaries

Reuse authenticated canonical readers, version/checksum caches, safe source DTOs, Evidence, public read API conventions, Recharts, VisualizationFrame, EvidencePanel, Skeleton/ErrorState, centralized English/Hindi and existing theme/navigation. No ingestion, account, public homepage or canonical modification. Existing explicit development sample views remain isolated; the new Phase 4 APIs never import sample data.

## Forecast policy decided before implementation

Use a transparent last-observation (naive/random-walk) benchmark, not ML. Minimum four training observations and three rolling-origin holdouts per requested annual horizon; no future leakage. No interpolation, category aggregation or partial-year growth. Historical backtest diagnostics can exist without prospective permission. PLFS prospective horizons crossing January 2025 fail comparability: the connected series is explicitly pre-change; no reviewed bridge to the revised design is connected. This is independently consistent with MoSPI's PLFS changes notice. Forecast eligibility is not inferred from plausible backtest errors.

## Implementation order

1. Read-only typed series adapters and complete machine-readable inventory, with original observation/evidence identities and absent periods.
2. Deterministic adjacent-period trend comparisons and explicit annual readiness checks; separate historical diagnostics from forecast generation.
3. Reusable baseline/backtest/conditional interval functions with isolated test fixtures for eligible inputs; production output unavailable unless every check passes.
4. Bounded, indexed public trends/forecast/coverage/evidence/quality APIs, no account data or filesystem paths.
5. Modular /forecast history/readiness experience, genuine-period timeline, shared source dialog, EN/HI and semantic states.
6. Backend and browser regressions, five-width theme/language captures, manual image inspection, checksum comparison and complete report.

## Baseline checks

Existing frontend build and lint pass. Initial backend suite: 101/102 pass; the provider-unconfigured account test inherits locally configured OAuth values and receives 200 instead of expected 503. Re-run with provider configuration explicitly empty in the test process, retaining the assertion and leaving application/auth code untouched. This is test isolation, not a production change.

## Method references

- [MoSPI: PLFS changes in 2025](https://mospi.gov.in/sites/default/files/publication_reports/PLFS_Changes-in-2025_rev.pdf): design changes from January 2025; no automatic regime bridge.
- [Forecasting: Principles and Practice — simple methods](https://otexts.com/fpp3/simple-methods.html), [time-series cross-validation](https://otexts.com/fpp3/tscv.html), [prediction intervals](https://otexts.com/fpp3/prediction-intervals.html): benchmark, rolling-origin evaluation and conditional random-walk intervals. These are methodology references, not copied source code or external data ingestion.
