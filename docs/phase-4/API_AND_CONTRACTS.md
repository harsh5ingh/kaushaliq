# Public trend/forecast API contracts

Existing Phase 3 demand/supply/gap endpoints are unchanged. New public GET APIs use `/api/v1/intelligence`; no account/auth dependency, writes, uploads, model-approval parameter or user identifier exists.

- `/trends`: paginated typed series, original observations, DERIVED or UNAVAILABLE adjacent changes, readiness, safe sources and publication version.
- `/forecast`: separate FORECAST/UNAVAILABLE/EMPTY envelope with input series, input observation IDs, original evidence, model/version, training window, horizon, generated timestamp only for actual predictions, typed future points/conditional intervals, historical backtest folds/metrics, methodology, quality and limitations. Current data returns no future points.
- `/forecast/coverage`: actual observed family/metric/geography options; counts of series, records, comparable histories and permitted predictions; all three authenticated publication versions, restrictions/quarantine from the existing source report, unavailable classification dimensions.
- `/forecast/quality`: series-specific missing intervals, quality restrictions, failed reason codes and partial input identities. This is an inspection endpoint, not chart data.
- `/forecast/evidence?series_id=…&horizon=1`: complete result lineage and safe source metadata. Unknown IDs return an explicit unavailable empty collection.

Trend/forecast filters: family (`labour`, `demand`, `supply`), metric, geography_id, sex, sector, activity_status, exact series_id. Parameters are bounded to 120 characters. Page limit 1–100, default 25; offset nonnegative. Annual horizon 1–3. Filter options never fabricate classifications. Unknown combinations return EMPTY; invalid enums/horizons/lengths return 422. Corrupt/missing/changed publications return a safe 503 `TREND_PUBLICATION_UNAVAILABLE`, with no internal path, credential or simulated fallback.

`HistoricalPoint` contains original value/unit, OBSERVED value, actual period bounds, source/version/publication, native identity and raw-cell evidence. `HistoricalSeries` preserves native classifications, missing intervals, methodology applicability and source IDs. `TrendChange` contains the two observation IDs/evidence, change unit, nullable relative growth, numeric direction and transformation version. `Readiness` contains every check, reason code, requested horizon and explicit policy version. `ForecastResult` rejects unavailable predictions and mismatched input lineage; output values remain FORECAST.

Indexed dimension lookup and LRU caches are keyed by existing authenticated snapshot versions. No raw source CSV/PDF/HTML is sent to the browser. Only queried bounded series and compact options load in the main experience. The frontend aborts obsolete requests and rejects mixed versions, duplicate/out-of-order observed points, invalid numeric values, ungated model output and invalid forecast interval/order. It never substitutes sample values after an API failure.

No environment variable, credential, provider, database migration or dependency was added. Existing settings resolve the three canonical publication paths. Production forecasts are computed read-only only after readiness passes; a future scientific model registry/calibration policy is not implied by this baseline.
