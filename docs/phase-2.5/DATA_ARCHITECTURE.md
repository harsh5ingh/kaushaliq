# Real-data architecture

Official source → registry → immutable raw bytes + receipt → offline extraction → schema/relationship validation → processed snapshot → canonical read-only repository → FastAPI → real-data provider → evidence-backed workspace.

`data/raw/` stores original downloaded HTML/PDF bytes. Existing snapshots cannot be overwritten by acquisition. Receipts store source URL/final URL, UTC retrieval time, content type, byte count and SHA-256. A new publication requires a new registry version/raw path, not mutation of history.

`data/staging/extracted.json` is the extraction checkpoint; `data/processed/validated.json` the accepted structured records; `data/canonical/labour-market.json` the published API contract. `manifest.json` binds canonical content and raw hashes. `data/metadata/quality_report.json` documents exclusions/missingness. No raw file endpoint and no frontend CSV loading.

From `backend/`:

```sh
python -m src.data_pipeline.acquire
python -m src.data_pipeline.build
python -m unittest discover -s tests -v
```

Acquisition is explicit network work. Build is offline and reproducible from preserved bytes and pinned pypdf 6.1.1. Identical inputs produce identical canonical bytes/hash. Publication uses temporary-file replacement. Snapshot/manifest are separate replacements: a brief mismatch fails closed rather than serving an unverified mixture. Future concurrent publisher deployments should use version directories plus an atomic pointer. No network/download on API startup.

## Canonical model

Regions have internal stable IDs and source names; these are not LGD/Census codes. Only India + state/UT levels exist. Geometry and official codes are null. NIC codes remain strings, maintain verified hierarchy where present and explicit missing parents. Labour rates preserve statistical population/status/sex/sector/age/period; training preserves programme/FY/partial period/cohort caveats. No simulated ID crosswalk is invented.

## Database assessment

Existing SQLite is the private account/session prototype. It is intentionally not repurposed for public labour observations. This snapshot has 1,341 labour rates, 287 training counts, 332 references and 37 geography records, no geometry or frequent writes. Read-only validated JSON with hash-bound publication is sufficient and easy to reproduce. This is an explicit canonical data store, not an arbitrary CSV backend.

Move to relational tables/migrations when query joins, larger histories, concurrent updates or operational backups justify it. Evaluate PostgreSQL/PostGIS when verified geometry and spatial query needs exist. No Azure/object storage introduced: present raw corpus ~28 MB and low update frequency. Storage choice should follow size, retention, concurrency and deployment needs.

## API

`/api/v1/catalog`, `/sources`, `/regions`, `/industries`, `/occupations`, `/skills`, `/labour`, `/training`. Public aggregate endpoints; protected account/session endpoints remain separate. Labour filters: region_id, indicator, period, sex, sector, activity_status; ages15+ fixed. Pagination bounded 1–1000. Unsupported combinations return empty items with UNAVAILABLE, never zero. Snapshot unavailable/corrupt → 503, never simulation.

## Frontend boundary

`DataProvider` selects real by default. Catalogue/observation contracts validated at the API boundary. `RealIntelligencePage` dispatches existing routes into observed views or honest unavailable states. Existing Phase2.4 routes/data/analytics are retained behind explicit `?data=sample`. Choice is URL state, supports refresh/back/forward and is never a localStorage default. Failure does not select sample.

API data is not merged with simulation. Legacy search only exists in sample mode; real search uses connected state/UT and NIC references. Charts use original published values, fixed 0–100 percentage axis, no smoothing, forecasts, interpolation or unweighted state averages. Accessible tables carry the same data and evidence controls. UI support English/Hindi; official source descriptions/metadata remain in published English and are labelled as such.

Future AI Analyst reads canonical entities/observations/evidence through this boundary. Forecasts, compatible gap methodology, real demand and GIS require separate validated releases; no model is introduced here.
