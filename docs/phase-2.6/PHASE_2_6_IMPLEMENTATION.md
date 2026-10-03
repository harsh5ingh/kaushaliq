# Phase 2.6 implementation

## Audit alignment
Audited Phase 2.5 report/coverage/dictionary/provenance/quality/manifest/verification, existing phase reports and current frontend/backend contracts, chart/spatial code, routes, auth, preferences, localizations and tests before edits. No default-mode measurement leak was found. Production selector and spatial sample CTA were the remaining simulation entry points. The legacy cylinder scene had no authoritative coordinates or relationship evidence.

Preserved verified source registry, immutable raw inputs, canonical publication/hash, reproducible pipeline, API endpoints and backend tests. Preserved auth/session protections, public page composition, official artwork, shared footer, theme/system/cross-tab/storage behavior and localization persistence. No new dataset, labour metric, backend function, forecast or geographic asset.

## Implemented
- Verified public data banner without source-mode selector; no sample UI entry. Production ignores `?data=sample`; development-only explicit regression mode preserves historic prototype tests.
- Build-time DEV guards remove all legacy simulated workspace chunks and Three.js from production. Local debug URLs are not production routes or fallback behavior.
- Shared visualization frame, source/status/period header, tooltip, legend, annotation, unavailable and relationship contract components; existing loading/error/evidence primitives reused.
- Contextual observed KPI metadata and explicit unavailable badge; historical point explorer with inspector/evidence, table disclosure, chronological ordering and methodology boundary. No altered observations.
- Same-slice regional dot comparison, ordering/filtering/evidence/table fallback. No aggregate, score or gap created. Regions prioritizes actual comparison rather than duplicated national history.
- Spatial coverage architecture and useful 2D destination; explicit missing geometry and relationship inputs. No new GPU scene or fake network.
- Central bilingual visualization resource; readable metadata, mobile layouts, theme tokens, reduced-motion behavior and native semantic interaction.
- Stronger frontend published-observation decoder: finite/bounded percentages, expected indicator/population/activity, date ordering and pinned pre2025 methodology. Invalid responses fail explicitly.

## Data coverage
Unchanged: 1,341 PLFS rates; 287 PMKVY administrative counts; 332 partial NIC entries; 37 geographic references. No skill demand, occupation relationships, demand index, skill gap, district data, GIS geometry or forecast. Existing source-specific reuse terms and PMKVY quarantine retained.

## Dependencies / research
No dependency/version added. Existing Recharts 3.10.1 selected (MIT); original component code and CSS, no copied marketplace media/demo code. React Flow, deck.gl and R3F source/package/licence investigated and deferred because required real data is absent. See VISUALIZATION_RESEARCH.md.

## Performance
Baseline: 572.61kB legacy spatial chunk; initial 441.61kB plus shared jsx-runtime49.53kB; real feature15.60kB plus LineChart354.22kB and other legacy chunks. Final build contains only initial (494.95kB /143.32kB gzip) and lazy verified feature (381.13kB /109.59kB gzip) JS chunks. CSS97.87kB /18.16kB gzip. Total emitted JS876.08kB versus the prior approximately1,496kB across its chunks; exact asset sizes are retained in build.log. Compare chunk grouping carefully: removing legacy consumers changes where shared React/Recharts code is emitted. Spatial >500kB advisory eliminated, not suppressed. No GPU animation/resource allocation in production. Regional comparison currently makes bounded concurrent requests for 36 geographies using existing APIs, aborts stale work and fails all-or-nothing on error. A batch comparison API/cache can be justified later if usage/coverage grows; no premature infrastructure.

## Tests and QA
See VERIFICATION.md and verification/results.json. Earlier simulation regression suites continue through explicit development fixtures. Phase 2.5 expectations were updated only for intentional selector removal, direct debug URL/history, distinct tooltip naming and new unavailable/coverage markup; canonical/API/provenance checks retained. Screenshot review removed duplicate historical headings/full table repetition and unnecessary history from Regions. The regional tick scale now shares the dot-row grid and scroll gutter, with pixel-alignment assertions at every viewport; long lists remain keyboard reachable. Mobile axes omit the middle label to prevent narrow-domain tick collisions, retaining 0–100 endpoints. No accessibility certification claimed.

## Deferred / limitations
No authoritative geographic renderer, skill/occupation edge acquisition, graph layout/pan/zoom, forecasts/confidence intervals, derived change metrics, additional real datasets, district metrics or live-demand feed. Reference labels/source descriptions remain published-language metadata; interface explanations are bilingual. Earlier uncommitted work remains intact; no commit or push.
