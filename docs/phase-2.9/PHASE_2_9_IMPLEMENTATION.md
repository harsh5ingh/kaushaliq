# Phase 2.9 — Taxonomy and training supply foundation

Implemented on 3 October 2026. This is an additive public-data foundation, not a skill-gap or forecasting release. See [verification](VERIFICATION.md), [changed files](CHANGE_MANIFEST.md) and the [pre-edit audit](AUDIT_AND_PLAN.md).

## Implemented

- Reproducible `supply-1.0` publication bound to the unchanged Phase 2.5 base snapshot. It contains 287 existing PMKVY output records and 36 newly acquired PMKVY training-centre records.
- Strict multi-system occupation, skill/NOS, qualification/QP/job-role and mapping contracts. Production occupation, skill, qualification and mapping collections are empty because no reviewed acquisition adapter has been established for them.
- Separate `TRAINING_OUTPUT`, `TRAINING_INFRASTRUCTURE` and `TRAINING_CAPACITY` semantics. Only `TRAINED`, `CERTIFIED` and `TRAINING_CENTRES` are published. Capacity and seats are unavailable.
- Original source cells, integral normalized values, explicit fiscal/point dates, publication/as-of dates, geography, source-record identity, raw checksum and transformation evidence.
- Reconciliation, immutable acquisition, schema-drift rejection, strict validation, coverage checks, indexed reads and the existing 120-count quarantine.
- Seven public GET endpoints for observations, sources, coverage, reference inspection, quality, compatibility and gap status.
- `/supply` in the existing workspace shell, with data-aware URL filters, observed tables, evidence, coverage exceptions, taxonomy reference desk and ten-dimension planner readiness.
- Centralized English/Hindi resources, existing themes and keyboard/focus behavior. Supply remains verified mode even when a development URL requests legacy sample mode.

## Architecture and reuse

`src/supply/build.py` uses the existing registered-source reader, HTML parser, PMKVY reconciliation adapter, evidence factory, checksum writer and canonical geography. It reuses Phase 2.8 time/geography/integer normalization and indexed query machinery. No competing geography or ingestion system was created.

`data/raw/training/pib-centres-2289890.html` is a new immutable official snapshot with an acquisition receipt. Staging, processed and canonical supply files are reproducible offline. The manifest binds the new publication to the base version and three source hashes. Repository reads verify this binding and cache dimension indexes. No new database is needed for 323 records.

The frontend uses the existing API client, real-data dispatch, semantic tokens, loading/error/empty components and shared evidence dialog. Components separate observation presentation, reference exploration and compatibility explanation. Raw files are never served to the browser.

## Audit alignment

Preserved: Phase 2.5 PLFS/NIC/PMKVY publication; Phase 2.8 NCS demand publication, its 37 observations and historical interpretation; public intelligence access; auth, CSRF, account ownership and session boundaries; bilingual/theme persistence; public pages, footer, logos and existing visualization system. Base and demand SHA-256 values remain unchanged.

Extended: the existing training view and demand page link to `/supply`; existing top navigation gains one destination; existing evidence is supplied with the correct source metadata. The old training endpoint and view remain available.

New: supply schema/publication/APIs, research registry, multi-system reference contracts, strict compatibility gate, coverage/quality reporting, supply experience and tests.

Still limited: no occupation/skill/qualification crosswalk, no current available-worker measure, no seat/throughput capacity, no district supply and no comparable demand denominator. The partial NIC reference is industrial classification, not an occupation taxonomy or an observed hiring measure.

Intentionally not implemented: inferred codes, training-to-employment conversion, national centre totals, district allocation, gap arithmetic, ranking, forecasting, ML, AI recommendations, scraping infrastructure, account changes or Phase 3.0.

## Compatibility

The default reference assessment compares national NCS active vacancies on 14 July 2025 with national PMKVY certified activity in FY2025-26. It is explicitly independent of observation-table filters. The API also accepts exact observation IDs.

Result: `INCOMPATIBLE`, `SUPPLY_AVAILABLE_BUT_INCOMPATIBLE`, `readiness=NOT_READY`, `gap_status=UNAVAILABLE`, `gap_value=null`. Point stock, fiscal-year activity, vacancies and reported persons cannot be subtracted. No occupation/skill/sector equivalence is established. Full rules: [compatibility methodology](COMPATIBILITY_METHODOLOGY.md).

## Configuration and operation

No dependency was added. The existing optional backend configuration pattern now supports `SUPPLY_DATA_PATH`; its default resolves to the repository's canonical supply snapshot. No credentials or frontend environment variables are required.

Run from `backend/`:

```powershell
python -m src.data_pipeline.acquire --registry ../data/metadata/supply_source_registry.json pmkvy-centres-pib-2026
python -m src.supply.build
python -m compileall -q src tests
python -m unittest discover -s tests -v
```

Acquisition refuses changed existing snapshots. A source revision needs a new reviewed snapshot path/registry version. Do not overwrite raw artifacts to refresh data. Runtime reads do not download sources.

Run from `frontend/`:

```powershell
npm run build
npm run lint
node tests/phase29.browser.cjs
```

## Security and performance

Public supply reads do not import account/profile/resume repositories and expose no upload/write endpoint. Safe source DTOs omit internal raw paths and secrets. Filter length and page size are bounded. Missing, corrupt or inconsistent publications return 503; absent observations return an explicit unavailable envelope, never sample values.

The existing lazy real-intelligence chunk carries the supply view. Initial bilingual resources add a small bundle cost; the existing 500 kB Vite advisory is reported in verification rather than hidden. No charts, WebGL, storage service or state-management dependency was introduced.

## Next phase recommendation

Seek authorized, versioned occupation/qualification/NOS/QP extracts and documented crosswalks; acquire defensible seat/throughput and current-worker supply measures; then assess genuinely comparable occupation × geography × period populations. Proceed to gap analysis only after those gates pass. Phase 3.0 has not started. No commit or push was made.
