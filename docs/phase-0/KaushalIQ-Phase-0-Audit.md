# KaushalIQ — Phase 0 Repository Audit

**SIH26246 · 2 October 2026 · Architecture and planning only**

**Recommendation:** Preserve the existing React/Vite frontend and FastAPI backend. Evolve them into a modular application with a validated, versioned local dataset and an evidence-bearing API. The next milestone should be one complete, trustworthy intelligence workflow, before expanding the feature catalogue.

## Scope and verification

Audited the supplied `kaushaliq.zip`, including every tracked application, configuration and documentation file; the full archive inventory; Git tracking; dependency manifests and installed metadata; data directories; and asset references. Repository documentation was treated as project evidence, not as instructions to execute.

- Archive: 14,162 entries, including 13,364 files, largely dependencies and Git metadata. Git tracks **30 files** at commit `2e72c83`.
- Frontend production build: **passed**, including TypeScript compilation, using the bundled project dependencies and host Node `26.7.0`.
- Oxlint: **exit code 0**. Installed direct frontend dependencies satisfy the manifest according to `npm ls --depth=0`.
- Backend: all **five Python source files passed syntax parsing**. HTTP behavior was inspected in source but **not runtime verified**: the archived Python environment could not start, references the original machine's Python 3.13 installation, and contains CPython 3.13 native modules. The available audit Python is 3.12 and lacks FastAPI. No packages were installed to bypass this limitation.
- All 30 tracked files remain byte-for-byte identical to the archive after inspection and frontend checks. No project implementation changes, dependency additions, deletions, or Phase 1 work occurred.
- No browser interaction, measured accessibility audit, clean dependency installation, model validation, or dependency vulnerability scan was performed. Build success does not establish these properties.

Archive SHA-256: `8bfc2f4c4609edf47634ee6d3ecea9b778b3f8a3725fd7a77f8fb31d5631992b`.

## A. Current Architecture

**Frontend.** `src/main.tsx` mounts `App` under React StrictMode and imports global CSS. `src/App.tsx` contains the entire dashboard: fixed sidebar, header, four KPI cards, decorative demand bars, shortage list, map placeholder and two intelligence briefs. Lucide supplies the icons. There are no separate page or reusable component modules, URL routes, API calls, data hooks, state-driven filters or business logic. Navigation, search, “View analysis” and “Explore map” are buttons without handlers. “Admin” is presentation text, not authentication.

All displayed intelligence is static: four KPI values and deltas, ten bar heights, four shortage classifications and two insights. Recharts is installed but not imported. The map is a styled placeholder, and no AI or forecasting engine is connected.

**CSS and assets.** `App.css` contains 551 lines spanning globals, shell, panels and visualizations; `index.css` repeats basic page styling. The dark palette, blue accents, restrained transitions and panel hierarchy are reusable. The layout has a fixed sidebar, two-column panels and a `body` minimum width of 1,180px, with one breakpoint at 1,250px. Inter is requested by the font stack but no font asset or import provides it; system fallbacks apply. The HTML title remains `frontend`, and the favicon is the Vite mark. Starter React/Vite/hero assets and the public social-icon sprite have no references in current application code.

**Backend.** `src/main.py` constructs FastAPI, imports settings, applies CORS and mounts `src/routes/health.py`. `config.py` already uses **pydantic-settings**, beyond the abbreviated stack in the request. Settings cover app name, version, environment and one frontend origin.

Implemented business-visible routes are `GET /` for an API message and `GET /api/health` for a constant status/name/version response. FastAPI is also configured with its default documentation/OpenAPI endpoints. No data repositories, analytics, domain services, persistence, auth or tests exist.

**Repository and documentation.** The root README has 53 sections describing the target platform; section 52 explicitly distinguishes that roadmap from delivered functionality. The frontend README remains template documentation. `docs/` and all three data directories are empty. Those empty directories have no tracked files, so a Git clone will not reproduce them. There is no CI configuration, startup guide, committed runtime selection or test suite. The root lockfile has an empty `packages` object and no accompanying root `package.json`; the actual application lockfile is in `frontend/`.

