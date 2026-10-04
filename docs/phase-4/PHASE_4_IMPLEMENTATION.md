# Phase 4 — Labour market trends and forecasting foundation

Implemented on 4 October 2026. **Historical intelligence is available; prospective forecasting remains UNAVAILABLE for every currently connected series.** The absence of predictions is a deliberate data-integrity result, not a hidden zero or a demo fallback. No Phase 5 module was started.

## A–F: Available data, trends and forecast limits

Read-only inventory of 1,701 observations in 1,162 source-native series. National PLFS has 54 comparable seven-year series (2017-18–2023-24); regional PLFS has 963 single-point series. NCS has 37 records for one stock date. PMKVY has 287 output observations (three complete years plus one partial year) and 36 single-date centre stocks. Full inventory and provenance identities: [DATA_INVENTORY](DATA_INVENTORY.md), `verification/series-inventory.json`.

125 series support compatible adjacent-period changes: 54 PLFS and 71 PMKVY output series. Absolute changes, rate changes in percentage points, nonzero-base relative growth and numeric direction are DERIVED with both original observation references. No causal explanations, missing-period fill, weighted aggregate, training-to-employment conversion, demand index or gap is introduced.

**Forecast-ready metrics today: none. Actual prospective forecasts: none.** PLFS annual horizons cross the January 2025 design boundary, with no connected reviewed bridge/new-design history. Regional PLFS has one point. NCS needs repeated comparable stocks. PMKVY needs substantially longer complete comparable history, resolution/exclusion of partial/quarantined periods and a reviewed measurement policy. Centres are not capacity. Skill/occupation/industry/district series are absent. All failed checks are exposed; changed units, populations, source versions, interval alignment, quality or geography cannot silently pass.

## G–K: Baseline, evaluation and uncertainty

Model: last-observation benchmark, **naive-1.0**. Policy: **annual-baseline-gate-1.0**. Change method: **adjacent-observed-change-1.0**. No new ML library. Forecast generation runs only after readiness passes; outputs carry FORECAST rather than OBSERVED and never write back into canonical data.

Expanding-window rolling-origin historical evaluations require four training points and at least three holdouts per requested horizon. Horizon-1 diagnostics exist for all 54 national PLFS series; targets are 2021-22, 2022-23 and 2023-24. Horizon 2/3 diagnostics and all prospective results remain unavailable. Past benchmark errors do not establish future accuracy or interval calibration.

Measured national persons / combined / usual-status examples, in percentage points:

- LFPR: MAE **1.7333333333333334**, RMSE **2.018250067096081**, bias **+1.7333333333333334**.
- WPR: MAE **1.866666666666667**, RMSE **2.201514630127783**, bias **+1.866666666666667**.
- UR: MAE **0.3333333333333333**, RMSE **0.5228129047119374**, bias **−0.3333333333333333**.

Every fold retains training IDs, target ID/period, prediction, observation and error. Exact 54-series results: `verification/backtest-results.json`. No pooled claim across different indicators/populations.

Conditional random-walk normal intervals are implemented only for eligible inputs; assumptions and uncalibrated structural-change uncertainty are disclosed. Invalid domain/zero-width intervals prevent publication rather than being clipped. Current production has **no future interval**. Model-ready synthetic unit/browser fixtures are isolated and visibly labelled TEST ONLY; they are not evidence of real forecasting availability. Full formulas and cited methodology: [FORECAST_METHODOLOGY](FORECAST_METHODOLOGY.md).

## L–N: Architecture, provenance, API and UI

`src/trends` projects existing authenticated publications into typed historical points/series, comparisons, readiness, backtests and forecast DTOs. Original values/units, native classifications, actual period bounds, observation/source IDs, source/publication versions, raw checksums and transformation evidence remain intact. No ingestion/canonical/database/environment/auth change. All three canonical hashes match the pre-phase values.

