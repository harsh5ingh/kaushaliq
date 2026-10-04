# Phase 4 verification

## Baseline and final automated results

- Pre-change frontend build/lint: passed. Initial backend invocation: 101/102 passed because the unconfigured-OAuth account test inherited local configured provider values (200 instead of expected 503). Baseline repeated with Google/GitHub variables empty **in the test process only**: all 102 passed (`backend-baseline.txt`). No application auth logic, credentials or assertions were changed.
- Final complete backend: **119 tests passed**, including all existing Phase 3 tests and 17 new trend tests. Compile/import check passed. Final logs: `verification/backend-tests.txt`, `backend-compile.txt`.
- Final frontend Vite build passed; includes TypeScript `tsc -b` project checks. Oxlint passed. Logs: `frontend-build.txt`, `frontend-lint.txt`.
- Fourteen historical browser suites passed at final verification: phase1, phase15, phase22, phase22-localization, phase231, phase24, phase25, phase26, phase27, phase271, phase28, phase29, phase291, hero-countup.
- Unchanged Phase 3 browser suite: **10 groups passed**. Existing auth-hardening: **7 groups passed**, including keep-current/everywhere revocation and mock OAuth callbacks/account linking. No live provider credentials, emails or OAuth logins were used by these automated browser runs.
- New Phase 4 suite: **10 groups passed**. Covers actual PLFS/derived changes, method boundary, measured backtests, timeline/table ordering, evidence/focus/Escape, data-aware family/geography/activity/horizon filters, sparse stock history, partial/quarantined training, EMPTY/reset, API pending Skeleton, failure/retry, ungated predictions/null backtest metrics/mixed-version rejection, model/interval rendering in isolated TEST ONLY fixtures, theme/system/reduced motion, live EN→HI→EN and persistence, route refresh/history, trailing-slash real-mode boundary and no page overflow.

The existing regression runner now accepts Phase 3/auth-hardening as additional suites solely to redirect artifacts safely. No prior phase test assertion is weakened or deleted. Original fourteen-suite `regressions/summary.json` retains the first Phase25 failure. `final-verification-summary.json` records the successful unchanged-suite retry and each final result.

## Investigated failures and refinements

1. First new browser assertion counted a Recharts responsive mark before layout had completed. It now waits for the actual mark before verifying that the regional series has exactly one point.
2. The NCS browser assertion initially assumed Western grouping. It now compares the real API value through the established `Intl.NumberFormat('en-IN')` formatting; no commas or observations were changed. The second attempt log is retained.
3. Historical Phase25 waits for `.real-section-heading`. The new page initially omitted that shared hook. It was restored to the actual section header, preserving the entire existing suite. Original failure log is retained; the retry passed its 220-capture matrix.
4. Visual review found the old real-mode "Scenario preview" shell title and narrow seven-control desktop row. The actual historical-readiness title now appears, with four-column desktop/two-column tablet/mobile filters.
5. Single-horizon model intervals use explicit error marks in addition to the range area/dashed output, since a single forecast point cannot form a filled band. The separate forecast table remains the numeric fallback. These visuals are tested only with a clearly labelled isolated fixture, not production predictions.
6. Normalized trailing-slash route identity prevents `/forecast/` from rendering development legacy content by default; supply/gap sample exclusions also preserve their gate for trailing slashes. Existing route assertions remain intact.

## Screenshot matrix / visual inspection

New real-mode page captures: 1440, 1280, 1024, 768, 390 × dark/light × en-IN/hi-IN = **20**. Two additional captures: API error and **TEST ONLY model output**. Exact names and assertions: `verification/browser/results.json`. `verification/screenshot-manifest.json` separates real captures from the isolated fixture.

Representative desktop, 1280, 1024, tablet 768 and mobile 390 views in both themes/languages were opened and visually inspected, as were error/model marks. Reviewed hierarchy, readable source/period/units, table containment, filter wrapping, Hindi line lengths, narrow navigation, neutral contrast and no accidental page overflow. The card/section design remains flat and restrained. Shared EvidencePanel restores focus on Escape; timeline/selects provide equivalent keyboard access to every actual observation. Charts have named groups and accessible structured tables, explicit observed/model labels, no color-only status, no decorative animation. Reduced-motion tests pass. This is not accessibility certification.

Regression screenshots remain under `verification/regressions/`; previous phase artifacts are not overwritten. Those include the unchanged gap experience, authentication and public pages. Only representative captures were manually inspected; automated overflow assertions cover every requested Phase 4 matrix combination.

## Performance and data safety

No dependency added. Source publications unchanged byte-for-byte: base `c85d2e9e26d103803d2419b7f2f95110130a3063636cceaf03c5d81211841eae`; demand `16458f1b959fa7621655333de6faa381edb31564c54e32d8171149a5a0c41e45`; supply `877493d40bad13ddaea80eb2b0e7851c9bebe2dbcf0a7386f7701b9d9ad99b86d4`. Before/after files are saved. Derived/model data is not published as canonical observations. No gap calculation or quality quarantine is bypassed.

Indexed dimension filtering and small version-keyed LRU caches reuse the existing authenticated readers. The frontend loads only bounded matching series plus compact coverage options, aborts obsolete requests, caches coverage across filter changes and splits forecast rendering into its own lazy chunk. Forecast feature approximately 43 kB / 13 kB gzip; real-intelligence chunk approximately 423 kB / 118 kB gzip. Main approximately 558 kB / 153 kB gzip versus baseline 547 / 150; the existing >500 kB advisory remains visible. Exact final sizes are in the build log. No WebGL/GPU/heavy model package was added.

Only `.env.example` files are tracked. No environment/config secret, token, private resume/account record or new auth endpoint is introduced. Backend synthetic fixtures and intercepted model-ready browser data exist only in test code. Current production forecast collections are empty.

## Commands

From backend (existing Python runtime, test process Google/GitHub config empty):

```powershell
python -m compileall -q src tests
python -m unittest discover -s tests -v
python -m unittest discover -s tests -p test_trends.py -v
python -m src.trends.audit ../docs/phase-4/verification
```

From frontend (`PYTHON` points to the installed Python313 runtime):

```powershell
npm run build
npm run lint
node tests/run-auth-regressions.cjs
node tests/run-auth-regressions.cjs --one phase25
node tests/run-auth-regressions.cjs --one phase3
node tests/run-auth-regressions.cjs --one auth-hardening
node tests/phase4.browser.cjs
```

`KAUSHALIQ_REGRESSION_OUTPUT` targets Phase4/verification/regressions. No dependency changed, so npm install was unnecessary for this phase. Git status/diff are saved separately, with the unrelated homepage line-height edit identified rather than discarded. No commit/push/reset was executed.
