# Phase 2.3.1 — Authentication, Workspace Shell & Account UX

## Audit alignment

This work extends the audited repository state rather than replacing it. Phase 2.2 theme and language providers, Phase 2.3 public pages/navigation/footer, and the Phase 2.4 shared deterministic simulated-data model and intelligence views were preserved. Existing public routes and workspace route content remain in place. The prior sidebar component was not deleted, but it is no longer the primary authenticated navigation; the workspace uses a responsive top application bar and a mobile drawer.

Newly implemented in this continuation: backend email registration/sign-in/session/logout, protected workspace and account routes, account menu and pages, a responsive authentication page/modal, provider availability reporting, and regression/browser coverage for those flows. The shared data source remains `frontend/src/data/labourMarket.ts` with derived views in `frontend/src/analytics/simulatedLabourMarket.ts`; no competing dataset was added.

## Authentication implementation

- FastAPI endpoints are under `/api/auth`: CSRF challenge, provider availability, registration, login, current session/account, and logout.
- Registration enforces a minimum eight-character password containing a letter and number (up to bcrypt’s 72-byte input limit), then stores only a bcrypt cost-12 hash in SQLite. Login compares against the stored hash and uses a generic failure message.
- A short-lived CSRF cookie/token pair and exact configured `Origin` validation protect state-changing requests. Login attempts are rate-limited using hashed IP/email keys.
- The session JWT contains only subject, JTI, issued-at, and expiry. The configured session TTL is fixed to exactly `8h`; JTI is also recorded server-side so logout revokes the active session.
- The JWT is sent only as an HttpOnly cookie (`Secure` in production, configurable SameSite; production cookie uses the `__Host-` prefix). The browser stores account display state and CSRF value in memory only; credentials and JWTs are not persisted in local/session storage.
- `AuthProvider` initializes from the backend, protects workspace/account routes, redirects expired sessions with an explanation, handles safe return paths, and clears state after logout without requiring a reload.
- Sign-up validates password strength and confirmation; provider controls use recognizable Google/GitHub/Facebook icons but remain disabled with an explicit unavailable state. No fake provider login occurs.
- Forgot-password/reset remains an honest placeholder because no email delivery/recovery backend exists.

## Configuration and provider readiness

Backend-only configuration is documented in `backend/.env.example`: session TTL, JWT secret, auth SQLite path, cookie policy, API/frontend URLs, and OAuth client/callback placeholders. OAuth values are not sufficient to activate sign-in: authorization/callback endpoints, state/PKCE handling, account linking and provider verification have not been implemented. `frontend/.env.example` contains public client configuration/social URLs only; no backend secret is exposed through `VITE_*`.

## Workspace shell and account UX

- The former sidebar-first shell now has a consistent top workspace navbar. Overview, Skills, Regions, Occupations, and Industries remain primary on wide screens; Demand, Forecast, 3D Intelligence, and Reports are grouped under More. Smaller screens use a menu drawer that keeps every module reachable.
- Search, theme, language, account avatar, active-route state, keyboard/Escape dismissal, outside-click dismissal and focus restoration are retained or added. Profile, Settings and Help routes are protected and use the same shell.
- Successful sign-in replaces public account actions with workspace access and an account avatar/menu. Sign-out calls the backend revocation endpoint before returning to the public site.
- Auth modal has a fixed accessible header and one bounded SimpleBar region. SimpleBar is not applied to the document body. Small-screen auth becomes a full-height sheet with safe-area padding.
- Workspace displays an explicit simulated-data disclosure. Existing values remain illustrative and are not presented as verified Indian labour-market statistics.

## Localization and theme

All new account, validation, session, provider, workspace-navigation and account-page strings were added to the centralized English and Hindi resources. Switching remains live and preference persistence remains owned by the existing localization provider. Existing Light/Dark/System theme preference and persistence remain owned by the existing theme provider. No new theme/localization provider was introduced.

## Changed files

The implementation adds `backend/src/routes/auth.py`, `frontend/src/app/providers/AuthProvider.tsx`, `frontend/src/app/providers/authContext.ts`, `frontend/src/components/auth/AuthExperience.tsx`, `frontend/src/components/layout/AccountPages.tsx`, `frontend/src/pages/AuthPage.tsx`, `frontend/src/styles/phase231.css`, browser test helpers/suite, and this report. It extends existing backend configuration/router/requirements, frontend routes/shell/header/public navbar/auth form/dialog/auth field/locales/styles/package scripts, `.env.example`, and `.gitignore`. Exact repository-wide status includes prior phase work; see `git status --short` rather than interpreting its full diff as belonging only to this phase.

## Verification

Executed during implementation:

- Frontend production build and lint: passed.
- Backend Python compile/import check: passed.
- Phase 2.3.1 browser suite: passed registration, validation/mismatch, bcrypt persistence, cookie flags, protected routes, account menu and focus/Escape behavior, preferences, 5 viewport widths, expiry, logout revocation, reset placeholder, and modal scroll behavior.
- Existing Phase 1, Phase 1.5, Phase 2.2, Phase 2.2 localization, and Phase 2.4 browser suites were adapted to authenticate against an isolated test backend and passed.
- Screenshots were captured under `docs/phase-2.3.1-verification/`. The final visual pass identified and fixed desktop translated-navbar crowding by making workspace search/preferences compact while retaining their accessible names.

Re-run commands before handoff: `npm install`, `npm run build`, `npm run lint`, `npm run check:browser:phase231`, and the existing phase browser scripts.

## Known limitations and security follow-up

- OAuth is not implemented or configured. Provider buttons are intentionally unavailable.
- Password reset, email verification, MFA, account recovery, session refresh, and session-management UI are not implemented.
- SQLite is appropriate for this local prototype/single-node path but is not the final multi-instance production persistence choice. No data-platform/database architecture was introduced for labour-market records.
- The session is server-revocable through SQLite JTI records, but deployment still needs operational retention/cleanup, database backup/migration policy, production threat review, HTTPS/reverse-proxy validation, and security testing before public production use.
- Backend credentials must be supplied through a protected backend environment. The development-only JWT fallback is not suitable for deployment.
- Existing large visualization chunks remain a bundle-size advisory; this work adds no chart or 3D library.
- Real labour-market sources, verified analytics, forecasting/ML, GIS data, and the future assistant remain outside this phase. Phase 2.4 simulated views are preserved as simulated.
