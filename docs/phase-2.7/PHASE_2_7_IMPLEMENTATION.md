# Phase 2.7 — Personal Intelligence & Account Experience

Implemented the revised email-OTP/optional-phone scope on the existing application. Public verified intelligence now remains accessible anonymously; verified accounts store private personal context. No labour observations, source registry, taxonomy, chart values, public homepage, footer, theme provider or localization provider were rewritten.

## Implemented

- Pending signup and unverified existing-account login; provider-backed email OTP adapters with honest absent/failure states, masked target, countdown, reload-safe verification and actual session issuance only after confirmation.
- Optional SMS phone OTP and verified email-change flows with current-password confirmation, private masking and other-session revocation.
- Optional persisted seven-step onboarding; editable education/interests/user skills/proficiency/experience/goals/geography and name; five-section optional completion indicator.
- Private local PDF/DOCX upload, isolated bounded extraction, editable/selectable candidate confirmation, authenticated download, replacement/deletion and origin cleanup.
- My Intelligence uses saved user context; persistent canonical region/NIC follows and saved verified analysis configurations/publication-version checks; alert category preferences without fabricated events.
- Strong bcrypt-backed password policy/live strength; actual current/other sessions and revocation controls.
- Existing top workspace navigation/account menu extended with My Intelligence; existing responsive brand switches to supplied K mark. Public navigation/knowledge remain available without authentication. Expired private sessions redirect; expired public sessions lose private state without hiding public data.
- Central typed English/Hindi resources, semantic neutral styling, mobile single-column forms and lazy personal routes.

## Database/API

See ACCOUNT_ARCHITECTURE.md for exact tables/routes. Migrations are additive to existing SQLite auth storage, separate from immutable canonical publication. Old accounts are not retroactively verified; they must complete OTP after a valid password login. No reset, commit or push occurred. Password hashes/OTP digests are never serialized to the UI.

## Configuration / integration status

Ready for configured delivery: Resend/Brevo email and Brevo transactional SMS adapters (official API references in OTP_ARCHITECTURE.md). Local Resend settings are now present; credential validity and successful real delivery are not verified. SMS is unconfigured. Automated tests deliberately isolate credentials and use test capture delivery. Public development works without delivery; pending users cannot bypass it.

Not implemented/enabled: Google/GitHub OAuth linking/callbacks, WhatsApp, password recovery, real alert dispatch, personalized recommendation/AI engine, real skill/occupation catalogues, production antivirus scanning/account lifecycle operations. Existing provider buttons remain unavailable; no fabricated connection or OAuth success is introduced.

## Audit alignment

Preserved earlier secure cookie/CSRF/JTI architecture; theme/System/cross-tab/storage fallback; live persistent English/Hindi; public routes/official artwork; Phase2.5 reproducible pipeline/publication/provenance and Phase2.6 observed visualizations/unavailable dimensions. Extended the existing account menu/AppShell/auth forms and data catalogue, not a competing navigation/data model. Newly implemented private profile/OTP/onboarding/resume/watchlist/query/session functionality.

Earlier tests assumed instant signup, protected public intelligence and weaker passwords. Their fixtures now perform actual backend OTP confirmation using test-only delivery injection; only those intentional policy assertions changed. Sample fixtures still explicitly select retained DEV-only simulation. New Phase2.7 suite tests the actual signup/verification UI without the shortcut fixture. Known data limitations stay unchanged: no real demand, skill gaps, forecasts, district indicators or authoritative GIS.

## Verification / manifest

Passed: npm install/build/lint, 29 backend tests, all eight existing browser suites (92 groups), and new Phase2.7 browser suite (11 groups, zero errors). Captured 102 screenshots across five widths, both themes and English/Hindi; representative screenshots manually reviewed. See VERIFICATION.md, verification/results.json and CHANGE_MANIFEST.md for exact execution, screenshots and changed files. No new dependency/package version was added. All account implementation lives inside D:/SIH part 2/KaushalIQ.

