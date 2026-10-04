# Historical review signals and early-warning readiness

Engine: `early-warning-1.0`. Policy: `historical-review-rules-1.0`.

These are explainable **historical review signals**, not live alerts, calibrated risk scores, significance tests or causal findings. Review thresholds are explicit project inspection policy, not empirically established labour-market shock thresholds. No critical severity is claimed.

## Eligibility

Each numerical rule requires mapped canonical geography, approved source-native metric/frequency/units, unique observed records, matching population/classification/methodology/source versions, regular adjacent complete periods, `VALID` quality, matching connected source checksum/version, and the applicable methodology window. An observation with an as-of cutoff before its period end is not a complete input. Missing intervals are not filled. Partial training years remain in canonical history but are excluded from full-year comparisons.

Readiness contains individual passed/failed checks, machine-readable reasons, required data, eligible-series counts and evidence. States are `READY`, `NOT_READY`, `UNAVAILABLE`, `INSUFFICIENT_HISTORY`, `MISSING_PERIODS`, `INCOMPATIBLE_SERIES`, `INSUFFICIENT_COVERAGE` and `QUALITY_RESTRICTION`. Readiness is separate from whether a threshold actually triggers.

## Approved numerical rules

### LABOUR_INDICATOR_CHANGE

PLFS LFPR/WPR/UR, native percentages, annual periods. Compare the latest two compatible complete periods in each distinct source-native population stratum:

`absolute change = latest observed rate − preceding observed rate`

Trigger `REVIEW` when `abs(change) >= 2 percentage points`. Relative change is retained separately only when the earlier rate is nonzero. This does not convert participation, employment or unemployment rates into job demand.

Connected publication result: **18 review signals for 2023-24 versus 2022-23**, among 54 eligible national histories. Overlapping population strata are not independent shocks and must not be summed.

### TRAINING_OUTPUT_ACCELERATION

PMKVY trained/certified output, reported persons, fiscal years. Require the latest three compatible complete periods and nonzero bases:

`previous growth = 100 × (middle / first − 1)`

`latest growth = 100 × (latest / middle − 1)`

`growth acceleration = latest growth − previous growth`

Trigger `REVIEW` only if latest growth is positive and acceleration is at least **10 percentage points**. There are 71 eligible connected histories, but **zero meet this rule**. The API returns `EMPTY` with readiness `READY`, not a fabricated signal or unavailable capability. Training output is not available workforce supply, demand, seats or throughput capacity.

## DATA_COVERAGE_WARNING

Eight informational source-readiness notices summarize actual connected limitations: single demand snapshot, single regional labour period, single infrastructure snapshot, partial output period, an evidenced quarantined interval, unmapped geography buckets, absent reviewed classifications, and absent capacity measures. They preserve representative original source observations, without a labour change value or risk score. Quarantine wording is derived only from a matching source-quality record; another missing interval does not inherit its discrepancy.

## Unsupported types

`DEMAND_ACCELERATION`, `SUPPLY_ACCELERATION`, `DEMAND_SUPPLY_DIVERGENCE`, `REGIONAL_DEMAND_ANOMALY`, `EMERGING_SKILL_SIGNAL`, `DECLINING_SKILL_SIGNAL` and `TRAINING_PRESSURE` remain `NOT_READY`. Requirements include repeated compatible demand/available-worker observations, mapped regional history, reviewed skill/occupation crosswalks and genuine demand/capacity measures. NCS stocks, PLFS rates and PMKVY administrative output cannot substitute for these inputs.

## Reproducibility and evidence

Decimal arithmetic reuses the Phase 4 change calculation. IDs bind rule/version, input observation IDs and publication references; cached projections bind canonical publication checksums and policy. No writes occur. Results retain native observations and original values, source versions, raw checksums, evidence locators, transformation metadata, period/geography, rule thresholds and limitations. Each displayed value can be inspected in the existing evidence dialog. There are no LLM-generated signals or explanations.
