# Count-up verification

## Executed commands

From `frontend/`:

```powershell
npm run build
npm run lint
node tests/hero-countup.browser.cjs
$env:KAUSHALIQ_TEST_OUTPUT='D:\SIH part 2\KaushalIQ\docs\phase-2.9.1\count-up\verification\hero-regression'
node tests/phase291.browser.cjs
$env:KAUSHALIQ_TEST_OUTPUT='D:\SIH part 2\KaushalIQ\docs\phase-2.9.1\count-up\verification\public-regression'
node tests/phase15.browser.cjs
```

Baseline and final build/lint pass. Dependencies were already installed; no package installation/change was required. Final logs: `verification/build.txt`, `lint.txt`, `count-up.txt`. Each browser suite retains its own `results.json` with empty errors. No backend code was changed.

## New checks: 7 groups PASS

- API loading contains Skeleton and no numeric counter. Once the real response is ready, all counters start at zero. The accessible text already contains the actual formatted API target, while visual ticks are hidden from accessibility APIs and have no live region.
- Exact final values match the unchanged canonical APIs: 4,005,028, 33 and 37 in English; the large number uses 40,05,028 in Hindi. Timing confirms secondary counters finish sooner than the primary. Intermediate values are strictly between zero and target, with ease-out progression.
- Theme/locale switches and opening/closing the evidence dialog retain progress without new demand requests. Switching Hindi back to English changes formatting only; settled counters remain settled.
- An isolated StrictMode fixture exercises recreated formatter/parent JSX, target decrease, increase during an interrupted transition, zero target and unmount cancellation. It does not change canonical or API data. Scheduled RAF count is zero after unmount.
- Desktop and mobile number/card/provenance geometry is unchanged during the counter animation; mobile Hindi has no horizontal overflow.
- Reduced motion displays final values on first load and cancels in-flight animation when preference changes. Restoring normal motion does not restart completed counters.
- HTTP failure/retry, missing observations and null measurement retain truthful states with no fake counter. No production target literals, random values or uncaught browser exceptions.

The controlled-clock geometry tests suppress only the existing hero-column CSS entrance translation, isolating count-up layout from that separate intentional motion. Screenshot sequences are before-first-frame, intermediate and final frames; they are not new labour observations. The JSON timeline retains sampled display values, states and rectangles. Browser media-query notifications are asynchronous; runtime preference tests wait for their application. Initial harness failures from measuring the pre-existing entrance transform and reading a media notification synchronously were corrected; no production behavior was weakened.

## Existing checks: 17 groups PASS

Hero regression: 11 groups covering verified metrics/dates/source integrity, Skeleton, API errors/retry, unavailable/invalid publication rejection, shared evidence dialog, keyboard focus/containment/Escape/restoration, CTAs/history, source movement, locale refresh/persistence, System appearance and reduced motion.

Public regression: 6 groups covering responsive logos/navigation, direct public routes and refresh, public intelligence/private-account boundaries, auth dialog behavior, existing signup/session behavior, account menu routes, sign-out and reduced motion.

The existing hero's value assertions now wait for the intentionally animated display to settle and select its visual span, rather than conflating accessible final text and animated text. No API/security/data-integrity assertion was removed.

## Screenshot review

7 focused count-up captures: desktop dark/English start and midpoint; desktop light/English final; mobile light/Hindi start, midpoint, final and reduced motion. Full hero/card/provenance is included in the bounded crops. The timeline plus these frames provides frame-sequence verification rather than a video recording.

The unchanged hero regression additionally captures 20 responsive combinations: 1440, 1280, 1024, 768, 390 × dark/light × English/Hindi, plus 5 loading/error/unavailable/evidence captures. All combinations pass automated image-load, containment and no-page-overflow checks. The public regression adds 8 screenshots for homepage/auth/workspace states.

Manual image inspection covered readable focused desktop start/mid/final and mobile Hindi mid/final frames, with representative full-page captures. Numbers remain aligned; typography/card design is preserved; mobile provenance/source controls remain reachable. This is not an accessibility certification or pixel-diff baseline claim.
