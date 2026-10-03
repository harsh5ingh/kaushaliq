# Phase 2.7 verification

## Executed checks

- `npm install`: passed; existing dependency graph retained, zero vulnerabilities reported by this install.
- `npm run build`: passed, including strict TypeScript compilation.
- `npm run lint`: passed.
- Backend unittest discovery: 29 tests passed (19 account/security groups and 10 existing canonical-data tests).
- Eight existing browser suites: 92 check groups passed, with no recorded browser errors: Phase1 (29), Phase1.5 (6), Phase2.2 preferences (11), localization (8), Phase2.4 (9), Phase2.3.1 (8), Phase2.5 (11), Phase2.6 (10).
- New `node tests/phase27.browser.cjs`: passed, 11 check groups, 100 matrix screenshots listed in results.json, two additional OTP captures, zero recorded errors; final process exit code 0.

Earlier browser assumptions were deliberately updated for the new policy: signup must prove email ownership, public intelligence is anonymous, and newly chosen passwords meet the stronger policy. Existing regression fixtures confirm real backend OTPs through a test-only capture adapter. The new suite performs signup and verification through the actual UI.

## Security and integrity coverage

Backend checks cover digest-only OTP storage, expiry, one-time use, wrong-attempt persistence, resend replacement/cooldown, failed delivery invalidation, duplicate-email generic responses, configured-provider payloads without external requests, optional SMS flow, email changes, strong passwords/bcrypt, session revocation/expiry, CSRF/Origin, explicit owner isolation/IDOR, validated canonical references, private file access, PDF/DOCX bounds and deletion/replacement. Concurrent rate-budget verification permits exactly eight of twenty parallel attempts under the tested budget.

Resume confirmation and provenance updates execute within the same write transaction as current resume/section reads. Regression cases cover stale resume identifiers, invalid provenance, case-folded skill deduplication, preservation of existing experience when no experience candidate is selected, and cleanup of linked derived information on deletion. Scanned/blank PDF extraction is an honest unavailable state, not inferred content.

The new browser suite covers six-digit input, masked address, invalid OTP, resend countdown, pending-flow refresh, no session before verification, seven-step optional onboarding, profile persistence, candidate edit/confirm/download/delete, canonical watchlists, saved verified query reopening, password strength/change, session controls, unavailable providers, alert preferences, logout, mobile menus/Escape, reduced motion, and private UI invalidation after server revocation. Expired OTP and optional phone verification are exercised in backend tests; live email/SMS delivery and OAuth are not browser-tested.

## Screenshot matrix

Output: `verification/`. Five widths (1440, 1280, 1024, 768, 390), two themes (light/dark), two locales (en-IN/hi-IN), across OTP, profile, settings, My Intelligence and onboarding: 100 matrix screenshots. Two additional captures show invalid OTP and unconfigured-provider mobile UI. The results JSON enumerates the 100 matrix files; the two extra files are saved separately. Every matrix route checks document width against viewport width. No horizontal overflow was observed in these checks.

Manual inspection used representative renders across all five widths, both themes and both languages: profile-dark-en-IN-1440, profile-light-hi-IN-1280, settings-dark-hi-IN-390, settings-light-en-IN-1024, my-intelligence-light-en-IN-768, my-intelligence-dark-hi-IN-390, onboarding-dark-hi-IN-1024, otp-light-hi-IN-390 and otp-dark-en-IN-1440. Additional final captures inspected: settings-light-hi-IN-768, otp-unconfigured-mobile, otp-dark-hi-IN-1280, onboarding-light-en-IN-390 and profile-light-hi-IN-1024. Readable text, intact controls, translated interface labels and truthful provider states were confirmed. This is representative visual inspection, not a claim that every PNG received individual manual review or an accessibility certification.

Existing public/workspace coverage remains in the prior suites' conventional verification directories. No homepage/footer artwork was redesigned for this phase.

## Provider isolation and live status

Local Resend settings are present; their validity and successful live delivery were not verified. SMS is not configured. No credentials were added or changed by this task. An early absent-provider test inherited local email settings and failed its unavailable-state expectation; no verified session or successful external delivery assertion resulted. Test subprocesses now explicitly blank email/SMS settings, and test capture providers are injected only by the test launcher. Normal application startup has no test mailbox route (404 verified). No production fake-success adapter exists.

## Performance and repository safety

Latest build: initial JavaScript 473.76 kB / 133.23 kB gzip; real-intelligence chunk 381.16 kB / 109.60 kB gzip; CSS 102.42 kB / 18.98 kB gzip. Personal pages are lazy-loaded. No dependency/package version was added; no new heavy visualization assets. Official logos remain unchanged.

Canonical publication SHA-256 remains `c85d2e9e26d103803d2419b7f2f95110130a3063636cceaf03c5d81211841eae`. Public coverage stays 1,341 PLFS observations, 287 PMKVY counts, 332 partial NIC references and 37 geography references. No demand/skill-gap/forecast/GIS observations were invented.

`verification/git-status.txt` and `verification/git-diff-stat.txt` capture the current working tree. Repository tracking changed across the intentional interruptions; these snapshots are the final current delta, not a reconstruction of the start-of-phase delta. Git diff does not count untracked files; CHANGE_MANIFEST.md isolates this phase. No commit, push, reset or unrelated deletion was performed.

