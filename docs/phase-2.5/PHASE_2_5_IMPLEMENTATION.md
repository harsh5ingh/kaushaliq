# Phase 2.5 — Real Data Foundation

## Audit alignment

Before edits, read the Phase2.2/2.3/2.3.1/2.4 reports, manifests and current verification results; inspect frontend routes, account flows, theme/localization, workspace pages, shared simulated model/analytics, API client, backend settings/auth, environment examples and tests. The repository already had broad uncommitted changes. No reset, commit, push, restoration from archives or competing simulation model.

Preserved: official logos/artwork; completed public homepage/footer/conceptual visuals; public/protected routes; top workspace navigation; real bcrypt/session/CSRF/logout boundaries and unavailable OAuth; theme/system/cross-tab/storage fallback; English/Hindi persistence; reduced motion; command palette and keyboard/dialog behavior; deterministic Phase2.4 dataset/analytics; existing 3D interaction.

Extended: FastAPI with public canonical aggregate APIs; existing API client used by a real-data feature boundary; existing AppShell dispatches routes by explicit data mode; search uses canonical entities in real mode; existing modal/status/loading/error/empty/button primitives reused. Legacy links/filter reset retain their explicit sample-mode URL. No frontend/backend auth rewrite, database migration or new state/chart framework. Shared English/Hindi public copy was corrected where it still claimed the pipeline was disconnected or no account was required; homepage layout, conceptual visuals, navigation and footer were not redesigned.

New: registered official source acquisition, immutable receipts/checksums, PDF/HTML extraction, normalized contracts, offline reproducible build, quality/quarantine checks, canonical manifest/read-only repository, observed labour and training views, partial NIC taxonomy browser, per-record evidence, unavailable coverage and bilingual UI disclosures.

## Exact connected scope

- MoSPI PLFS PIB annual release tables1–6:378 national rates, ages15+, US/CWS, rural/urban/combined, male/female/persons, July–June2017-18–2023-24.
- MoSPI PLFS AnnualReport2023-24 tables16/17/18 ages15+ US:963 state/UT rates. National cross-check rows excluded from duplication. State history limited to2023-24.
- MoSPI NIC2008 SixthEconomicCensus reference:332 entries (19sections,82divisions,231groups), partial classification. Leading-zero codes preserved; four group parents unavailable rather than invented.
- MSDE PMKVY PIB AnnexureI:287 trained/certified administrative counts, FY2023-24–2026-27; last FY partial to30June2026. National FY2024-25 trained total quarantined (difference120 against state sum).
-37 geography references (India+28states+8UTs) based on PLFS source labels, internal identifiers only; no LGD/Census codes or GIS fabricated.

Source terms and exact URLs: [DATA_SOURCES.md](DATA_SOURCES.md). Raw originals/receipts stay in the project. Public accessibility is not misrepresented as a universal CC/GODL licence. NCO permission, QP licensing and actual GIS product acquisition remain unresolved.

## API and storage

`/api/v1/catalog`, `/sources`, `/regions`, `/industries`, `/occupations`, `/skills`, `/labour`, `/training`. Bounded typed filters/pagination. Public official aggregates, no personal microdata/raw download endpoints. Existing health/root/auth endpoints preserved. Missing/corrupt canonical publication→503; unsupported combinations→UNAVAILABLE/empty, no zero fill.

Read-only JSON snapshot is deliberate for this small release. Existing SQLite remains private account/session storage; no labour data put in account tables. PostgreSQL/PostGIS/object storage deferred until dataset/query/spatial/concurrency requirements justify them.

Backend optional `CANONICAL_DATA_PATH` consumer documented in `.env.example`; default is project data/canonical path. No credentials, API keys or frontend secrets added. Duplicate pre-existing `api_url` settings declaration removed while extending config.

Dependency added: pinned `pypdf==6.1.1` for reproducible extraction of the official PDF. No frontend dependency/version changes. Recharts reused and real feature/chart chunk lazy loaded. Existing large spatial chunk advisory remains.

## Frontend

