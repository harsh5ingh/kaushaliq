# Phase 2.7 audit — revised email OTP scope

Audit completed before application edits. Read Phase2.3/2.3.1/2.4 implementation reports, Phase2.5 architecture/dictionary/provenance/quality/coverage/implementation/manifest and Phase2.6 audit/system/spatial/implementation/verification/manifest/results. Inspected routes, AppShell/Header/PublicNavbar, AuthForm/Field/Page/Provider/context, theme/locale providers/resources, API client, canonical contracts/repository, database/settings, browser fixtures and backend tests. Broad pre-existing uncommitted work is preserved; no history reset or logo modification.

## Existing state and actions

- Auth: bcrypt cost12; 8h signed HttpOnly cookie; SQLite tracked JTI; exact-Origin signed double-submit CSRF; hashed-IP/email rate limiting; actual logout revocation. Preserve these. Existing signup grants a session without email verification: replace with pending verification. No configured OAuth, SMS or email integration was found; do not manufacture delivery.
- Database: users, sessions and auth_attempts only. Extend existing user foreign keys with private profile sections, resume metadata, watchlists, saved configurations, OTP and pending-flow records. Do not change the canonical public data store.
- Profile: name/email/provider read-only. Settings: local appearance/language, pending security copy. Help: actual documentation/contact links. Extend section editing and session/password management; preserve providers and theme architecture.
- Routes: every intelligence view currently inside AuthGuard. Move verified knowledge routes outside the guard; guard personal routes only. Retain safe return paths and public data API access.
- Data: immutable verified snapshot (1341 PLFS, 287 PMKVY, 332 partial NIC, 37 geography references), no skills/occupation catalog or GIS. Watchlists can use actual region/NIC IDs only. User skills are self-reported text, not a new public taxonomy.
- Visualization: contextual observed charts/evidence, honest unavailable states; legacy simulation DEV-only. Keep unchanged. No private values may alter public observations.
- Security gaps: unverified signup, basic password policy, no private profile/files/session-management/OTP. Add bounded validated ownership APIs, OTP HMAC at rest, attempt limits/cooldown/expiry, one-use atomic consumption, private validated resume storage and explicit confirmation.
- Localization: centralized typed English/Hindi resources; live persistent switching. Extend resources, not language conditionals. Theme/system/cross-tab/storage fallback untouched.
- Tests: eight browser suites and ten canonical backend tests; existing fixtures assume instant signup/protected intelligence/old password policy. Adapt only these deliberately changed policies; test-only delivery dependency injection must not become production configuration.

## Implementation sequence

1. Preserve baseline build/lint/backend/browser evidence. 2. Add migrations and provider/OTP boundaries. 3. Upgrade password and verified account/session flow. 4. Private account APIs/resume/preferences/watchlists/saved queries. 5. Public/private routing, OTP UI and optional onboarding/profile/settings/personal entry. 6. Bilingual responsive/accessibility pass. 7. Security, regression and screenshot verification; record exact unavailable integrations.

Baseline build/lint, ten canonical backend tests and all eight existing browser suites passed before implementation. Final verification includes those regressions plus account/security coverage. Initial audit found no enabled delivery integration; final local configuration inspection found Resend settings, with no verified live delivery. Tests now explicitly isolate local email/SMS settings; see OTP_ARCHITECTURE.md and VERIFICATION.md for the earlier absent-provider test issue. No local credentials were added or edited by this task.

