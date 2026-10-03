# Focused changed-file manifest

This lists only the count-up increment. The repository already contains broader uncommitted earlier-phase work; repository-wide Git output must not be mistaken for this increment's scope.

## Production: 3 files

- `frontend/src/components/ui/CountUp.tsx` — added animation primitive with reduced motion, final accessible text and RAF cleanup.
- `frontend/src/components/landing/HeroSection.tsx` — animate the three existing API-backed values.
- `frontend/src/styles/home-hero.css` — three stable-width/tabular-numeral rules.

## Tests: 3 files

- `frontend/tests/countup.fixture.tsx` — added isolated target-update/cleanup fixture.
- `frontend/tests/hero-countup.browser.cjs` — added focused browser verification.
- `frontend/tests/phase291.browser.cjs` — adapt existing final-value assertions to count-up and preserve earlier screenshots through an output override.

## Documentation: 4 files

- `docs/phase-2.9.1/count-up/IMPLEMENTATION.md`
- `docs/phase-2.9.1/count-up/VERIFICATION.md`
- `docs/phase-2.9.1/count-up/CHANGE_MANIFEST.md`
- `docs/phase-2.9.1/count-up/changed-files.json`

## Artifacts

`docs/phase-2.9.1/count-up/verification/`: final build/lint/count-up logs; three suite results; sampled animation timeline; 7 focused frames; 25 hero-regression images; 8 public-regression images; repository-wide Git status/diff listings and summary. The JSON manifest enumerates the generated artifact paths.

## Intentionally untouched

Backend; demand API/client/snapshot hook; source registry and all canonical/raw/processed data; authentication; routes; theme/locale providers and resources; public navbar/footer; non-hero homepage sections; official logos/background images; environment/package files; previous phase reports and captures. No commit or push.