## B. Problems / Technical Debt

These are recommendations for the next authorized phase; **none was changed during this audit**.

1. **Highest priority: distinguish demonstration content from evidence.** `frontend/src/App.tsx:15` hardcodes the KPIs; line 35 labels `91.6%` as forecast accuracy. Shortages and briefs at lines 174, 230 and 244 have no calculation or provenance. Before presenting the dashboard as intelligence, mark illustrative content clearly and replace metrics incrementally with computed results. An accuracy percentage needs a defined metric, evaluation period and test protocol; it must not become a product promise.
2. **Responsive layout blocks smaller displays.** `frontend/src/App.css:17` forces 1,180px width. The breakpoint at line 537 only narrows the sidebar and changes KPI columns. Introduce a collapsing navigation pattern and stacked panels in the next UI phase. Small 9–11px labels and subdued text warrant contrast and projector-readability checks; accessibility compliance is not established by source inspection.
3. **No working interaction or frontend/backend integration.** The static shell is a valid starting point, but visible controls currently imply functionality they do not provide. Prioritize one complete workflow and make unavailable actions explicit until implemented.
4. **UI and intelligence boundaries are absent.** `App.tsx` owns layout, data, classifications and rendering. Split it when integrating the first real slice, preserving its visual structure. Do not replace it wholesale or move constants into a fake API and call that intelligence.
5. **TypeScript strict checking is not enabled.** Neither TS configuration enables `strict`; the resolved app configuration confirms its absence. Introduce strict checking before substantial API/domain types accumulate. This catches additional type errors beyond the current unused-variable checks. [TypeScript reference](https://www.typescriptlang.org/tsconfig/strict.html).
6. **Reproducibility is underdocumented.** Add verified setup/start/check instructions and a supported Node/Python choice later. The ZIP includes `node_modules`, `.venv` and `.env` even though Git excludes them. Its `.env` is identical to the non-secret example; this is a packaging-hygiene finding, not evidence of leaked credentials. Distribute source and lockfiles with explicit setup rather than relying on copied environments.
7. **Configuration can drift.** `backend/src/routes/health.py:11` hardcodes a version already held in settings. `config.py:11` resolves `.env` relative to the process working directory. Document running from `backend/`, or make configuration paths explicit when improving startup. Pydantic's relative dotenv lookup uses the current working directory. [Pydantic settings documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/).
8. **Demo readiness is not checked.** `/api/health` proves neither dataset availability nor analytical readiness. Retain simple liveness; add separate dataset/readiness reporting once data exists. CORS allows the configured localhost origin, credentials and all methods/headers; this is not an authentication system. Configure deployment origins deliberately later, without treating CORS as access control.
9. **Lower-priority cleanup.** Replace template title/favicon and frontend README when polishing the product. The empty root lockfile and unused starter assets can be assessed in a separate cleanup. Do not delete them merely to make this audit look productive.

The missing future engines are expected scope, not defects requiring immediate implementation.

## C. Recommended Architecture

Use **one React application and one modular FastAPI application**, with an explicit import pipeline. Independent domain modules inside one deployable backend provide sufficient separation now. FastAPI's existing router mechanism supports this direction without additional services. [FastAPI modular application guidance](https://fastapi.tiangolo.com/tutorial/bigger-applications/).

Recommended dependency flow:

`page → feature hook → API client → route/schema → domain service → analytics + repository`

Repositories own reading datasets or storage. Analytics owns deterministic calculations. Services coordinate domain operations and attach evidence. Routes validate HTTP input and serialize results. Analytics should not import FastAPI or frontend concepts. Modules exchange typed inputs/results rather than importing another module's storage internals.

Grow these boundaries only with working functionality:

- **Frontend:** keep the current entry point; add an application shell, overview page, layout components, API client and domain types with the first integrated workflow. Introduce feature folders as a feature gains its own queries, state and components.
- **Backend:** retain `src/main.py`, `config.py` and the existing health router. Add a domain route, schemas, service, calculation and file repository for the first dataset. Consolidate routes under `src/api/routes/` when that improves navigation; a folder move alone is not a milestone.
- **Pipeline:** start with one explicit import command, placed with backend data-processing code. It validates and creates snapshots outside request handling. A top-level pipeline package is justified only once several sources share that workflow.
- **Storage:** CSV/JSON snapshots are sufficient for the first small demonstrator. Add a database when query volume, concurrent writes or persistence needs justify it. Keep storage-specific behavior behind repositories. Do not create empty ORM models or a generic repository framework.
- **Documentation:** add a short architecture decision record, dataset manifest, metric definitions and runbook as each becomes real.

No microservices, queues, Kubernetes, graph database, vector store or elaborate plugin registry is required for this architecture.

## D. Dependency Assessment

**Retain all current dependencies and locks during this phase.** The recorded versions below come from this archive, not a recommendation to upgrade.

- **React / React DOM:** manifest `^19.2.8`; lock and installed version `19.3.0`. Keep together.
- **Lucide React:** `1.49.0`; actively used and suitable for a consistent icon system.
- **Recharts:** `3.10.1`; currently unused, but already appropriate for the first real demand and forecast charts. Keep it; add no competing chart library.
- **Vite / React plugin:** locked `8.3.2` / `6.1.1`; build passed. Their archived engine metadata requires Node `^20.19.0 || >=22.12.0`. Document a supported, tested runtime rather than leaving it implicit.
- **TypeScript / Oxlint:** locked `6.0.3` / `1.86.0`; preserve the toolchain. Enable stricter checking as a scoped change, rather than replacing the linter. Keep existing React/DOM/Node type packages.
- **FastAPI `0.142.2`, Uvicorn `0.54.0`, Pydantic `2.13.5`, pydantic-settings `2.15.0`, python-dotenv `1.2.4`:** useful API/configuration stack. The backend requirements pin 20 packages, including runtime dependencies. Record direct requirements separately from the resolved environment later if maintenance warrants it; do not casually unpin them now.
- **Other backend pins:** Starlette, AnyIO, pydantic-core, typing helpers, HTTP/runtime/reload support and OpenTelemetry API should remain untouched pending a clean-environment dependency check. In particular, archived FastAPI metadata requires OpenTelemetry API, so its presence does not prove an unnecessary observability subsystem.

No router, query-cache, global state, animation, map, 3D, data-science or LLM package is needed for Phase 0. Evaluate routing when adding actual pages; use native fetch initially. Add statistical tooling only after choosing the dataset and forecast baseline. Do not infer application-level Redux usage from Recharts' transitive packages.

## E. Data Architecture

Use a reproducible pipeline:

`raw/source snapshot → validation/rejects → canonical normalization → processed snapshot → analytics result → API schema → frontend view model`

**Ownership and separation**

- `data/raw/`: immutable source extracts plus source URL/provider, retrieval time, coverage, licence/usage notes and checksum. Never edit originals to correct data.
- Validation: enforce required columns, types, dates, units, duplicate rules and foreign-key mappings. Record rejected rows and reasons; do not silently discard failures.
- Normalization: map aliases to stable skill IDs and locations to stable region IDs; maintain mapping versions and unknown/unmapped values. Preserve source-specific IDs for lineage.
- `data/processed/`: reproducible normalized records and aggregates, with schema version, dataset version, pipeline version and quality report. Publish a snapshot only after validation passes.
- `data/sample/`: small, deterministic, clearly labelled demonstration input using the same canonical contract. Include a manifest explaining which records are synthetic. Process sample and real sources through the same validation and analytics code.
- Analytics: compute demand, supply proxies, changes and later forecasts in backend code. Store expensive outputs separately as versioned derived artifacts only when needed. UI fixtures, if later required for component tests, belong with those tests and never masquerade as production data.

**Minimum conceptual data model**

Start with canonical skills, regions and demand observations. Add occupations, industries, supply observations, training capacity and relation records as the first use cases require them. Each observation needs entity IDs, period start/end, geography, measure, value, unit, source and dataset version. Distinguish observation time from retrieval time. Region levels and boundary versions matter when comparing states or districts over time.

Do not equate job-posting counts with total vacancies, trained people with available workers, or training seats with immediately employable supply. A posting can mention several skills and therefore cannot be summed across skills as unique jobs. Deduplicate before aggregation, align dates/geographies, retain denominators and coverage, and represent missing observations as missing rather than zero.

A demand/supply difference is meaningful only with compatible measures. If using normalized indices, document the reference population, formula and scale; describe the result as an index difference rather than an absolute worker shortage. Training completions, employment status and availability require separate assumptions.

**Evidence contract:** every important result should carry or reference source IDs, dataset version, observation period, geography, units, method/version, filters, generated time, coverage/quality caveats and applicable uncertainty. Use an evidence ID linking to fuller provenance instead of repeating large payloads. Quality flags are not statistical confidence intervals. “Why” should distinguish measured contributors from plausible explanations; correlation alone does not establish a cause.

**Reliable demo mode:** select the sample dataset explicitly at backend configuration/startup. Keep the API shape unchanged. Bundle data and essential assets locally; display “Sample data” and the snapshot period. Never silently switch a failing live query to invented values. An unavailable live source may use an identified last-good snapshot with a visible stale-data state; backend failure should produce an honest error, not fabricated success.

## F. API Architecture

Preserve `GET /` and `GET /api/health`. Introduce `/api/v1` for new domain endpoints when they are implemented; no fake endpoints should be registered now.

Proposed boundaries:

- **Overview:** `GET /api/v1/overview` composes existing metric services so the dashboard does not reproduce calculations.
- **Entities:** `/skills`, `/skills/{id}`, `/regions`, `/regions/{id}`, then `/occupations`, `/industries` and `/training` as supported by data.
- **Measurements:** `/demand`, `/supply`, `/gaps` and `/trends`, with consistent region, skill, industry, occupation, date-range and granularity filters.
- **Evidence:** `/datasets` and `/evidence/{id}` expose freshness, provenance and methodology useful to the UI.
- **Later intelligence:** `/forecasts`, `/skill-graph` and `/alerts` return computed results. `POST /scenarios` accepts bounded assumptions; `POST /analyst/queries` accepts questions for approved analytical tools. Add stored result/run endpoints only if those operations actually become asynchronous or persisted.

Use Pydantic request/response models as the API contract. Keep transport schemas separate from storage records and analytics internals. Return structured numeric values and units, not preformatted “24,680” strings. Use stable IDs, bounded queries and pagination on lists. Adopt consistent error codes/messages/request IDs; distinguish invalid input, unknown entities, insufficient coverage and temporary unavailability. Prevent nonfinite numeric values from leaking into JSON.

Metadata should identify dataset/method versions and explain unavailable values. An empty dataset is a valid empty result with coverage information; a missing required dataset is an operational error. Keep expensive ingestion and model fitting out of normal GET requests. Add authentication before private data or privileged operations; a local public-data demonstration does not need premature role infrastructure.

## G. Frontend Architecture

Preserve the current design and extract responsibilities incrementally:

- **`app/`:** route composition, actual providers and runtime configuration. Avoid installing empty provider layers.
- **`pages/`:** URL-level composition and filter coordination. Begin with the existing overview; add detail pages only when data supports them. Prefer one landing/overview experience over separate empty Home and Intelligence pages.
- **`components/layout` and `navigation`:** shell, sidebar, header and responsive navigation. Use real links for navigation once routing exists.
- **`components/ui`:** shared buttons, panels, status badges and controls when reused. **`components/dashboard`:** reusable metric cards and summary panels.
- **`features/<domain>/`:** feature queries/hooks, filter behavior, domain-specific views and adapters. Start with skills or overview data, not every future capability.
- **`services/`:** one fetch client plus domain API functions for base URL, query encoding, cancellation and normalized errors. Do not also duplicate API ownership inside features.
- **`types/`:** genuinely shared contracts; keep feature-specific types close to their feature. **`styles/`:** design tokens and global styles, while component styles remain scoped.

Pages should not fetch raw CSV files, compute supply gaps or know which data provider is active. Hooks manage request state; visualization adapters format results. Use URL state for shareable filters, local state for transient controls and shared context only for genuinely cross-page concerns. Carry loading, empty, error, stale and sample states through the interface. Add typography/spacing/color tokens, keyboard focus, readable labels and restrained motion in the first product-quality pass.

## H. Visualization Architecture

Isolate renderers from intelligence and storage:

`domain result → visualization adapter → chart / map / graph / 3D renderer`

- **Charts:** `components/charts/` wraps Recharts with consistent axes, units, legends, tooltips and uncertainty bands. Accept typed series and emit selection events; no fetching or metric formulas inside chart components.
- **Maps:** `components/maps/` receives values keyed by region ID and separately versioned boundary geometry. Start at the geographic level the evidence supports. Use local, appropriately licensed boundaries for offline operation. Missing coverage needs a distinct appearance from low demand, plus a ranked-list alternative.
- **Graphs:** `components/graph/` accepts nodes and typed edges with weights, provenance and relation meaning. Keep graph computation in backend/domain logic and layout/rendering in the visualization layer. Co-occurrence, prerequisites and inferred relationships must remain distinguishable.
- **Future 3D:** `components/3d/` can render the same Skill Graph data used by 2D views. Load it on demand, bound node counts, handle selection accessibly and provide 2D/list fallback for WebGL or device limitations. No Three.js or React Three Fiber installation now.

Use shared labels, selection IDs and evidence links across renderers. Provide accessible summaries or tabular alternatives, avoid encoding meaning only through color, and respect reduced-motion preferences. Presentation mode should later compose these same components rather than create another analytics implementation.

## I. Future Intelligence Architecture

Introduce each engine as a testable backend module with typed inputs and versioned outputs. A practical shared result record includes run ID, dataset version, filters, method version, result values, evidence references and limitations. Avoid a universal engine framework before two real engines demonstrate common needs.

- **Forecast engine — Predict:** consumes normalized time series; returns horizon, point forecasts, uncertainty where supported and evaluation results. Establish naive/seasonal baselines, time-ordered backtesting, leakage checks and horizon-specific errors before choosing more complex models. Refuse unsupported forecasts when history is insufficient.
- **Skill Graph — Connect:** consumes normalized relations; returns a versioned edge set with relation type, direction, weight and provenance. Files or relational tables are sufficient initially; a graph database is not required.
- **Ripple Engine — Connect / Explain:** consumes a selected change and a graph snapshot; returns bounded paths and propagated scores. Document decay, maximum depth, cycles and double-counting rules. Treat propagated influence as a modelled association unless causal evidence supports stronger claims.
- **Early Warning — Detect:** consumes observed trends, gaps and quality checks; applies explicit thresholds, persistence rules and later anomaly models. Return triggering evidence, severity and rule version. Suppress or qualify alerts caused by sparse data or ingestion failures; deduplicate repeated warnings.
- **Shock Simulator — Simulate:** consumes a frozen baseline plus explicit shocks and assumptions; returns baseline-versus-scenario differences and sensitivity. Never mutate baseline observations. Include timing and conversion assumptions for training effects. Label outputs as conditional scenarios, not forecasts of what will happen.
- **AI Analyst — Explain:** consumes approved analytical tools/results and evidence references. It explains calculations rather than generating them as unsupported prose. Validate tool inputs, limit scope and refuse unsupported questions. Deterministic evidence-based summaries should remain available without an LLM or internet connection; reserve generated text for interpretation.

The orchestration service can call these modules through ordinary functions and dependency injection. Only add background jobs when runtime measurements justify them. A future digital twin would require calibrated dynamics and feedback validation; a collection of modules alone should not be labelled a validated twin.

## J. Recommended Build Sequence

No actual SIH submission date was supplied, so this is a dependency-based sequence with exit gates, not an invented calendar. Each phase requires a separate instruction to start.

1. **Phase 1 — Reproducible foundation and UI honesty.** Document startup/runtime versions; verify backend HTTP behavior; centralize settings; label illustrative content; enable strict TypeScript; extract the shell/overview without redesigning it; make layout responsive. Define the first metric and dataset contract. **Exit:** a fresh setup can run both apps, current behavior is preserved, sample status is unambiguous and basic checks pass.
2. **Phase 2 — First complete intelligence workflow.** Choose a small explicit India-focused coverage slice; add versioned sample records, validation, skill/location normalization, file repository, demand aggregation, API and real Recharts overview/detail. Add sources, periods, filters and empty/error states. Include tests for deduplication, aggregation and API contracts. **Exit:** selecting a skill/region produces a reproducible number traceable to source rows, entirely offline.
3. **Phase 3 — Supply, gaps and regional decisions.** Add a defensible supply measure, compatible comparisons, regional views and an offline map/list. Add occupation/industry/training dimensions only where data supports them. **Exit:** a judge can explain one regional gap and its caveats; comparable-unit and missing-data cases are checked.
4. **Phase 4 — Forecasting MVP.** Add baselines, rolling backtests, uncertainty/limitations and one forecast view. Integrate evidence-based explanations. **Exit:** evaluation is reproducible and reported by metric/horizon; short histories do not receive unjustified predictions. This is central to the problem statement and takes priority over 3D or chat.
5. **Phase 5 — Demo freeze and presentation quality.** Rehearse a short Detect → Explain → Predict narrative; validate offline startup, source failure, reloads, empty data, laptop/projector layouts and keyboard flow. Cache/build local assets, pin the demo snapshot, add a reset/runbook and reuse components for presentation. **Exit:** a fresh-machine rehearsal succeeds without external APIs. Begin reliability checks in earlier phases; this is the final hardening gate.
6. **Phase 6 — Optional differentiators, time permitting.** Add the 2D Skill Graph before ripple calculations; early warnings can evolve independently from validated trends. Introduce bounded scenarios after reliable baselines, then an optional grounded AI Analyst. Skill DNA, transitions and training interventions reuse these domains. **Exit:** each addition provides a testable decision benefit; stop adding features if rehearsal reliability declines. 3D follows a proven 2D use case.
7. **Phase 7 — Post-demo evolution.** Expand real datasets, scheduled imports, persistence, access control, observability and scale based on measured requirements. Investigate a digital twin only after validating the component models.

For a compressed deadline, protect phases 1–5 and reduce geographic/sector coverage. Defer breadth, 3D and conversational polish before sacrificing source traceability, a valid forecast baseline or a reliable demonstration.

## Evidence index

Paths below are relative to the supplied repository; line numbers identify the audited snapshot.

- `frontend/src/App.tsx:15` — KPI constants; `:42` navigation metadata; `:50` single component; `:101` inert search; `:149` decorative bars; `:174` shortage constants; `:207` map placeholder; `:230` and `:244` briefs.
- `frontend/src/App.css:17` — minimum width; `:316` and `:323` panel columns; `:537` sole breakpoint. `frontend/src/index.css` and `main.tsx` — global styles and entry point.
- `frontend/package.json`, `frontend/package-lock.json`, `.oxlintrc.json`, three TypeScript configurations, `vite.config.ts`, and `index.html:7` — tooling, dependency and template findings.
- `backend/src/main.py:14` — CORS; `:21` router mounting; `:24` root route. `backend/src/routes/health.py:6` — health endpoint. `backend/src/config.py:11` — dotenv path.
- `backend/requirements.txt`, `.env.example`, archived `.venv/pyvenv.cfg` and installed package metadata — runtime/dependency findings. `.env` was compared with the example without reproducing its content in this report.
- Root `.gitignore`, backend/frontend `.gitignore` files and Git index — ignored runtime files versus tracked source. No data/docs files are tracked.
- `README.md:1082` — proposed API; `:1139` proposed stack; `:1197` target folders; `:1571` roadmap; `:1751` explicit current-status caveat. `frontend/README.md` — starter guide.
- All five image/SVG assets were inventoried; SVG references were inspected. Unused assets do not implement hidden application features.

**PHASE 0 AUDIT COMPLETE — WAITING FOR NEXT INSTRUCTION.**
