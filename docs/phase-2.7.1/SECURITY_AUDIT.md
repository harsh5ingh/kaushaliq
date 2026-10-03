# Phase 2.7.1 security audit

Preserved: bcrypt-12 password hashes; normal strong password policy; exactly eight-hour JWT/HttpOnly tracked sessions; Secure cookies in production; SameSite; Origin-bound signed CSRF; session/JTI revocation; ownership predicates/IDOR protections; public verified intelligence without login. No session/token/password is stored in browser persistence. No data provider fallback or labour observation was introduced.

OTP remains cryptographic six-digit, HMAC hashed at rest, short-lived, attempt-limited, cooldown-reserved and one-use. Failed provider results invalidate the digest and cannot verify an account or create a session. Previous codes are replaced on resend. A safe error string is persisted for reload continuity, not a raw provider response. Correct delivery is distinguished from inbox receipt.

New hardening: account/auth validation responses no longer echo invalid request input (which might include passwords/OTPs). Provider results use allowlisted safe categories; bounded parsing and logger allowlisting prevent raw exceptions, bodies, headers, full addresses and secrets from reaching logs/UI. HTTP success without a valid response ID is not silently accepted. Arbitrary provider IDs are fingerprinted before logging.

Demo boundary: default disabled; seed is manual and strictly development+explicit flag; existing normal identities cannot be converted; persistent is_demo flag survives config/email/database changes. Login, session creation and existing-session lookup recheck the development guard. Production/staging/test refuse it. No privileged bypass endpoint and no automatically selected mock provider exist.

Tracked-file check found no occurrences of current local email/JWT/OAuth/SMS/demo secrets in tracked text files. Git tracks only backend/.env.example and frontend/.env.example; backend/.env is ignored/untracked. This check does not certify every historical commit or external secret store. No history was rewritten.

Tests cover disabled/non-development demo seed/login/session, explicit reset revocation, bcrypt hash versus plaintext, idempotence, normal-account collision, CSRF, owner isolation, OTP safe errors/reload, provider failure, diagnostics redaction, bounded accepted response IDs and sensitive-input validation. Existing OTP expiry/reuse/cooldown/attempt/replace and account IDOR suites remain included.

Production follow-up remains as Phase2.7 documented: live OAuth linking/recovery, delivery queue/retries, distributed abuse limits, deployment backup/access policy, antivirus/file worker controls. This is not a security certification. No new secrets entered source or .env.example; no commit/push occurred.
