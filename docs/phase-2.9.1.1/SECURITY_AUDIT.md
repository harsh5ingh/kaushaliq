# Incremental authentication security audit

This is an implementation review and automated verification record, not a security certification.

## Preserved

- Existing bcrypt password policy/hash verification, verified-email OTP lifecycle, private account ownership checks and demo restrictions.
- Exactly eight-hour JWTs in HttpOnly cookies. SQLite JTI/owner/expiry/revocation validation remains mandatory for every authenticated request. No JWT or provider token is stored in localStorage.
- Signed double-submit CSRF and configured frontend Origin on mutations. Existing credentialed CORS allows only `FRONTEND_URL`.
- Secure cookies in production, __Host session/flow cookie names, explicit SameSite policy, no-store private responses, public anonymous verified intelligence.

## Session operations

Both revocation operations derive user/JTI from the authenticated request. `BEGIN IMMEDIATE` serializes the update and revalidates the current session under the write lock. Only active, unexpired owner sessions are updated. Keeping current excludes its JTI; signing out everywhere includes it and clears session/CSRF cookies. No operation revives expired or revoked records. Another account is unaffected. Concurrent keep-current calls and repeated calls are safe.

The confirmation uses native dialog semantics, labelled description, initial Cancel focus, containment/restoration, Escape and backdrop cancellation. Revocation is an explicit button action. Pending actions cannot be duplicated or cancelled while their server outcome is outstanding. Errors do not clear authentication or claim success. A successful mutation with a failed list reload has a distinct refresh warning.

## OAuth protections

- Cryptographic state, browser binding, nonce and PKCE. State/browser tokens are SHA-256 digests in the database; transient verifier/nonce are erased on one-time consumption and expired flows are purged on start.
- Browser binding uses a short-lived HttpOnly cookie, Secure in production and SameSite=Lax for provider top-level returns. Flows expire after ten minutes. Mismatched, expired, reused or duplicate state/code parameters fail.
- Fixed provider/JWKS URLs, HTTPS provider requests, bounded response size/timeouts, and no HTTP redirect forwarding of server credentials.
- Google signature/issuer/audience/expiry/nonce/verified-email checks; GitHub verified primary email retrieval. Provider-subject identity determines ownership, not an email guess.
- Email-match automatic linking is forbidden. Explicit linking requires recent authentication and a live matching owner/session during callback. Existing identity ownership conflicts are rejected.
- Return destinations are known application paths and redirects use only configured frontend origin. No arbitrary frontend user/session identifier controls linkage.
- No provider access/refresh token, authorization code, client secret, plaintext password or OTP is persisted in user/session tables or returned to frontend. OAuth users with no password have password authentication disabled; generic password failures retain dummy-hash work.
- Callback failures expose only allowlisted localized categories. Uvicorn access-log query redaction prevents callback code/state logging. External proxy logging requires deployment configuration.

## Configuration checks and limits

Local `.env` is ignored by Git. Provider settings remain backend-only. `.env.example` contains no real credentials. SameSite=None is rejected with the non-Secure development cookie strategy. Production callback HTTPS and API-origin matching are validated. Cookies and CSRF must be deployed on a compatible site/origin topology; independently hosted cross-site domains need deliberate browser-cookie deployment testing.

Added backend dependency `cryptography==50.0.2` supports RSA/JWKS validation through existing PyJWT. Its pinned transitive requirements are cffi and pycparser. No frontend package was added. Existing requirement pins were preserved while normalizing the mixed-encoding file to UTF-8.

Tests cover owner isolation, current-session retention, all-session revocation, concurrency/idempotency, expired/revoked credentials, CSRF, browser-bound state/replay/expiry, cancellation/provider failures, Google signed-token validation, GitHub private/missing/unverified email, safe linking/conflicts, normal session lifetime/logout and safe access logging.

Live provider credentials/consent are NOT verified. Facebook, provider unlinking, password enrollment/recovery, provider-side token revocation and broader production deployment hardening are outside this increment. Provider tokens are not retained, so signing out revokes the KaushalIQ session rather than claiming to revoke a provider's global login.
