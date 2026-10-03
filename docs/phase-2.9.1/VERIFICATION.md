# Phase 2.9.1 verification

## Baseline

Current frontend strict build and oxlint passed before source edits. Relevant prior verification reports and current source contracts were inspected. Backend source is untouched, so no new backend suite is required for this hero-only change; existing browser stacks exercise the unchanged canonical APIs.

## Hero browser suite

Final result: **11 hero check groups PASS**, **132 existing regression check groups PASS across12 suites**;143 groups across13 suites in total. These are grouped browser checks, not143 isolated unit tests. Final `npm run build` and `npm run lint` both PASS. `verification/regression-summary.json`, `hero-final.txt`, `results.json`, `build.txt` and `lint.txt` retain the results.

`node tests/phase291.browser.cjs` uses the existing isolated FastAPI/Vite stack and real local canonical demand publication. Only negative-response tests use intercepted responses; no synthetic observations enter the application publication.

Checks include: theme-aware skeleton with no metrics; exact API-backed stock/count/date display; existing shared evidence/hash/keyboard containment/Escape/focus restoration; both CTA destinations and history; marquee pause; English-Hindi-English and refresh persistence;20 responsive/theme/language combinations; active local image load; System OS changes; reduced-motion static sources;503/network error/retry; unavailable observations; mixed publication rejection; evidence hash rejection; connected-source gating; absence of hardcoded production metrics/sample imports; no uncaught page errors; and a light mobile skeleton check.

Screenshot matrix:1440/1280/1024/768/390 × dark/light × English/Hindi. Additional captures cover desktop loading/evidence and mobile loading/error/unavailable. Full-page captures preserve the actual sticky navbar behavior. `hero-contact-sheet.jpg` and review crops are derived from those screenshots without changing rendered UI. Source images and screenshot crops were inspected with image tools.

Manual visual review covered the full20-image contact sheet and readable representatives at all five widths, both themes and languages. It found and corrected reduced-motion duplicate source visibility, strengthened copy/background separation, and changed screenshot capture to avoid a sticky header obscuring the top of tall element-only captures. Mobile content remains stacked, controls fit, numbers and caveats are legible, and no horizontal page overflow was detected. No accessibility certification, screen-reader session or alternative-browser certification is claimed.

## Existing regressions

All existing browser suites are executed:phase1,phase15,phase22,phase22-localization,phase231,phase24,phase25,phase26,phase27,phase271,phase28 andphase29. Logs are retained here. Two expectations are deliberately adapted for the required new hero: the heading copy and the removed conceptual-node interaction. No auth/data/security assertion is weakened.

The initial localized signup navigation wait and its first rerun timed out. Their failure logs are retained. A temporary diagnostic copy recorded only HTTP status, route and safe UI error labels, never credentials/cookies/OTPs; it passed the full suite. The final original suite ran independently and passed all8 groups. No authentication implementation or signup assertion was changed; the intermittent timeout was not reproducible in the final run. The diagnostic source copy was removed.

## Build, integrity and limits

Final build/lint logs and result totals are recorded in this directory after the regression run. No frontend/backend environment or package version was changed. Source-only whitespace checks pass. Base, demand and supply publications remain unchanged; no forecasts, gaps or taxonomy mappings were created.

Baseline Vite sizes: initial JS504.14kB /139.97kB gzip; lazy real-intelligence409.33kB /115.11kB gzip; CSS108.12kB /19.72kB gzip. Final hero build: initial516.66kB /143.19kB gzip; lazy real-intelligence405.06kB /114.27kB gzip; CSS115.23kB /21.01kB gzip. The existing >500kB initial-chunk advisory remains; it is not suppressed. New images are129.69kB dark and134.85kB light, with only the current theme's image requested initially. These are emitted-file sizes, not measured field performance.

Only a single verified national historical stock is currently supported in this hero. If the demand publication gains incompatible/multiple periods, the card becomes an error/unavailable state until an explicit snapshot-selection contract is added. Source descriptions in the shared evidence dialog retain their published English with language annotations. The conceptual India silhouette is not an official GIS asset. No live data/provider/auth deliverability is claimed or retested by this task.

No commit or push was performed.
