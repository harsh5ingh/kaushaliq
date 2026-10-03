# Account architecture

Public verified knowledge and private user context are separate. `/intelligence`, all existing capability routes and `/workspace` stay anonymous. `/profile`, `/settings`, `/help`, `/onboarding` and `/my-intelligence` require a verified account. Sign-in may restore a safe internal return route. Session expiry clears account state; it redirects private pages, without taking public intelligence away.

Existing FastAPI bcrypt/JWT/HttpOnly-cookie/CSRF/JTI architecture is extended, not replaced. Personal React pages are lazy-loaded inside the existing AppShell and canonical RealDataProvider. The provider, publication, evidence, ingestion and simulation/debug boundary are unchanged. Official logos are unchanged; workspace Brand now uses its existing compact mark on constrained screens.

## SQLite additions

Additive, idempotent migration in `backend/src/accounts/store.py` extends the existing authentication database: users gain `email_verified` (default false) and optional phone. New tables: `profile_sections`, `account_otps`, `verification_flows`, `resumes`, `watchlist`, `saved_analyses`. Owner foreign keys, section/follow uniqueness, timestamps and owner/expiry indexes are retained. Profiles use validated bounded JSON by section, allowing separate section updates without replacing the entire profile. No second public labour-data model or database is introduced.

Accounts from the earlier unverified release must prove email ownership on their next successful password login. They are not silently marked verified. Existing hash and user ID remain intact; old unverified sessions cannot access private endpoints. Keep a deployment backup and test migration before rollout. No destructive reset occurred.

## APIs

- Existing `/api/auth/register`, `/login`, `/session`, `/logout`, `/me`, `/csrf` are preserved with pending email verification added to registration/unverified login.
- GET `/api/auth/verification`; POST `/verification/resend`, `/verification/confirm`; GET `/verification/providers`.
- GET `/api/v1/me` or `/me/profile`; PATCH `/me/profile` (name).
- PUT `/me/sections/{education|interests|skills|experience|career|geography|onboarding|alerts}`.
- GET `/me/sessions`; POST `/me/sessions/revoke-others`; DELETE `/me/sessions/{id}`.
- POST `/me/change-password`, `/me/change-email`, `/me/verify-email`, `/me/change-phone`, `/me/verify-phone`.
- GET/POST/DELETE `/me/watchlist` (DELETE includes ID); GET/POST/DELETE `/me/reports` (DELETE includes ID).
- GET/POST/DELETE `/me/resume`; GET `/me/resume/download`; POST `/me/resume/confirm`.
- GET `/me/connected-accounts`; POST/DELETE provider endpoint return an honest unavailable state.

Private/auth responses use `Cache-Control: no-store` and `nosniff`. Mutations require signed CSRF token and matching Origin. Ownership always comes from the authenticated session, never a supplied user ID. Bilingual error mapping and typed account contracts are centralized under `frontend/src/features/account/`.

OAuth linking/callbacks, password recovery, account deletion/export, delivery workers and external account verification remain future integration work. Public intelligence is usable when verification providers are absent.
