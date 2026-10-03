# Phase 2.9.1 changed-file manifest

The repository already had extensive uncommitted changes from earlier phases. This list identifies this hero task separately; the full Git status is not a claim that all existing changes were authored here.

## Modified source files

- `frontend/src/pages/HomePage.tsx`: replace only inline hero with `HeroSection`; subsequent sections unchanged.
- `frontend/src/styles/home-hero.css`: full-width masked image, editorial columns, snapshot/source cards and responsive/reduced-motion behavior. Existing unused signal styles are retained; unrelated CSS was not deleted.
- `frontend/src/app/i18n/locales/en-IN.ts`: requested hero copy and new snapshot/source/loading/error/artwork labels.
- `frontend/src/app/i18n/locales/hi-IN.ts`: matching Hindi translations and interpolation keys.
- `frontend/src/features/real-intelligence/EvidencePanel.tsx`: supplied source works outside the workspace provider; existing workspace fallback preserved.
- `frontend/tests/phase15.browser.cjs`: intentionally update homepage heading expectation to the new required copy.
- `frontend/tests/phase22-localization.browser.cjs`: intentionally replace the removed conceptual hero node interaction assertion with keyboard/evidence/Escape/focus-restoration checks. Other localization/auth/footer/navigation assertions are preserved.

## Added source and assets

- `frontend/src/components/landing/HeroSection.tsx`
- `frontend/src/components/ui/Skeleton.tsx`
- `frontend/src/features/demand/useDemandSnapshot.ts`
- `frontend/src/assets/india-workforce-dark.webp`
- `frontend/src/assets/india-workforce-light.webp`
- `frontend/tests/phase291.browser.cjs`

## Added documentation and verification

- `docs/phase-2.9.1/PHASE_2_9_1_IMPLEMENTATION.md`
- `docs/phase-2.9.1/ASSET_PROVENANCE.md`
- `docs/phase-2.9.1/VERIFICATION.md`
- This manifest and `changed-files.json`.
- `verification/`: new hero screenshots/results, contact sheet/review crops, regression logs/results and final build/lint/Git records. The machine-readable manifest enumerates generated artifact files.

Earlier browser harnesses with a configurable output directory write their current results under this phase. Harnesses with a fixed directory regenerate their own existing verification images/results, without changing prior phase prose reports. These generated artifacts are enumerated separately from application edits. Temporary test-only diagnostics are removed after investigation.

## Intentionally untouched

Backend/source registry/ingestion/canonical datasets, all Phase2.9 taxonomy/supply/readiness gates, authentication/onboarding/account components, routes/providers/theme bootstrap, navigation, footer, other homepage/public sections, environment files, dependency manifests/lockfile and official KaushalIQ logo artwork. No dependency installation, commit or push.
