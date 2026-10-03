# Authentication/session audit and implementation plan

Read current Phase 2.3.1, 2.7, 2.7.1 security/implementation/verification documentation, Phase 2.9.1/count-up reports and current auth/account routes, SQLite/session validation, config, providers, frontend auth/settings/modal/loading components, bilingual resources and browser/backend harnesses before editing source. Earlier uncommitted work is preserved.

Baseline: full backend suite 72 tests PASS; frontend build and lint PASS. Public labour intelligence and canonical data stay unchanged.

## Findings

- One existing session architecture: exactly 8-hour JWT in HttpOnly cookie, with SQLite JTI/owner/expiry/revocation validation on every authenticated request. Signed Origin-bound CSRF protects mutations. OTP verification uses this same session issuer.
- Existing `/api/v1/me/sessions/revoke-others` already has an owner/exclude-current SQL predicate. It needs explicit transactional revalidation, active-only semantics, returned outcome, confirmation and visible success/error/pending UX. Add an all-session operation to the same API/store rather than another session architecture.
- Google/GitHub/Facebook are disabled in `/api/auth/providers`; no OAuth callback/state/identity implementation exists. OAuth placeholders in `.env.example` are ignored by current Settings because fields are absent. Connected-account routes are honest 503 placeholders.
- Local process/backend `.env` audit found Google/GitHub client IDs, secrets and callback URLs absent. No secret values were printed. Live verification needs actual provider configuration; placeholders are not proof of integration.
- Reuse native `Modal`, buttons, loading/skeleton primitives, AuthProvider, centralized locale resources and private account APIs. Keep the completed homepage/hero/count-up and dataset/provenance methodology.

## Plan

1. Atomic current-session revalidation and owner-scoped revoke-other/revoke-all; accessible confirmation, disabled/pending feedback, refreshed list and explicit auth-state clearing after all-session signout.
2. Add typed backend-only provider configuration, persistent one-use browser-bound state/nonce/PKCE flows and stable provider-subject identities. Google signature/issuer/audience/nonce/email verification; GitHub private verified-primary-email lookup. No email-match automatic linking.
3. Use existing session issuer for social login. Explicit connected-account linking requires a recent authenticated session and remains bound to that session through callback. Additive password-enabled/session-provider metadata prevents accidental password login for provider-only accounts.
4. Wire existing provider controls and connected-account UI, localized safe errors/feedback and shared bounded loading states. Providers remain honestly unavailable without valid configuration. Facebook stays deferred.
5. Mock providers only through isolated tests; retain normal OTP regressions. Multi-session/ownership/CSRF/replay/expiry/mapping/conflict/JWKS/scopes tests, browser modal/settings/provider/callback verification and representative responsive/theme/language screenshots.
6. Audit cookie/CORS/origin/redirect/logging/secrets, document configuration and exact verified versus blocked scope. No commit/push, no Phase 3, no labour-data change.
