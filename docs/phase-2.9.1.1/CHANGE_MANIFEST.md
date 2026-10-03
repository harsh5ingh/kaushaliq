# Changed-file manifest — Phase 2.9.1.1 increment

This lists this task's source/config/test changes only. Several modified files already contained earlier uncommitted work; that work was preserved. Repository-wide Git outputs include those earlier phases and are not an incremental manifest.

## Backend modified (7)

- `backend/.env.example` — backend-only Google/GitHub callback/configuration guidance; blank credentials.
- `backend/requirements.txt` — signed-token cryptography dependencies; original pins preserved, UTF-8 encoding normalized.
- `backend/src/config.py` — typed provider settings and SameSite/Secure validation.
- `backend/src/accounts/store.py` — additive provider identity/flow/session/password-enabled schema migration.
- `backend/src/main.py` — register OAuth routes in the existing app.
- `backend/src/routes/accounts.py` — atomic owner-scoped session operations and actual connected-account linking/availability.
- `backend/src/routes/auth.py` — same session issuer for providers, safe account metadata and provider-only password rejection.

## Backend added (5)

- `backend/src/accounts/oauth.py` — secured authorization-code services, verified identities, safe linking and callback-log redaction.
- `backend/src/accounts/sessions.py` — transactional current/owner revalidation and revocation.
- `backend/src/routes/oauth.py` — start/callback API routes with safe error redirects.
- `backend/tests/test_oauth_sessions.py` — 15 focused backend tests including multi-session, ownership, CSRF, OAuth and identity validation.
- `backend/tests/oauth_server.py` — isolated test-only provider fixture launcher; not runtime configuration.

## Frontend modified (14)

- `frontend/src/app/i18n/locales/en-IN.ts` — centralized auth/security resources and truthful auth-side copy.
- `frontend/src/app/i18n/locales/hi-IN.ts` — matching Hindi coverage.
- `frontend/src/app/providers/authContext.ts` — provider/password metadata and all-session signout contract/reason.
- `frontend/src/app/providers/AuthProvider.tsx` — shared CSRF bootstrap, all-session signout and correct logout/private-route redirects.
- `frontend/src/components/auth/AuthForm.tsx` — actual configured provider start flow, pending/error states and accurate availability copy.
- `frontend/src/components/ui/Modal.tsx` — optional accessible description association; existing behavior preserved.
- `frontend/src/components/ui/States.tsx` — shared decorative Loader alongside existing Skeleton.
- `frontend/src/features/account/SecuritySettings.tsx` — accessible session confirmation, refresh/pending/failure UX and provider-only password disclosure.
- `frontend/src/features/account/api.ts` — safe centralized OAuth error mapping.
- `frontend/src/pages/AuthPage.tsx` — localized callback/session-signout feedback.
- `frontend/src/pages/PersonalSettingsPage.tsx` — reuse real connected-account component in place of placeholder.
- `frontend/src/styles/personal.css` — token-based confirmation/provider/progress layout, responsive and reduced-motion styling.
- `frontend/src/styles/chrome.css` — stable compact authenticated public-header geometry; workspace access retained in menu.
- `frontend/tests/test-stack.cjs` — isolated OAuth fixture launcher selection for tests; real credentials cleared from test environments.

## Frontend added (6)

- `frontend/src/app/i18n/locales/auth-security.ts` — complete shared English/Hindi auth-security resources.
- `frontend/src/components/ui/Loader.tsx` — existing-icon decorative progress primitive; no dependency.
- `frontend/src/features/account/oauth.ts` — typed availability and allowlisted callback error categories.
- `frontend/src/features/account/ConnectedAccounts.tsx` — real availability/link state and provider connect actions.
- `frontend/tests/auth-hardening.browser.cjs` — session confirmation/revocation/provider callback/browser/accessibility/responsive verification.
- `frontend/tests/run-auth-regressions.cjs` — historical assertions unchanged; only artifact destinations redirected in memory.

## Documentation added

- `docs/phase-2.9.1.1/AUDIT.md`
- `docs/phase-2.9.1.1/PHASE_2_9_1_1_IMPLEMENTATION.md`
- `docs/phase-2.9.1.1/OAUTH_CONFIGURATION.md`
- `docs/phase-2.9.1.1/SECURITY_AUDIT.md`
- `docs/phase-2.9.1.1/VERIFICATION.md`
- `docs/phase-2.9.1.1/CHANGE_MANIFEST.md`
- `docs/phase-2.9.1.1/verification/` — backend/compile/dependency/build/lint/browser logs, nine inspected focused screenshots, historical suite artifacts and initial/final regression summaries, plus full Git review outputs.

## Intentionally untouched by this increment

Ignored local `.env` and secrets; frontend dependency manifests/lockfile; official logo PNGs; completed homepage hero/assets/count-up; public footer; theme/locale providers and storage contracts; data acquisition/normalization/canonical datasets/provenance; demand/supply readiness gates; OTP/email adapter/lifecycle; private resume storage; historical test assertion files; previous phase reports/artifacts.

No files were committed, pushed, staged, reset or discarded. No Phase 3 or new labour-market values were introduced.
