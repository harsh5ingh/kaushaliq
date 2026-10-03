# Phase 2 implementation roadmap
Status: sequential proposal only. Phase 2 Step 1 is inspection/research/documentation. Each phase below needs a separate instruction; none starts automatically.

## 2.1 — Design-system foundation
Depends on acceptance of these documents. Implement semantic tokens for both themes, spacing and type roles; trial bilingual editorial/UI specimens. Consolidate proven dead CSS and control variants incrementally. Preserve the current visual structure while migrating roles.
Gate: primitive states, contrast checks, build/lint, no route/interaction regressions, logo bytes unchanged. Font adoption only after license/payload and Hindi review. Rollback: old token aliases until migration is verified.

## 2.2 — Global navigation and themes
Implement pre-paint theme bootstrap, provider and Light/Dark/System control; centralize route metadata; remove artificial account/status affordances. Plan locale control slot but do not expose an incomplete Hindi toggle.
Gate: first-paint screenshots, persisted/system/blocked-storage behavior, keyboard and modal focus, existing route tests. Correct preference-storage tests before turning persistence on. Update complete component surfaces before enabling theme selection.

## 2.3 — Public homepage and supporting pages
Implement the editorial evidence-reading composition, reduced section repetition and consistent grid. Preserve honest availability, real links and separate public/workspace shells. Give contact/docs/legal pages truthful route-specific content, not invented corporate details.
Gate: screenshots at 1440/1280/1024/768/390, 200% zoom, bilingual expansion specimens, no new unsupported product claims. No fake chart data.

## 2.4 — Authentication UX
Refine current forms with shared controls and typography, clearer preview expectations, focus after completion/mode changes, field-specific error clearing, and fallback focus after menu handoff.
Gate: sign-in/signup/reset/OAuth preview behaviors, history and query preservation, keyboard/screen-reader review, no credential storage or auth network calls. Real authentication explicitly excluded here.

## 2.5 — Intelligence workspace
Replace repetitive boxed placeholder content with a useful question/scope/evidence layout. Keep explicit planned domain routes. Restructure metrics only where they communicate something; do not invent replacement numbers.
Gate: existing health connection and palette work; no lost sample labels; accessible density and data panels in both themes; observed/derived status cannot be inferred merely from fixture shape.

## 2.6 — Visualization presentation contracts
Extend ChartCard only as needed for typed evidence, units, availability, accessible summaries, tables and theme-aware SVG/tooltip presentation. Define which questions each chart answers. Recharts remains available.
Gate: empty/error/loading/missingness, keyboard access and chart-token checks. This phase may use unmistakable isolated UI test fixtures, not public fabricated analytics. Real data-backed charts depend on 2.9, so this is not a claimed intelligence release. No GIS/3D/forecast engine.

## 2.7 — Localization rollout
Add typed messages, Intl formatters, locale provider and reviewed English/Hindi critical journeys. Release the selector only after coverage gate. Use script-specific fonts and logical CSS.
Gate: key parity, human Hindi terminology review, number/date tests, translated accessibility labels and no layout clipping. Earlier phases must already externalize new shared copy rather than create avoidable rework.

## 2.8 — Authentication/backend integration
Separate security-engineering scope with selected deployment topology and a threat model. Keep UI/service/session boundaries from phase-1.5 documentation. Plan password hashing, secure cookies or justified token design, expiry/refresh, OAuth Google/GitHub, recovery, CSRF where applicable, rate limits, secure redirects, invalidation and secret rotation.
Gate: real end-to-end tests, security review and operational configuration. Never let polished UI imply this phase has already shipped.

## 2.9 — First real data workflow and storage decision
Profile candidate source licensing, update frequency, row counts, row width, file sizes, history, query shapes, concurrency and retention before choosing infrastructure.
Start with versioned local structured fixtures for demo reliability; a small SQLite/relational store may fit structured queries. Consider PostgreSQL only when deployment/concurrency/query requirements justify it. Object storage (Azure Blob or another provider) is for large immutable raw artifacts or derived files when size/lifecycle/access requirements warrant it, not because the product is “enterprise.”
Maintain raw immutable source + manifest → validated/normalized processed records → analytical results with methodology/version → repository/API → frontend. UI fixtures stay separate. Raw files never become frontend imports. Failed validation does not silently replace a good dataset.
Gate: one traceable India-focused question answered end to end; missingness/coverage/uncertainty stated; local fallback version explicit; no fabricated findings. Only then complete the real-data part of 2.6.

## 2.10 — Production hardening
Deployment SPA rewrites, configured origins, CSP, health/readiness distinction, accessibility review, responsive/cross-browser tests, performance and asset budgets, observability without credential leakage, legal/contact readiness, operational runbooks and release/rollback checks.
Gate: clean setup on another machine, offline/demo fallback, production refresh/auth redirect verification and documented ownership. Earlier quality gates remain mandatory; accessibility is not deferred until this phase.

## Configuration ownership
Current consumed variables:
- frontend VITE_API_BASE_URL: public API base; empty means /api.
- Vite process API_PROXY_TARGET: development proxy target only. It currently reads process.env; putting it in .env is not enough unless Vite config is explicitly changed to load it.
- backend APP_NAME, APP_VERSION, ENVIRONMENT, FRONTEND_URL via Settings; FRONTEND_URL currently represents one CORS origin.

Future variables only when consumers are implemented:
- Public frontend: app URL, supported regions/locales, explicitly nonsecret release flags, public OAuth client IDs if the chosen flow needs them.
- Backend/deployment secrets: database DSN, OAuth secrets, signing/session keys, AI keys and storage credentials. Never VITE_*.
- Deployment config: exact frontend/backend origins and validated redirect allowlists, analytics configuration/consent, feature availability and storage backend choice.
Vercel/Render are examples, not a selected hosting dependency. No hardcoded production hosts. Feature flags are not authorization. Validate required configuration at startup; separate build-time frontend values from runtime backend settings. Never embed AI/database/storage secrets into source or the browser bundle.
No .env.example changes in this step: existing consumed configuration is sufficient and adding dormant keys would imply integrations that do not exist. Update examples alongside each actual consumer.

## Verification and scope discipline
Use the existing two browser scripts, but parameterize new output directories to preserve Phase 1/1.5 artifacts. Extend for light/dark/system, preferences, localization, modal transitions, forced colours and screen-reader journeys. Retain build/lint and actual backend health tests when code changes.
Current audit did not rerun build or browser tests because no executable files changed. It reviewed saved results, source and screenshots and calculated proposed core colour contrast only.
No commits/pushes, dependencies, datasets, databases, ML, auth backend or full visual rewrite belong to Step 1. Stop after the eight documents.
