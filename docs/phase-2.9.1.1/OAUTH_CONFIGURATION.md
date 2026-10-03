# Google and GitHub configuration

IMPLEMENTED: backend authorization-code adapters and callback routes, one-use browser-bound state, S256 PKCE, verified provider identity handling, explicit linking, and the existing eight-hour tracked session issuer.

NOT LIVE VERIFIED: Google and GitHub credentials/callbacks were absent in the local configuration audit. The user confirmed they are not configured yet. Automated tests use isolated dependency-injected provider fixtures; they are not evidence of real provider consent or login.

## Backend-only configuration

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL` in ignored `backend/.env`. No values are required or exposed in the frontend bundle. `backend/.env.example` contains blank placeholders and callback guidance.

For local development, use the same hostname for frontend and backend (all `localhost` or all `127.0.0.1`), configure `FRONTEND_URL` to the actual frontend origin, and `API_URL` to the actual API origin. Register these exact callback URLs with the corresponding provider:

- `http://localhost:8000/api/auth/oauth/google/callback`
- `http://localhost:8000/api/auth/oauth/github/callback`

Use the actual port if different. Production requires HTTPS callbacks, matching `API_URL`, and the existing secure-cookie environment policy. Use provider registrations that explicitly allow each deployed callback; do not broaden redirects to arbitrary hosts. Restart the backend after changing `.env`.

Missing configuration reports `NOT_CONFIGURED`; invalid callback configuration reports `CONFIGURATION_ERROR`. `CONFIGURED` means settings passed local validation, not that provider credentials are accepted or that live authentication was verified. No placeholder credentials or mock success are selected by normal runtime settings.

## Flow and identity policy

`POST /api/auth/oauth/{provider}/start` requires the existing signed CSRF challenge and allowed Origin. The response supplies the fixed official authorization URL. The callback exchanges the code server-side, verifies identity, and redirects only to an allowlisted local application route on configured `FRONTEND_URL`.

Google requests `openid email profile`. An RS256 ID token is validated against Google's fixed JWKS endpoint, issuer, audience, expiry, nonce, authorized party where required, and verified email. Stable `sub` identifies the provider account.

GitHub requests `user:email` and obtains `/user` plus `/user/emails`. A verified primary email is required; public profile email is not treated as verification. Stable numeric GitHub ID identifies the provider account. Both providers use S256 PKCE and one-time state.

An existing verified provider-subject link logs into its owner. A verified email collision with an existing local account does NOT automatically link. Sign in with the existing method, then use Settings → Connected accounts. Linking requires a recent authenticated session (10 minutes), a flow tied to its server-derived user/JTI, and revalidation of that session during callback. Conflicting links fail safely.

Provider-only accounts have no fabricated password. Password/contact-change controls disclose that a password is not configured. Password enrollment/recovery and provider unlinking remain separate work; Facebook is not activated.

## Manual acceptance still required

After configuration, use each normal provider button and complete consent yourself. Verify the intended redirect, account identity, real session list, normal logout, keep-current revocation and signout-everywhere. Report outcomes only. Never paste credentials, OTPs or tokens into chat, screenshots or reports.

## Official references

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [GitHub authorization-code and PKCE flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub verified email endpoints](https://docs.github.com/en/rest/users/emails)
- [Google button branding](https://developers.google.com/identity/branding-guidelines)

Production deployment must also configure external reverse-proxy/CDN access logs to omit callback query parameters. The application redacts its Uvicorn OAuth access logs and sets no-store/no-referrer response policy, but cannot control a separately deployed proxy's logs.
