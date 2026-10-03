# Phase 2.6 audit — before implementation

## Source of truth
Read Phase 2.5 implementation, coverage, dictionary, provenance, quality report, manifest and browser verification; inspect prior account/workspace reports, routes, AppShell, API client, canonical contracts, providers, evidence modal, chart primitives, simulated analytics, spatial renderer, preference providers, localization resources, styles and browser harness. Git status contains substantial earlier uncommitted work; preserve it.

## Inventory and route mapping
- `/intelligence`, `/regions`, `/forecast`: AppShell → RealIntelligencePage → ObservedLabour. Recharts LineChart uses published national/state observations with filters, a fixed percentage axis, table and evidence. Generic presentation, no regional comparison. Forecast is historical foundation only.
- Training tab: ObservedTraining table uses PMKVY counts, partial-year and quarantine disclosures. No composition ratio is defensible because cohorts differ.
- `/industries`: searchable, paginated NIC reference; classification, not industry demand.
- `/reports`: actual coverage/quality table. `/skills`, `/occupations`, `/demand`: unavailable, no fabricated values.
- `/spatial`: unavailable geometry, but exposes a CTA into legacy simulation. This production escape hatch must be removed.
- WorkspaceDataBanner exposes real/sample selector. Remove it; retain developer-only URL mode for historical regression tests, never production fallback.
- Legacy AnalyticsCharts has simulated line/bar/heatmap views. Legacy SpatialIntelligenceView uses Three.js cylinders, arbitrary positions and synthetic edges on a grid. These cannot support geographic or relationship claims. Preserve archived regression behavior in development; exclude the legacy spatial import from production output.
- Existing ChartCard hardcodes a demand eyebrow; avoid reusing that misleading label for supply. Introduce a neutral visualization frame for verified observations, while retaining old regression components.

## Integrity and limitations
No simulated measurement found in default real-mode rendering. Real coverage remains 1,341 PLFS rates, 287 PMKVY counts, 332 partial NIC entries and 37 region references. State history only 2023-24 US; no authoritative geometry, skill relationships, vacancy feed, gap method, uncertainty intervals or forecast. Country rates are weighted published observations, never averages of states.

## Decisions
Keep pipeline/raw/canonical bytes and auth/public design intact. Contextualize observed metrics; reusable evidence-first chart frame, chronological point inspector and table; state/UT dot comparison of identical published slices. Spatial page should explain coverage and lead to a non-geographic regional comparison. Relationship contract should require evidence and display unavailable until real edges exist. Do not add GPU libraries without valid geography/relationships.

## Dependencies / licenses
Existing Recharts 3.10.1 and Three.js 0.186.1, no R3F/React Flow/deck.gl installed. Recharts local LICENSE/source and upstream examples inspected (MIT). Research alternatives and source-specific licensing in VISUALIZATION_RESEARCH.md. No new package justified.

## Baseline
Before source changes: frontend build/lint and ten backend tests pass; existing Phase 2.5 browser suite passed before source migration; earlier development regression suites also passed. Baseline production spatial chunk 572.61 kB (142.54 kB gzip), initial JS 441.61 kB, real feature 15.60 kB. Existing spatial advisory is a legacy cost rather than a reason to introduce another renderer.
