# Homepage intelligence metric count-up

Completed after Phase 2.9.1. This is a presentation-only change to the existing intelligence card.

## Implementation

`frontend/src/components/ui/CountUp.tsx` uses requestAnimationFrame with ease-out cubic interpolation. The primary metric runs for 1500ms and the two secondary metrics for 1000ms. The final frame assigns the actual target directly, so rounding cannot change the final measurement.

`HeroSection` passes the existing verified snapshot values into the component: national observation value, matched state/UT count and published observation count. No target is hardcoded in production UI. Demand requests, validation, evidence binding, dates, source labels and canonical data remain unchanged. Loading still renders the existing Skeleton. Errors, missing observations and invalid/null measurements retain the existing error/unavailable states; no counter mounts in these states.

The animation effect depends only on numeric target, duration and reduced-motion preference. Theme changes, locale changes, formatter identity and parent re-renders do not restart it. A new target starts from the most recently displayed number, including an interrupted animation. Completion/unmount leaves no scheduled animation frames. The existing snapshot hook is not changed to introduce polling: an explicit retry still shows its loading state before a new ready card mounts.

## Formatting, layout and accessibility

The existing Intl.NumberFormat behavior remains authoritative: English uses en-GB grouping, Hindi uses hi-IN grouping. The formatter is applied during rendering, so language changes update formatting without resetting numeric progress.

Three small CSS rules reserve the formatted target's width using an invisible grid cell and preserve existing tabular numerals. Typography, card surfaces, colors, controls, responsive composition and artwork remain unchanged. Desktop and mobile tests compare the card, number and provenance rectangles before, during and after counting.

A stable screen-reader-only span exposes the formatted API target. The changing visual number and width reservation are aria-hidden. No live region announces intermediate numbers. Reduced motion is read before the first render and subscribed to centrally by the primitive; it shows final values immediately and also cancels active counting when the OS preference changes. No screen-reader certification is claimed.

## Changed source and test files

- Added `frontend/src/components/ui/CountUp.tsx`.
- Modified `frontend/src/components/landing/HeroSection.tsx`: replace only the three number renderings.
- Modified `frontend/src/styles/home-hero.css`: add only width-reservation rules.
- Added `frontend/tests/countup.fixture.tsx`: isolated StrictMode/target-update/RAF-cleanup fixture, never imported by application routes or the production bundle.
- Added `frontend/tests/hero-countup.browser.cjs`: real API targets, controlled clock, negative-response tests and animation frame captures.
- Modified `frontend/tests/phase291.browser.cjs`: wait for animation completion before checking final values; query the visual span separately from the accessible final text; allow an artifact output override.

Focused documentation/artifacts are under this directory; prior phase reports and verification captures are preserved. See `CHANGE_MANIFEST.md` and `changed-files.json` for the full manifest.

## Verification and limitations

Build and lint pass without new lint warnings. The new count-up suite passes 7 check groups; the existing hero suite passes 11; the existing public/auth/navigation suite passes 6. These are 24 grouped checks across 3 suites, not 24 isolated unit tests. See `VERIFICATION.md` for commands and captures.

No dependency, package version, font, environment variable, logo, API, demand data, auth implementation, localization resource, routing or non-hero section was changed. Backend source was untouched and its test suite was not rerun for this visual-only increment. Verification uses headless Edge/Chromium; no alternative-browser or live screen-reader session was performed.

The existing initial-JS chunk advisory remains. Initial JS changed from 516.66kB / 143.19kB gzip to 517.99kB / 143.62kB gzip; CSS from 115.23kB / 21.01kB gzip to 115.44kB / 21.06kB gzip. No new dependencies or assets were added.

No commit or push. Phase 3 was not started.
