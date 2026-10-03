# Phase 2.7.1 implementation / pre-change audit

Read Phase 2.7 implementation, OTP/account/security architecture, verification and current auth/provider/OTP/database/frontend/test code. The existing bcrypt/8h HttpOnly/JTI/CSRF/owner isolation architecture is retained. Signup issues only a pending verification flow; public verified intelligence is anonymous. OTPs use cryptographic six-digit generation and HMAC storage with expiry/attempt/cooldown/one-use protections. Production has no test mailbox endpoint.

Findings: the existing HTTP adapter discards response identifiers and collapses all failures; no safe send/verify diagnostics are available. OTP UI supports masking/countdown/refresh/errors but does not distinguish expiry/exhaustion or precise safe provider errors. No demo seed/account marker exists. Existing tests inject providers only through test launchers. Prior Phase 2.7 report/screenshots remain uncommitted and are preserved.

Plan: (1) structured sanitized provider results/logs and bounded error parsing, (2) safe reload/error UI extensions, (3) additive demo marker with development+explicit-enable checks at seed/login/session creation/session lookup, (4) manual seed using normal bcrypt and canonical watch/query entries, (5) isolated unit/browser regressions, (6) optional live send only to the explicitly supplied owned inbox, keeping API acceptance separate from inbox receipt. No public diagnostic send endpoint, OTP disclosure, fake delivery, data/provider fallback or homepage redesign.

## Implemented

Central provider result classification and safe stage diagnostics; reload-persistent provider failures; bilingual expiry/attempt/network/error states; already-authenticated verification redirect that preserves confirmation-owned onboarding/return-to navigation; sanitized sensitive validation errors. Additive is_demo/delivery_error storage and manual idempotent seed. Demo identity is explicitly enabled only in local ignored config and rejects non-development/disabled login and active sessions. Existing bcrypt/8h/cookie/CSRF/ownership mechanisms are used unchanged.

Seeded context is synthetic self-reported user preference data only. The actual local profile, settings, onboarding, canonical watchlist and current verified saved query were verified using normal UI login and logout. No resume/labour observation/alert/forecast is seeded. Resend inbox delivery and successful OTP verification are user-confirmed; raw OTP/inbox/test address were never collected by the agent. See RESEND_VERIFICATION.md for acceptance versus delivery evidence.

Cooldown retries retain previously rejected delivery state rather than claiming success; unusual upstream error-name shapes remain safely classified.

API changes are additive: optional error_code/provider_status on pending verification responses; stable safe provider detail strings and verification_expired/verification_max_attempts. Existing state/cookie/CSRF/account shapes remain compatible. Invalid account payloads now return a generic detail rather than echoing submitted inputs. No public diagnostic send route exists; optional development CLI sends only when explicitly requested.

No new dependencies. See CHANGE_MANIFEST.md for exact source/config changes, DEMO_ACCOUNT.md for commands, SECURITY_AUDIT.md for restrictions and VERIFICATION.md for executed checks. Live Google/GitHub/SMS/WhatsApp, account recovery, real alerts/AI/demand acquisition and Phase2.8 are intentionally deferred. No commit/push/history rewrite.