New public GET `/api/v1/intelligence/trends`, `/forecast`, `/forecast/coverage`, `/forecast/quality`, `/forecast/evidence`. Bounded queries and indexed cached reads; no raw files, source credentials, private account/profile/resume data, upload endpoint or client approval/method override. Missing combinations are EMPTY, corrupt sources a safe 503; neither returns sample values. [API_AND_CONTRACTS](API_AND_CONTRACTS.md) describes fields/filters/errors.

The existing `/forecast` route now uses a lazily loaded modular feature. Reuses the product chrome, bilingual resources, semantic tokens, shared chart frame, native source dialog and Skeleton/Error/Empty primitives. Data-aware family/metric/geography/population/activity/horizon filters, observed history, adjacent changes, real-period keyboard timeline/selector, table fallback, readiness reasons, methodology, retrieval date and actual historical backtest results. Prospective model marks use dashed lines, explicit FORECAST labels, interval marks/band and a separate table **only when permitted**. Missing/partial intervals are not connected by chart guide lines. Source evidence captures the selected observation's geography/source context rather than changing under a later filter.

The prior real-mode "Scenario preview" shell heading is corrected; explicitly labelled development legacy scenarios remain separate for existing regression/debug flows and are excluded by production mode. No legacy value becomes a Phase 4 observation or error fallback.

## O–R: Verification and artifacts

Complete backend suite: **119 passed** (102 existing + 17 Phase 4). Python compile/import passed. TypeScript checks (`tsc -b` through build), Vite build and Oxlint passed. Sixteen existing browser suites passed at final verification: fourteen historical suites, Phase 3, auth-hardening. New Phase 4: **10 browser assertion groups passed**. Details/retries: [VERIFICATION](VERIFICATION.md).

22 new browser captures: 20 real canonical-data views at 1440/1280/1024/768/390 × light/dark × English/Hindi; one API error; one explicitly labelled TEST ONLY model-rendering state. Representative desktop/tablet/mobile, both themes/languages, error and interval images inspected. No page overflow; table scrolling bounded; labels/focus/Escape/restoration/reduced motion verified. No accessibility certification claimed. Prior artifacts are not overwritten; regression captures live under Phase 4.

## S–V: Limitations, files, dependencies and Git

No new dependency or environment variable. Main chunk advisory above 500 kB remains; forecast code is separately loaded. Final measured bundle sizes are in `verification/frontend-build.txt`; performance summary in VERIFICATION.

No live provider authentication was attempted; existing mocked-provider/auth security regressions remain green. No forecasting scheduler/model persistence, seasonal model, post-2025 PLFS ingestion/bridge, interval calibration, district/occupation/skill/industry history, full Time Machine, AI explanation, gap bypass, early warning or Phase 5.

Exact authored code/docs and artifact paths: [CHANGE_MANIFEST](CHANGE_MANIFEST.md), `changed-files.json`. An unrelated `frontend/src/styles/home-hero.css` line-height edit appeared during the run and was preserved, excluded from the Phase 4-authored manifest. Git diff/status include it. No commit, push, reset, history rewrite or unrelated deletion was performed.

## Audit alignment

Preserved the verified demand/supply/base publications, source receipts/checksums/provenance, 120-count quarantine, Phase 3 NOT_READY gate, public access, private account/session/CSRF/ownership/OAuth architecture, official logos, homepage, footer, route/history behavior, theme/language persistence, keyboard and reduced motion.

Extended the current real-intelligence page/evidence/visualization architecture and test runner; added historical contracts, comparisons, deterministic readiness, a conservative baseline/backtest implementation, bounded APIs, actual-period timeline and forecast experience. Did not fabricate or acquire new values to make the model run.

Next prerequisite: acquire/review compatible revised-design PLFS history or an authoritative methodological bridge, repeated NCS stock observations, longer complete native training history and genuine classification/district series as appropriate. Decide a scientifically justified validation/calibration policy before authorizing prospective results. Phase 5 has not begun.
