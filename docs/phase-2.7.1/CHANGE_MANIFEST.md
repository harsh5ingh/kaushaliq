# Phase 2.7.1 changed-file manifest

Relative paths inside D:/SIH part 2/KaushalIQ. Earlier uncommitted Phase2.7 documents/artifacts are preserved and are not included as new implementation changes here.

Added backend:
- backend/src/accounts/diagnostics.py
- backend/src/accounts/demo.py
- backend/src/scripts/__init__.py
- backend/src/scripts/seed_demo_account.py
- backend/src/scripts/check_email_provider.py
- backend/tests/test_auth_verification.py

Modified backend:
- backend/src/accounts/providers.py — structured safe results, official requests, bounded parsing.
- backend/src/accounts/otp.py — lifecycle diagnostics, strict accepted-result check, persisted safe failure, distinct expiry/limit reason.
- backend/src/accounts/store.py — additive is_demo and delivery_error columns.
- backend/src/accounts/verification.py — provider error/reload contract and safe OTP failure categories.
- backend/src/config.py — consumed demo settings, default disabled.
- backend/src/routes/auth.py — demo guard at login/session issuance/session lookup.
- backend/src/routes/accounts.py — safe email-change provider error category.
- backend/src/main.py — sensitive account validation response sanitization.
- backend/.env.example — safe Resend sender/default and disabled demo placeholders.
- backend/tests/provider_server.py — test DI returns structured accepted result.
- backend/tests/test_accounts.py — existing capture fixture returns structured accepted result.

Modified frontend:
- frontend/src/app/i18n/locales/personal.ts — English/Hindi provider/network/expiry/attempt messages.
- frontend/src/features/account/contracts.ts — optional safe verification error/status metadata.
- frontend/src/features/account/api.ts — safe error mapping/network state.
- frontend/src/pages/VerifyEmailPage.tsx — loading/failure/reload/already-verified UX, preserved visual design.
- frontend/tests/test-stack.cjs — isolated demo flags and explicit test-only seed.
- frontend/tests/phase27.browser.cjs — clear invalid-code input before its screenshot; original assertions remain.

Added frontend tests:
- frontend/tests/phase271.browser.cjs
- frontend/tests/verify-local-demo.cjs

Added docs:
- docs/phase-2.7.1/PHASE_2_7_1_IMPLEMENTATION.md
- docs/phase-2.7.1/RESEND_VERIFICATION.md
- docs/phase-2.7.1/DEMO_ACCOUNT.md
- docs/phase-2.7.1/SECURITY_AUDIT.md
- docs/phase-2.7.1/VERIFICATION.md
- docs/phase-2.7.1/CHANGE_MANIFEST.md
- docs/phase-2.7.1/verification/ — sanitized results, backend log, Git snapshots and ten screenshots.

Local ignored runtime changes: backend/.env explicitly enables synthetic demo and holds a generated password; existing email secret unchanged. Existing auth SQLite receives additive schema, seeded demo/profile/follow/query and actual sessions. These private files are not tracked or copied into reports. No canonical data/ingestion, public pages, design tokens, theme/locale provider, logos, dependency versions or unrelated product feature was changed. Existing browser suites regenerate their established result/screenshot artifacts; earlier report source documents are intact.
