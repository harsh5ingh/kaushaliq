# Verification

Baseline before implementation: frontend build/lint, ten backend unit tests, existing Phase2.5 browser suite and six earlier suites run successfully. Audit recorded original bundle sizes and source limitations.

Final verification outputs are stored under verification/. Commands:
- `npm install`
- `npm run build`
- `npm run lint`
- `python -m unittest discover -s tests -v` (backend)
- `node tests/phase1.browser.cjs`
- `node tests/phase15.browser.cjs`
- `node tests/phase22.browser.cjs`
- `node tests/phase22-localization.browser.cjs`
- `node tests/phase24.browser.cjs`
- `node tests/phase231.browser.cjs`
- `node tests/phase25.browser.cjs`
- `node tests/phase26.browser.cjs`

New suite checks unchanged known rates; chronology; keyboard point inspection/evidence/focus restore; source tooltip; method boundary; every regional dot against actual API; ordering/missing state slices; invalid filters; rejecting post2025 contract; spatial/relationship unavailability; failure/retry without fallback; language persistence/reduced motion; production-mode sample rejection, absence of legacy/Three chunks and usability without WebGL.

Screenshot matrix: new suite 120 captures (six relevant redesigned views × five widths × light/dark × English/Hindi). Existing Phase2.5 suite also covers nine routes, training and evidence (220 captures). Representative screenshots manually inspected at all five widths across both themes/languages; not every matrix image manually inspected. No production screenshot shows legacy simulation. Previous development suites retain labelled regression screenshots in their original phase folders.

No certification claim: automated checks and manual screenshot/keyboard observations verify specific behavior, not complete WCAG compliance. Spatial WebGL test checks an honest non-WebGL coverage view, not a newly built geographic renderer.

## Results
Frontend install: up to date, zero audit vulnerabilities. Build and lint pass. Ten backend tests pass. Six historical browser suites (71 check groups) and the Phase2.5 suite (11 groups) pass. Final Phase2.6 results are in verification/results.json; screen captures are real mode only. Build output preserves the selected Recharts MIT notice verbatim as visualization-license.txt. No dependencies added.

Phase2.6 final: 10 check groups pass, 120 matrix captures, zero recorded browser exceptions. Final manual sample inspection: dark English1440, light English1280, dark Hindi1024, light Hindi768, dark Hindi390; additional light English1440 and mobile historical captures inspected. Narrow comparison ticks no longer collide. All 220 earlier real-data captures and regressions also pass.
