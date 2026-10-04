# Phase 5.1 change manifest

This list describes this turn's edits, separately from the extensive inherited dirty working tree.

## Source and test files edited

1. `backend/src/routes/oauth.py` — authenticated explicit OAuth linking endpoint; existing service reused.
2. `backend/tests/test_oauth_sessions.py` — migrate explicit-link requests and add independent route/security boundary coverage.
3. `backend/tests/test_scenarios.py` — rename the accidentally collected fixture helper and its calls. This file was already untracked Phase 5 work and was extended, not replaced.
4. `frontend/src/features/account/ConnectedAccounts.tsx` — Settings initiates explicit linking through the OAuth route.
5. `frontend/src/features/account/api.ts` — preserve session-invalid handling for the relocated authenticated link requests; retain tracked LF line endings.
6. `frontend/src/app/providers/AuthProvider.tsx` — discard the stale CSRF challenge when session invalidation clears authentication.
7. `frontend/tests/auth-hardening.browser.cjs` — preserve existing assertions; add configured direct-mutation rejection, explicit route request, revoked-session recovery and intended return-route checks.

## Documentation and verification added

- `docs/phase-5.1/IMPLEMENTATION.md`
- `docs/phase-5.1/VERIFICATION.md`
- `docs/phase-5.1/CHANGE_MANIFEST.md`
- `docs/phase-5.1/verification/` — command logs, before/after checksums, source manifest, browser results/screenshots and git inspection artifacts. `verification/artifact-manifest.json` lists the generated evidence files individually.

## Explicitly preserved

`backend/src/routes/accounts.py` already contained the requested unavailable POST before this turn and was not edited. Core OAuth and account tests are byte-identical to the turn baseline. Earlier phase reports, raw snapshots, canonical publications, package files, requirements and unrelated inherited edits were not overwritten. Test-driven dataset regeneration does not change canonical byte hashes.
