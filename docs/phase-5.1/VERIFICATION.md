# Phase 5.1 verification

Verified on 4 October 2026 in the existing dirty `main` checkout. Local credentials were not changed or printed.

## Backend

- Baseline focused run: **32 passed, two failed, two subtests passed**. Both failures attempted explicit OAuth linking at the unavailable connected-account POST.
- Final focused run: **35 passed, four subtests passed**. `verification/backend-targeted.txt`.
- Full `pytest`: **175 passed**, with **no pytest warnings**. `verification/backend-tests.txt`.
- Python compilation, FastAPI import and OpenAPI checks passed. Registered contracts include OAuth start/link/callback and both existing connected-account mutation methods.
- All six canonical JSON publication/manifest hashes remain byte-identical; `verification/canonical-before.json` and `canonical-after.json`.
- Core OAuth implementation, inherited account route and account tests are unchanged; `verification/source-before.json` and `source-after.json`.

Commands from `backend` (the installed repository virtual environment contains pytest; bare `python` was not on the tool shell PATH):

```powershell
& ./.venv/Scripts/python.exe -m pytest tests/test_accounts.py tests/test_oauth_sessions.py -q
& ./.venv/Scripts/python.exe -m pytest
& ./.venv/Scripts/python.exe -m compileall -q src tests
```

The new boundary test runs configured Google/GitHub fixtures and checks unavailable direct mutations, anonymous rejection, CSRF/Origin rejection, unknown providers, server-derived owner/JTI, fixed safe destination, absence of identity insertion before consent and missing-configuration failure. Existing tests retain collision, identity takeover, recent login, callback-session expiry, browser/state binding, PKCE, verified provider identity, shared session, logout, revocation and owner-isolation checks.

## Frontend and browser

- `npm run build` passes, including TypeScript project checking. `verification/frontend-build.txt`.
- `npm run lint` passes. `verification/frontend-lint.txt`.
- Focused auth browser suite: **eight check groups passed**, zero uncaught errors, nine screenshots. Isolated provider fixtures only. `verification/auth-browser.txt` and `verification/regressions/auth-hardening/results.json`.
- Phase 5 browser suite: **14 check groups passed**, zero uncaught errors, 44 screenshots. It consumes the existing verified canonical intelligence and explicitly labelled scenario outputs. `verification/phase5-browser.txt` and `verification/phase5-browser/results.json`.
- All **17 existing browser regression suites passed**, including the updated auth suite: Phase 1, 1.5, 2.2, localization, 2.3.1, 2.4–2.9.1, hero count-up, Phase 3, Phase 4 and auth hardening. Results are recorded in `verification/regressions/summary.json` and `verification/regression-browser.txt`.

Commands from `frontend`, with `PYTHON` pointing to the backend virtual-environment executable and artifact-directory environment variables pointing under this phase:

```powershell
npm run build
npm run lint
node tests/run-auth-regressions.cjs --one auth-hardening
node tests/phase5.browser.cjs
node tests/run-auth-regressions.cjs
```

Screenshots cover 1440, 1280, 1024, 768 and 390 widths, light/dark, English/Hindi, reduced motion and overflow assertions. Representative connected-account dark desktop, OAuth-error Hindi light mobile, Early Warning dark desktop and scenario Hindi light mobile images were visually inspected. No design change was necessary. Full screenshot checksums and paths are in `verification/artifact-manifest.json`.

## Investigated failures

The first added API-request browser check omitted Origin and correctly received 403. The test request was corrected to include the existing required Origin; production CSRF validation was untouched.

Subsequent stale-session checks exposed a cached-CSRF recovery bug. The frontend cleared its user but retained the token after backend logout removed the cookie, so the next OAuth start failed. Clearing the cached token on session invalidation fixed reauthentication. The test checks return to Settings rather than a default Intelligence route because the existing route guard preserves the original destination. Failed attempt logs are retained separately; final auth results pass.

## Warnings, security and scope

The accidental returning helper was removed from pytest discovery by renaming it; no warning suppression was added. The build still emits the existing large-chunk advisory (>500 kB). No new dependencies were installed.

Plain scoped `git diff --check` passes for the edited tracked source files. Whole-tree whitespace validation also passes using `core.whitespace=cr-at-eol` to recognize the repository's inherited CRLF files. Local `.env` files are ignored and untracked; sensitive example-template values are empty. Relevant diffs contain no production credentials or token logging. No canonical values, fake mappings or runtime simulation fallback were introduced. Earlier phase documentation and unrelated work were preserved. No commit, push, reset, history rewrite or Phase 6 work was performed.

Live provider consent was not re-run in this phase. Automated OAuth verification is not presented as fresh live Google/GitHub verification. Direct account mutation/unlinking remains unavailable by the requested contract.
