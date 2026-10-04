# Trend and baseline methodology

## Historical changes — adjacent-observed-change-1.0

Only complete, valid, contiguous annual observations with identical unit, population, native classification, geography, methodology, source identity/version and publication version are compared. Original values, units and raw evidence remain in each historical point. Absolute change = later observed value − earlier observed value; rate changes use **percentage points**, not percentage growth. Relative growth = (later / earlier − 1) × 100 only when the earlier value is nonzero. Direction is a numeric increase/decrease/unchanged, not a causal or welfare interpretation. Decimal arithmetic avoids binary-rounding artifacts before JSON conversion. Zero-base relative growth is null, with an explicit reason; absolute change may still be defined.

No cumulative changes across missing periods, partial/full-year comparisons, incompatible groups, weighting, interpolation, cohort conversion or district allocation. Rendering breaks guide lines at unavailable comparisons and provides the original table.

## Forecast readiness — annual-baseline-gate-1.0

Eight explicit deterministic checks: verified observations; complete annual frequency; minimum history for requested horizon; compatible source/native identities; contiguous intervals; valid quality/no partial periods; mapped canonical geography; reviewed methodology applicability. Duplicate identities and irregular periods fail. Models do not cross the PLFS January 2025 design boundary. All failures are returned, even when one leading status summarizes them.

The project baseline policy requires at least four training observations and three rolling-origin holdouts at the requested horizon: minimum 7 annual observations for horizon 1, 8 for horizon 2, 9 for horizon 3. These are conservative engineering prerequisites for exposing a benchmark, **not a universal scientific sample-size guarantee**. Historical diagnostic eligibility does not imply prospective readiness. Revisions, unmodeled structural change and uncertainty calibration still require review. An invalid/zero-width conditional interval adds UNCERTAINTY_UNSUPPORTED and prevents publication.

## Baseline — naive-1.0

Last-observation / random-walk benchmark: repeat the last training observation for each future annual period. No fitted slope, seasonality, neural network, explanatory variable or causal narrative. Read-only model outputs use FORECAST and never enter the canonical OBSERVED collections. Model metadata retains actual input IDs/evidence, window, horizon, timestamp, quality, restrictions and model/policy versions.

## Rolling-origin evaluation

Expanding training windows, minimum four points. At each origin, prediction for horizon h is the last training observation; the target occurs h periods later. No future values enter training. At least three distinct holdouts required. Error = observed − predicted. MAE = mean absolute error; RMSE = square root of mean squared error; bias = mean signed error. For PLFS these error magnitudes are expressed in percentage points. Each fold publishes its training IDs, target ID/period, observed value, baseline prediction and error.

All 54 seven-point national PLFS series permit horizon-1 diagnostics, covering holdouts 2021-22, 2022-23 and 2023-24. Horizon 2/3 diagnostics are unavailable under this policy. Actual results are in `verification/backtest-results.json`; selected persons/combined/usual-status national metrics:

- LFPR: MAE 1.7333333333333334 pp; RMSE 2.018250067096081 pp; bias +1.7333333333333334 pp. Holdout errors +0.3, +2.7, +2.2 pp.
- WPR: MAE 1.866666666666667 pp; RMSE 2.201514630127783 pp; bias +1.866666666666667 pp.
- UR: MAE 0.3333333333333333 pp; RMSE 0.5228129047119374 pp; bias −0.3333333333333333 pp. No global accuracy score is averaged across populations/metrics.

These are measured historical benchmark errors, not claims that a prospective forecast is accurate. All current prospective outputs remain UNAVAILABLE.

## Conditional uncertainty

For otherwise eligible inputs only: sigma = sqrt(mean(squared adjacent increments)); normal random-walk 95% prediction interval = last value ± 1.959963984540054 × sigma × sqrt(h). This assumes independent zero-mean normal increments and a stable measurement regime. It is **not a PLFS survey sampling confidence interval**, does not incorporate parameter/regime uncertainty and has no demonstrated interval calibration on current data. Negative lower bounds, percentage bounds beyond 100, or zero sigma prevent publication; they are not clipped or replaced with plausible values. Current production has no prospective intervals. Isolated model-ready unit/browser fixtures test the contract/rendering and are labelled TEST ONLY.

## References / licensing

The independently written implementation uses standard-library arithmetic and existing Pydantic. No third-party forecasting code/package is copied or installed. Methodological references: [FPP3 simple methods](https://otexts.com/fpp3/simple-methods.html), [rolling-origin cross-validation](https://otexts.com/fpp3/tscv.html), [prediction intervals](https://otexts.com/fpp3/prediction-intervals.html). Survey boundary: [MoSPI PLFS changes in 2025](https://mospi.gov.in/sites/default/files/publication_reports/PLFS_Changes-in-2025_rev.pdf). External publications retain their own terms; connected datasets retain the existing Phase 2.5/2.8/2.9 source registry and raw artifacts.
