# Phase 2.9 changed-file manifest

This is the intentional Phase2.9 scope, separate from broader inherited uncommitted work. No files were deleted, reset, committed or pushed. Paths are relative to the repository root.

## Backend — added

- `backend/src/supply/__init__.py` — module boundary.
- `backend/src/supply/models.py` — supply, research/reference and mapping contracts.
- `backend/src/supply/build.py` — shared-parser acquisition validation, normalization/publication, coverage/quarantine gate.
- `backend/src/supply/repository.py` — integrity checks, cache and dimension indexes.
- `backend/src/supply/compatibility.py` — deterministic ten-dimension assessment, no gap arithmetic.
- `backend/src/routes/supply.py` — bounded public supply/reference/compatibility read APIs.
- `backend/tests/test_supply.py` — 18 supply/source/schema/compatibility/API tests; synthetic fixtures isolated here.

## Backend — extended

- `backend/src/config.py` — optional canonical supply path, using existing settings conventions.
- `backend/src/main.py` — register supply router.
- `backend/.env.example` — document optional `SUPPLY_DATA_PATH`; no secrets or real credentials.

## Frontend — added

- `frontend/src/features/supply/contracts.ts` — strict verified-data DTO decoding.
- `frontend/src/features/supply/useSupply.ts` — abortable version-bound fetch/retry state.
- `frontend/src/features/supply/SupplyIntelligence.tsx` — filters, observations, coverage, exceptions and shared evidence.
- `frontend/src/features/supply/TaxonomyDesk.tsx` — bounded reference search/pagination/evidence and research statuses.
- `frontend/src/features/supply/ReadinessPanel.tsx` — explicit assessment pair and per-dimension reasons.
- `frontend/src/app/i18n/locales/supply.ts` — centralized English/Hindi UI resources.
- `frontend/src/styles/supply.css` — flat semantic-token presentation and responsive tables/controls.
- `frontend/tests/phase29.browser.cjs` — 11 new browser groups and 28 screenshots.

## Frontend — extended

- `frontend/src/app/i18n/locales/en-IN.ts`, `hi-IN.ts` — merge supply resources.
- `frontend/src/app/config/navigation.ts` — exactly one `/supply` destination.
- `frontend/src/app/routes/AppRoutes.tsx` — route within the existing workspace shell.
- `frontend/src/components/layout/Header.tsx` — include supply in existing secondary module navigation.
- `frontend/src/components/navigation/NavigationLinks.tsx` — use existing connected training coverage for supply availability.
- `frontend/src/features/real-intelligence/DataProvider.tsx` — supply always uses verified mode, including explicit sample URL.
- `frontend/src/features/real-intelligence/RealIntelligencePage.tsx` — dispatch supply view.
- `frontend/src/features/real-intelligence/ObservedTraining.tsx` — exploration link, original view/API behavior preserved.
- `frontend/src/features/demand/DemandIntelligence.tsx` — supply exploration link; original observations preserved.
- `frontend/src/main.tsx` — load supply styling.
- `frontend/tests/phase231.browser.cjs` — intentional ten-destination navigation assertion and single supply-link check.

## Data — added

- `data/metadata/supply_source_registry.json` — reviewed centre-source acquisition descriptor.
- `data/metadata/taxonomy_source_registry.json` — research statuses/version/rights/access metadata.
- `data/raw/training/pib-centres-2289890.html` and `.html.receipt.json` — immutable official source and receipt.
- `data/staging/supply/extracted.json` — normalized staging publication.
- `data/processed/supply/validated.json` — validated publication.
- `data/canonical/supply/snapshot.json`, `manifest.json` — integrity-bound canonical release.
- `data/metadata/supply_quality.json`, `supply_coverage.json` — machine-readable exceptions and record coverage.

## Documentation and verification

Added under `docs/phase-2.9/`: `AUDIT_AND_PLAN.md`, `PHASE_2_9_IMPLEMENTATION.md`, `TAXONOMY_SOURCES.md`, `TAXONOMY_MAPPING.md`, `SUPPLY_DATA_SOURCES.md`, `SUPPLY_SCHEMA.md`, `COMPATIBILITY_METHODOLOGY.md`, `SUPPLY_COVERAGE.md`, `QUALITY_AUDIT.md`, `VERIFICATION.md`, this manifest, and `verification/` logs/results/screenshots/Git artifacts.

Existing browser harnesses regenerated their earlier phase verification outputs. These generated artifacts are not additional feature implementations. Initial failed regression logs and final sequential reruns are preserved in the new verification folder; earlier prose reports remain untouched.

## Intentionally untouched

Existing account/auth/OTP/provider/session/private-profile/resume logic; actual `.env` secrets; public homepage/pages/footer; theme and locale providers; official logo artwork; baseline raw datasets; base/demand canonical content; PLFS observations; NCS demand metrics; package versions/dependency set; forecasting, spatial and simulation engines. Existing sample mode remains isolated legacy regression behavior; supply never uses it.

No production occupation/skill/qualification mapping, seat/capacity data, district supply, gap arithmetic, ML or Phase3.0 feature was added. Complete Git status/diff artifacts include inherited changes and must not be mistaken for this manifest alone.
