# Phase 1.5 — Authentication boundary

## Current behavior
AuthLink writes login/signup/reset mode into URL query state. AuthDialog manages overlay history. AuthForm validates examples locally; no authentication endpoint, token, session or OAuth request exists. Credentials are never logged, persisted or transmitted by this application. Fields are cleared after a successful local check and on unmount. Native browser password-manager behavior is outside application storage control.

The checking state represents local field validation, not a server request. The completion state explicitly says no login/account/email occurred. Google and GitHub actions only explain that integration is unavailable.

## Future integration boundary
Keep route/overlay concerns in AuthDialog and field rendering in AuthField. Introduce an authentication service and session provider only when the backend exists. Replace the local-only submit handler with typed results from that service; never treat client validation as authorization. Keep secrets out of VITE_* configuration (all frontend variables are public).

The future server implementation must design and review:
- Password hashing with an appropriate adaptive password algorithm; never plaintext or reversible encryption.
- Session/JWT issuance, expiry, refresh rotation/reuse protection, timeout, logout and server-side invalidation.
- HttpOnly, Secure and appropriate SameSite cookies where suitable; explicit CSRF defenses when cookies authenticate requests, plus origin/CORS rules.
- Google/GitHub OAuth authorization-code flows with appropriate PKCE, state/nonce validation and exact registered redirect URI allowlists; no open redirects.
- Rate limits, login-attempt protection, enumeration-resistant responses and secure recovery flows.
- Key and secret rotation, access controls, audit events that exclude credentials, and deployment-specific threat review.

These are design requirements, not implemented protections. No session or authenticated authorization boundary currently exists.

## Verification
Use example credentials only. The Phase 1.5 browser test verifies invalid fields, matching passwords, local completion, cleared password inputs, no non-GET requests, no application storage writes, OAuth/recovery disclosures, modal focus, Escape, history and direct query URLs.

## Running checks
From frontend:
- npm install
- npm run build
- npm run lint
- npm run check:browser
- node tests/phase15.browser.cjs

Browser scripts use an existing Playwright installation via PLAYWRIGHT_MODULE, and default to installed Edge (BROWSER_CHANNEL can override). No test framework dependency was added. The workspace script also requires the existing backend virtual environment (KAUSHALIQ_PYTHON can override its path). Both scripts start isolated local servers and write evidence under docs/phase-1.5. Previous Phase 1 verification files remain intact.
