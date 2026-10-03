# Phase 2.1 changed-file manifest

Relative to the start-of-task SHA-256 baseline, not the repository HEAD (which already includes uncommitted earlier-phase work).

## Modified (10)

- frontend/src/styles/tokens.css — exact semantic palettes, spacing/type/layout/radius/motion/chart roles.
- frontend/src/styles/global.css — neutral base, focus, readable type and centralized reduced motion.
- frontend/src/styles/components.css — workspace/shared primitives, flat panels, evidence labels and controls.
- frontend/src/styles/public.css — public token migration, common gutters and obsolete selector cleanup.
- frontend/src/styles/home-hero.css — grid alignment, readable concept metadata, restrained motion.
- frontend/src/styles/auth.css — semantic input/dialog colours and readable hints/errors.
- frontend/src/components/ui/Buttons.tsx — shared variants and pending/disabled semantics.
- frontend/index.html — default charcoal browser theme colour.
- frontend/tests/phase1.browser.cjs — configurable artifact destination and test-only light palette.
- frontend/tests/phase15.browser.cjs — same harness options, original assertions retained.

## Added

- docs/phase-2/implementation/PHASE_2_1_IMPLEMENTATION.md
- docs/phase-2/implementation/CHANGED_FILES.md
- docs/phase-2/implementation/verification/ — dark/light public/workspace screenshots, four JSON reports, server logs, token-contrast.json, git-status.txt and git-diff-stat.txt.

No dependency, logo, backend, environment, domain-data or route changes. Build output is generated/ignored. No commit or push.
