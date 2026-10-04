# Verified historical data inventory

Full per-series inventory: `verification/series-inventory.json` (1,162 entries). Each entry includes metric, original unit, geography, native classification/denominator, actual periods, observation identities, missing/partial periods, source/version/raw SHA-256, methodology, quality, comparability and forecast checks. `coverage.json` is the machine-readable aggregate; `backtest-results.json` contains all measured eligible historical diagnostics.

## Labour-force history

1,341 published PLFS observations. 54 national series contain seven consecutive annual July–June periods from 2017-18 to 2023-24: 3 indicators × 3 population sexes × 3 rural/urban strata × 2 activity-status definitions. Another 963 state/UT series contain one observation (2023-24 usual status, age 15+), not a time series. Blank Chandigarh rural cells remain absent. Source-native LFPR/WPR denominators are population age 15+; UR denominator is labour force age 15+. Neither rates nor their movements are hiring counts or skill demand.

Sources: connected MoSPI/PIB PLFS 2024 release and PLFS annual 2023-24 tables, whose checksum/evidence contracts were already established. Published combined strata are retained; no national/state averages are recalculated. The historical design is pre-January-2025. Every prospective annual horizon from the latest 2023-24 point crosses that reviewed applicability boundary; no comparable revised-design history/bridge is connected.

## Demand history

37 NCS/PIB vacancy-stock records from one observation date, 14 July 2025 (published 24 July 2025). 34 exact/documented geography records and 3 unmatched source buckets remain distinct. No historical demand changes or future demand are available. A point stock is neither annual hiring nor a complete national demand measure.

## Training activity and infrastructure

323 supply publication records: 287 PMKVY trained/certified fiscal-year activity counts and 36 centre stocks as of 30 June 2026. There are 72 output series, including the national TRAINED series with the FY2024-25 observation absent because of the unresolved 120-count discrepancy. The other 71 output series have three complete years (FY2023-24–FY2025-26) plus partial FY2026-27. Comparable adjacent full-year activity changes exist for those 71 series. The missing national training year is never filled or reconstructed from a state sum. Partial observations remain visible, explicitly marked, without a full-year comparison or model training. Centre counts have a single date and are not capacity/seats.

## References and unavailable dimensions

37 country/state/UT references and 332 partial NIC entries describe entities, not additional time series. No district, occupation, skill or industry histories are connected. No authoritative NCO/NSQF/NOS crosswalk is inferred. Phase 3 gap readiness remains unchanged.

## Totals and readiness

1,701 observed records projected read-only into 1,162 series. 125 series support at least one comparable adjacent-period change (54 PLFS + 71 output series); 54 support the one-period historical baseline evaluation policy. Zero prospective forecasts are available. For horizon one, the leading readiness counts are 1,017 INCOMPATIBLE_SERIES (PLFS methodology boundary), 75 QUALITY_RESTRICTION (72 partial training series plus 3 unmatched demand buckets), and 70 INSUFFICIENT_HISTORY (34 mapped demand stocks + 36 centre stocks). All failed checks are retained, so leading status alone is not the complete explanation.

No new public dataset was downloaded in Phase 4. The MoSPI methodological notice was researched as corroboration, not used to silently ingest/reclassify new-design labour observations.