Real mode is the default on every production-facing workspace route. Mode is URL state (`?data=sample` explicitly selects legacy simulation); refresh/back/forward correct. No persisted fake-data default and no automatic fallback. Overview/Regions expose observed filters and history; training is an explicit view of its own dataset. NIC view searchable/paginated. Forecast shows historical foundation, no predictions. Skills/occupations/demand/GIS show truthful unavailable states. Reports shows coverage/quality rather than fake generated real reports.

Observed rate denominator, ages15+, period, sex/sector/activity and evidence remain explicit. Chart sorted chronologically;0–100 percentage axis; original observations only, no smoothing/interpolation/forecast. Tooltips source+period; matching accessible tables. State metrics are never manufactured from national rates. Training counts never become a cohort certification rate or training capacity.

View evidence exposes publisher, publication/version, period, coverage, method, retrieval, cell/page locator, transformations, reuse terms, limitations and raw hash. English/Hindi resources centralized; official classification/source metadata retained in published language with a translated explanation. All new UI/filter/ARIA/status labels bilingual.

## Verification

Before edits: build/lint and all six existing browser suites passed. After implementation: npm install (existing frontend packages; audit0vulnerabilities), build pass, lint pass with no warnings,10 backend tests pass. Existing suites pass: Phase1 (29checks), Phase1.5(6), Phase2.2preferences(11), Phase2.2localization(8), Phase2.4workspace(9), Phase2.3.1auth(8). [Regression summary](verification/regression-summary.json).

New browser suite verifies actual API responses/known published rates, rejected query values, missing/quarantined observations, real default, evidence/focus/Escape, functional filters, training cautions, canonical search/no fake skills, provider history, network failure/retry without simulation, chronological source tooltip, NIC pagination and language persistence. Final result: [results.json](verification/results.json).

Visual matrix:1440/1280/1024/768/390 × light/dark × English/Hindi; nine routes plus training/evidence captures. 220 screenshots captured with automated overflow checks. Representative screenshots were manually inspected across all five requested widths, both themes and both languages; not every capture was manually inspected. Source PDF tables16/17/18 also rendered and visually checked. Fixes from QA: reversed source-row time axis sorted chronologically; explicit accessible selector names; absolutely positioned screen-reader labels contained within scrolling tables; NIC pagination avoids a 332-row page. No accessibility certification claimed.

Existing test changes are explicit, not weakened expectations: old simulation suites select `?data=sample` through a shared fixture; sample query stripped only for existing route matching; unknown-route recovery explicitly resumes sample workflow; named search input removes ambiguity introduced by the real/sample select; bootstrap blocker allows Vite cache-busting queries. Auth shortened-expiry test does not reload after sign-in, preserving its in-memory test expiry. Production auth code untouched.

Existing report Markdown is unchanged. Existing suites regenerate their conventional screenshot/result outputs; the new phase stores its own verification evidence. Full current git status/diff include earlier uncommitted work; the phase manifest identifies this turn's actual source/doc/data edits.

## Real / derived / forecast / simulation / limitations

**Real:** only the exact connected aggregates/references above. Historical supply indicators are not current2026 statistics. **Derived:** no new labour metric; normalization/filtering/quality sums only. **Forecast:** no evaluated model and no future estimate. **Simulation:** original labelled Phase2.4 skill/demand/gap/scenario/spatial/report prototype, explicit legacy mode only. **Unavailable:** NCO table permission/extraction, skill taxonomy version/reuse, real skill demand/vacancy feed, compatible skill-gap methodology, training capacity/centres/courses/placement, LGD codes/district observations, authoritative GIS/CRS/vintage, confidence intervals.

PLFS sampling estimates retained as published; January2025 design discontinuity not ignored. Training annual cohorts differ and one total fails reconciliation. NIC listing partial; names are not skill-demand measures. Source access/reuse terms require dataset-specific review before broader commercial redistribution. No full labour-market engine, ML, AI Analyst, predictive forecast, new OAuth, Azure or database infrastructure introduced. Next work should resolve verified source coverage and methodology before additional intelligence claims.
