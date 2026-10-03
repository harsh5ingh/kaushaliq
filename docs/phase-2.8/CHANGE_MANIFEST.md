# Phase 2.8 changed-file manifest

Additive demand backend: `backend/src/demand/{__init__,models,normalize,build,repository}.py`, `backend/src/routes/demand.py`, `backend/tests/test_demand.py`.

Extended existing backend: `backend/src/data_pipeline/acquire.py` (optional reviewed registry function/CLI), `backend/src/data_pipeline/build.py` (optional registry reader), `backend/src/config.py` (demand publication path), `backend/src/main.py` (public router), `backend/.env.example` (safe optional path comment). Prior account-related edits in shared files are preserved.

New frontend: `frontend/src/features/demand/{contracts.ts,useDemand.ts,VacancyComparison.tsx,DemandIntelligence.tsx}`, `frontend/src/app/i18n/locales/demand.ts`, `frontend/src/styles/demand.css`, `frontend/tests/phase28.browser.cjs`.

Extended frontend: `frontend/src/features/real-intelligence/{RealIntelligencePage,EvidencePanel}.tsx` (demand route/report coverage and optional source reuse), `frontend/src/app/i18n/locales/{en-IN,hi-IN,real-data}.ts` (new bilingual resource/shared coverage disclosure), `frontend/src/main.tsx` (scoped stylesheet import).

Data: `data/metadata/demand_source_registry.json`, `data/raw/ncs/ncs-active-vacancies-2025-07-14.html` + receipt, `data/raw/terms/pib-demand-copyright-2026-10-03.html` + receipt, `data/staging/demand/extracted.json`, `data/processed/demand/validated.json`, `data/canonical/demand/{snapshot,manifest}.json`, `data/metadata/{demand_coverage,demand_quality}.json`.

Documentation: this manifest and the seven other required phase reports, AUDIT_AND_PLAN.md, `verification/` test logs, results/screenshots and final Git artifacts. Existing browser suites regenerate their own verification images/results; these are regression artifacts, not unrelated source rewrites. Full repository Git status includes earlier uncommitted Phase2.7.1 work and is intentionally not a list of just this phase.

Intentionally untouched source: auth/accounts/password/session/OTP/demo seed, account/profile pages, public homepage/footer/navigation, official logos, theme/provider architecture, existing canonical labour data, existing legacy simulation, backend dependencies and frontend package versions. No commit/push/reset/restore.

Exact machine-readable list: `verification/changed-files.json` — 45 source/config/data/test/document files (11 existing files extended, 25 new source/data/test files, 9 phase documents), plus phase verification artifacts. Full inherited tracked diff currently includes 443 files, largely regenerated regression screenshots; that Git total excludes new untracked files and must not be interpreted as this phase's source-change count.
