# Phase 5.1 — connected-account and OAuth contract reconciliation

## Audit and architectural decision

The saved working tree differed from the pasted approximation: `accounts.py` already returned HTTP 503 (`oauth_account_linking_unavailable`) for connected-account POST. Its existing DELETE also returned 503. The baseline focused suite therefore reproduced **two OAuth failures and 32 passes**, rather than the originally reported single account-test failure.

There was no separate OAuth link route. Both the OAuth test helper and Settings still initiated linking through the now-unavailable connected-account mutation route. Earlier Phase 2.9.1.1 documentation described that original route. The current requested contract deliberately separates direct account mutations from a provider-consent flow; this is a route migration, not a relaxation of the linking tests.

Implemented the smallest boundary that preserves explicit linking:

- `GET /api/v1/me/connected-accounts` continues reporting actual database links and provider configuration availability.
- Its POST/DELETE mutation routes remain unavailable, even when Google/GitHub are configured. Their inherited implementation was preserved without editing `accounts.py`.
- New `POST /api/auth/oauth/{provider}/link` requires the existing authenticated session, Origin/CSRF validation and account-scoped rate limit. It derives user and current JTI from the request's authenticated session, validates the provider, then calls the unchanged `oauth.begin_flow` with a fixed `/settings` return target. Client-supplied identity/session/redirect fields cannot select the owner or destination.
- Settings now calls that explicit OAuth route. Normal `/start` and `/callback` behavior is unchanged.
- Existing linking tests now address the explicit route, retaining their successful-link, collision, recent-login, expired-session and ownership assertions. A new independent boundary test proves that configured providers cannot enable direct mutations, and starting consent creates no fake identity link.

## Session recovery discovered during browser verification

The moved link route must retain the old private-endpoint behavior on HTTP 401. The account client now dispatches the existing session-invalid event for the two authenticated OAuth link paths as well as `/v1/me`.

A new browser check revoked the session server-side while Settings remained open. Authentication cleared correctly, but the shared provider retained its cached CSRF token after logout had removed the cookie. This prevented immediate re-sign-in. The session-invalid handler now also clears that cached token; existing sign-in code obtains a fresh server challenge. The browser test verifies reauthentication without refresh and restoration of the intended Settings destination. No CSRF check was weakened.

## Test-quality correction

Renamed the module-level `test_sources()` helper in `test_scenarios.py` to `fixture_sources()` and updated its callers. It is fixture construction, not a test. This removes accidental pytest collection and the return-not-none warning without changing scenario production behavior. A genuine new auth boundary test replaces that accidental collected item; the actual full suite passes 175 tests.

## Preserved security and data boundaries

Core `backend/src/accounts/oauth.py`, `accounts.py` and `test_accounts.py` have identical hashes before/after this phase. State hashing, browser binding, one-use consumption, PKCE, Google signature/issuer/nonce validation, GitHub verified primary email, safe linking and the existing eight-hour tracked sessions remain in that service.

No provider credentials, environment configuration, sessions schema, ingestion pipeline, intelligence calculation, canonical observation or dependency was changed. All six canonical publication/manifest files retain their exact byte hashes. Local `.env` files are ignored and no local `.env` is tracked. Only example environment filenames appeared in the tracked-file check. New runtime code contains no credentials or token logging; isolated provider fixtures remain test-only.

## Limitations and next step

This phase verifies OAuth through isolated provider fixtures, not fresh live Google/GitHub consent. Previous user-reported live verification is not re-certified here. Provider unlinking/direct connected-account mutation remains unavailable by the requested contract. External consumers of the old mutation-as-link route must migrate to `/api/auth/oauth/{provider}/link`.

The production build still reports its existing >500 kB chunk advisory. No dependency or bundle architecture change was made to suppress it. Skill gaps, forecasts and Skill Shock readiness remain governed by the existing verified-data gates. No Phase 6, commit, push, reset or history rewrite was performed.

Recommended next step: manually smoke-test the new Settings link route using the configured live providers, without sharing authorization codes, tokens or secrets. Consider any future direct mutation/unlink capability as a separate security-reviewed contract.
