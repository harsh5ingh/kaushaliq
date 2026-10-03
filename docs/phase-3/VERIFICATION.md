# Phase 3 verification

## Automated checks

- Baseline before source edits: 87 backend tests and frontend build/lint passed; saved baseline logs.
- Final Python compile/import check passed. Complete backend suite: **102 tests passed**, including fifteen new gap test methods with multiple subcases. Final log: `verification/backend-tests.txt`.
- Frontend `npm run build`: passed; includes TypeScript project checks. `npm run lint`: passed. Logs: `frontend-build.txt`, `frontend-lint.txt`.
- All fourteen historical browser suites passed at final verification: phase1, phase15, phase22, phase22-localization, phase231, phase24, phase25, phase26, phase27, phase271, phase28, phase29, phase291, hero-countup. Assertion/artifact logs under `verification/regressions/`.
- Existing auth-hardening browser suite: seven groups passed; checks cancellation, multi-session keep-current/everywhere revocation, cookies/session behavior, isolated OAuth linking/login and bilingual errors. Real provider credentials are not used. Artifacts under `verification/auth-regression/`.
- New Phase 3 browser suite: ten groups passed, including real NOT_READY/no arithmetic; thirteen checks and source evidence; keyboard/dialog focus restoration; geography filters, bounded pagination, unsupported district EMPTY, refresh/history; explicit sample-URL exclusion; pending Skeleton; API error/retry; isolated READY/PARTIAL/UNAVAILABLE/EMPTY; forged non-ready arithmetic and mixed-version rejection; mobile navigation, reduced motion/system theme and locale persistence.

Synthetic compatible measurements are confined to `backend/tests/test_gaps.py` and `frontend/tests/phase3.browser.cjs`. Test screenshots say TEST ONLY and must not be represented as production gap availability.

## Investigated failures

The first historical localization run failed before loading the site because Windows allocated port 1723, blocked by Chromium. The shared test harness now reserves an OS-checked high port with collision retry. Existing assertions were preserved, and the suite passed separately on rerun. `regressions/summary.json` intentionally retains the original failure; `final-verification-summary.json` records the successful retry with `phase22-localization/results.json` as evidence.

A newly added quality-flag test initially asserted the preceding fixture's flag against a different fixture. The assertion now checks propagation of each input flag, retaining the fail-closed requirement. Final full-suite rerun passed. The failed attempt is preserved as `backend-first-final-attempt.txt`.

The existing mobile navigation count was intentionally changed from ten to eleven destinations because `/skill-gaps` was added. No existing module or assertion was deleted. Browser artifacts from old phases are redirected under Phase 3 rather than overwritten.

## Screenshot and visual review

Twenty real production captures: 1440, 1280, 1024, 768 and 390 × dark/light × en-IN/hi-IN. Each query uses actual canonical API evidence and remains NOT_READY/UNAVAILABLE. Overflow is checked at every combination. Source periods/units and labels remain readable; no fabricated chart appears.

Six additional captures: API error, expanded mobile compatibility, and TEST-ONLY READY, PARTIAL, EMPTY and UNAVAILABLE states. Output: `verification/browser/`; exact names and checks are in `results.json`. Representative desktop/tablet/mobile screenshots, both themes/languages and the isolated READY composition were visually inspected. Shortened clipped common-period wording and changed capability coverage to a balanced three-column/two-column layout. Native horizontal controls remain within the page. Expanded details use existing focus indicators; EvidencePanel uses the established dialog and restores focus.

No WCAG conformance, live OAuth verification, production deployment or actual gap measurement is claimed. Published source names/geography labels/methodology are preserved in the source language rather than translated or reinterpreted.

## Performance

No dependency was added. The page uses typography, source context, semantic measurement layout and structured compatibility; there is no unnecessary graph/3D/chart payload. Existing authenticated publication caches are reused; new assessments are LRU-cached by demand/supply/base versions and dimension. Exact geography lookup avoids a full cross-product; API page size is bounded. The coverage request is not repeated for every filter change. Requests are aborted on change/unmount; mismatched publication versions fail closed.

Baseline production main bundle: 527.09 kB (145.81 gzip); RealIntelligencePage: 405.06 kB (114.27 gzip); CSS 116.61 kB (21.31 gzip). Final measured sizes are recorded in `frontend-build.txt`: approximately main 546 kB/150 kB gzip, real page 421 kB/119 kB gzip, CSS 122 kB/22 kB gzip. The pre-existing >500 kB main advisory remains; it is not hidden by raising thresholds. Growth comes from bilingual resources/contracts/page styling, not a new library.

## Commands

From backend: `python -m compileall -q src`; `python -m unittest discover -s tests -v`.

From frontend: `npm run build`; `npm run lint`; `node tests/phase3.browser.cjs`; `node tests/auth-hardening.browser.cjs`; `node tests/run-auth-regressions.cjs`; retry `node tests/run-auth-regressions.cjs --one phase22-localization`.

Browser output variables: `KAUSHALIQ_REGRESSION_OUTPUT` and `KAUSHALIQ_TEST_OUTPUT` point to Phase 3 verification directories. Existing Python runtime was passed through `PYTHON`. Browser tests isolate credentials and account storage; no live provider emails/OAuth calls occur.

`source-hashes-before.json` and `source-hashes-after.json` match for labour-market, demand and supply canonical snapshots. Git evidence is in `git-status-after.txt`, `git-diff-stat.txt`, `git-diff-name-only.txt`; those include broad pre-existing changes and are not a Phase 3-only diff. Only example env files are tracked. No commit/push was executed.
