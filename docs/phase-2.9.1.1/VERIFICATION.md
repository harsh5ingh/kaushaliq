# Phase 2.9.1.1 verification

## Results

- Baseline before source edits: 72 backend tests, frontend build and lint passed.
- Final backend: 87 tests passed, including 15 focused session/OAuth tests and all existing OTP, ownership, demo, ingestion, canonical-demand and training-supply tests. See `verification/backend-tests.txt`.
- Python compile checks and installed dependency consistency passed. See `verification/compile.txt` and `verification/pip-check.txt`.
- Frontend `npm install` completed without introducing frontend packages; npm reported zero vulnerabilities. Lint and TypeScript/Vite production build passed. See `verification/lint.txt` and `verification/build.txt`.
- All 14 historical browser suites have passing final executions: phase1, phase15, phase22, phase22-localization, phase231, phase24, phase25, phase26, phase27, phase271, phase28, phase29, phase291 and hero-countup.
- Seven new focused browser check groups passed with no uncaught browser exceptions. See `verification/results.json` and `verification/browser-final.log`.

The first historical Phase 2.2 run caught a mobile header height change while authentication resolved: the workspace label wrapped. The compact menu already contains workspace access; hiding its duplicate header link below 960px corrected the real layout problem. The suite was rerun with unchanged assertions and passed. Original failed results/logs remain; `verification/regressions/final-summary.json` records the successful rerun and reason. Artifact destinations alone are redirected by the regression runner; old phase reports/screenshots are preserved.

## Focused browser checks

- Two normal demo logins in separate browsers establish sessions A and B. Keep-current revocation preserves A, rejects B on its next authenticated request, refreshes the list and succeeds again with no other active sessions.
- Signout-everywhere rejects all sessions, clears current frontend state/cookies, redirects with confirmation and still protects later private-route visits.
- Cancel/Escape/backdrop make no revocation request. Cancel receives initial focus; keyboard containment and opener restoration pass. Pending requests disable duplicate actions and cannot be dismissed ambiguously. A server failure leaves an error and does not fabricate success.
- Six dialog viewport checks cover five widths, both languages/themes, system color preference, reduced motion, dialog bounds and no page-wide overflow.
- Isolated Google and GitHub authorization navigation/callback fixtures exercise actual application routing, state/browser cookies, PKCE, identity mapping, normal tracked sessions, explicit linking and normal logout.
- Cancellation, invalid state, provider failure and missing verified primary email do not create sessions. Hindi/English safe callback error labels and mobile layout pass.

Backend tests additionally validate signature/issuer/audience/nonce/expiry/authorized-party checks against generated isolated Google RSA fixtures, GitHub verified private primary email, stable identity login, email-collision non-linking, recent-session linking and conflicts, state mismatch/replay/expiry, owner isolation, CSRF, expired/revoked sessions, concurrent revocation, Secure production flow cookies and callback-log redaction including encoded route paths. Test tokens/identities are not production data or credentials.

## Commands

From `frontend/`:

```text
npm install
npm run lint
npm run build
node tests/run-auth-regressions.cjs
node tests/run-auth-regressions.cjs --one phase22
node tests/auth-hardening.browser.cjs
```

From `backend/`, using the installed Python 3.13 interpreter:

```text
python -m compileall -q src tests
python -m unittest discover -s tests -v
python -m pip check
```

`cryptography` and its pinned transitive dependencies were installed for signed Google ID-token validation. A requirements dry run confirmed the UTF-8 file parses and retains the existing pins.

Browser harnesses use isolated temporary databases and test-only provider injection. They clear real provider credentials from the child environment, run headless Edge via Playwright, and stop their own servers. Normal runtime configuration cannot select a mock OAuth provider. No new live email was sent; prior manually verified Resend delivery remains an earlier-phase result.

## Screenshots inspected

Nine focused screenshots are in `verification/`:

- `session-confirmation-dark-en-IN-1440.png`
- `session-confirmation-light-hi-IN-1280.png`
- `session-confirmation-dark-hi-IN-1024.png`
- `session-confirmation-light-en-IN-768.png`
- `session-confirmation-dark-hi-IN-390.png`
- `session-confirmation-light-en-IN-390.png`
- `provider-controls-dark-en-1440.png`
- `connected-accounts-dark-en-1440.png` (complete connected-provider section)
- `oauth-error-light-hi-390.png`

The provider/linked-account screenshots use isolated test fixtures and do NOT demonstrate live Google/GitHub authentication. Manual visual inspection confirmed readable controls, intact provider icons, stable Hindi wrapping and dialog bounds. A stale auth-side provider caption and duplicated configured-provider notice were corrected. Historical suites also captured their existing public/workspace/hero/OTP/theme/localization matrices under `verification/regressions/`.

## Live verification and configuration

LIVE GOOGLE OAUTH: NOT VERIFIED.

LIVE GITHUB OAUTH: NOT VERIFIED.

Local credentials/callback URLs were absent in the configuration audit, and the user confirmed they are not configured yet. Provider consent, real identity retrieval and deployed callback registration cannot be claimed from mocks. Follow [OAUTH_CONFIGURATION.md](OAUTH_CONFIGURATION.md) once the local backend-only configuration is supplied and the backend restarted.

## Performance and Git checks

Final main JS is approximately 527.09 kB / 145.81 kB gzip; audited baseline was 517.99 / 143.62. Final CSS is 116.61 / 21.31. The pre-existing >500 kB chunk advisory remains. No frontend dependency or heavy visualization package was added.

No tracked real `.env` file was found; local `backend/.env` is ignored. No provider/session/OTP secret was printed or placed in frontend source, examples or reports. Full working-tree `git diff --check` still reports pre-existing EOF blank lines in two Phase 2.7 reports; those unrelated reports were not changed for this increment.

Full working-tree status/diff outputs are captured separately because they include broad prior-phase uncommitted changes, not only this increment. No commit, push, reset, history rewrite or unrelated file deletion was performed.

## Remaining limitations

Live provider configuration/consent verification is the blocking acceptance item. Facebook, unlinking, provider-only password enrollment/recovery, provider-global token revocation and deployment-specific cross-site cookie/reverse-proxy logging validation remain deferred. This report is not accessibility or security certification.
