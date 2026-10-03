# Phase 2.1 implementation — Design System Foundation

Completed 2026-10-02 in D:\SIH part 2\KaushalIQ. Scope: visual foundation only.

## Inputs and scope

Read all eight documents in docs/phase-2/design before editing. Inspected the Phase 1/1.5 application shells, public sections, routing, auth preview, dialog/palette lifecycle, component styles, API abstraction, tests, configuration and prior reports. Existing work was already uncommitted; this phase does not claim ownership of the full Git diff.

No pages or routes were replaced. No backend, intelligence, data, authentication, theme preference or localization feature was introduced.

## What changed

- Replaced navy colour variables and literal component colours with the documented semantic charcoal and warm-paper palettes. Active CSS colour literals now live in tokens.css. Browser theme-colour metadata matches the default charcoal canvas.
- Added semantic surface, text, control border, accent, feedback, overlay and chart roles. Chart roles are preparation only; no chart/data calculation was added.
- Retained locally bundled Inter. Body is 16px; shared buttons 14px; essential provenance, sample notes, validation/help text and metadata are 13px. Mobile auth inputs remain 16px. Numeric KPIs keep tabular figures.
- Prepared an editorial font role using the existing font, without downloading or adding a font dependency. Removed forced uppercase styling; a :lang(hi) typography guard prevents inherited tracking/transformation. This is CSS readiness, not localization.
- Defined the 4/8/12/16/24/32/48/64/96 spacing scale, 1248px public content width, 32px desktop/20px mobile gutters and 12/8/4 column scaffold. Hero columns stack before tablet content becomes cramped. Workspace widths/insets use shared layout tokens.
- Flattened Panel and ChartCard groupings to separators. Metric groups retain a quiet surface for comparison, without enclosing rounded borders, static shadows or hover lift. Removed decorative region containment.
- Kept evidence words visible. Observed/Derived/Forecast/Scenario use neutral labels; Sample remains explicitly labelled with the existing sample disclosure and provenance text. No metric, content meaning or data source was changed.
- Normalized shared buttons through a typed Button variant (primary, secondary, quiet, destructive), preserving PrimaryButton/SecondaryButton wrappers. Added pending/disabled semantics and presentation, visible focus and 44px primary/icon/search controls. Existing auth preview state handling is untouched.
- Migrated native modal/drawer, palette, AuthField, empty/loading/error, sidebar, header, public navbar and footer styles through shared tokens.
- Removed confirmed-unreferenced old landing-hero/diagram/synthetic-brand selectors and duplicated public button/reduced-motion rules. Global reduced-motion handling remains authoritative.

## Token architecture

tokens.css is the palette and scale source of truth. Default :root and data-theme="dark" resolve the charcoal palette. data-theme="light" resolves the exact proposed warm-paper palette. No production code sets a theme attribute or stores a preference.

Components consume semantic variables, not raw palette values. Accent text/fill/on-fill/hover remain separate roles to support both themes. Status surfaces/text are separate from evidence kind. Chart axis/grid/label/missing/interval roles share semantic meanings; series colours are explicit, future-only tokens.

Radii: controls 4px, panels 8px when containment is needed, dialogs up to 12px. The only elevation token is for overlays. Public composition-specific dimensions and some existing optical spacing remain local; this is an incremental migration, not a layout rewrite.

## Exact code files changed

See [CHANGED_FILES.md](CHANGED_FILES.md). Six CSS files, Buttons.tsx, index.html and two existing browser test scripts changed. Test scripts now accept an output directory and optional test-only light-palette injection. Their behavior assertions and expected product copy were not weakened or changed.

## Intentionally untouched

- App routing, page/component composition and browser-history logic.
- AuthDialog/AuthForm/AuthField logic, password handling and preview disclosures.
- CommandPalette/Modal focus management and keyboard interaction logic.
- API client, backend source, backend environment and health endpoints.
- Both original PNG logo assets and Brand markup/sizing behavior.
- Package manifests/lockfiles, dependencies, environment examples, datasets.
- Prior Phase 0/1/1.5 reports and all Phase 2 design documentation.

Baseline SHA-256 comparison confirmed only the ten listed existing code/test files changed. Logo files, backend, dependency files and application behavior modules remained byte-identical. No commits or pushes were made.

## Verification executed

- npm install: passed; up to date, 73 packages audited, no vulnerabilities reported, no package or lockfile changes.
- npm run build: passed (TypeScript + Vite).
- npm run lint: passed.
- Existing phase1.browser.cjs: 26 checks passed in dark and 26 in internal light.
- Existing phase15.browser.cjs: 14 checks passed in dark and 14 in internal light.
- Total: 80 passing grouped browser checks, zero recorded browser exceptions.
- Backend GET /, /api/health and /openapi.json returned 200; real health through the frontend proxy, loading, unavailable-backend error and retry passed.
- Sixteen semantic text/background token pairs were calculated with the sRGB luminance formula; all exceeded 4.5:1. Results are in verification/token-contrast.json. This is a limited token check, not accessibility certification.

Browser coverage includes public/workspace routes and direct refresh, CTA links, back/forward, auth query history, preview validation, OAuth/recovery disclosures, no auth network/storage writes, forward/reverse dialog focus containment, Escape, restoration, mobile navigation, command filtering/arrows/Enter/Ctrl-or-Cmd+K, sample disclosure, and reduced motion.

Screenshots at 1440, 1280, 1024, 768 and 390px were generated in both palettes. Homepage hero and full workspace captures were visually inspected at every width. Auth desktop/mobile and palette captures were also inspected. No horizontal page overflow was detected by either suite at the required widths; controls/navigation remained usable. Long mobile signup forms scroll inside the dialog.

Artifacts:
- verification/dark-workspace/browser-results.json
- verification/dark-public/results.json
- verification/light-workspace/browser-results.json
- verification/light-public/results.json
- Each directory contains its relevant screenshots; workspace directories include server logs.

Reproduction from frontend (PowerShell), using an existing Playwright installation:
```powershell
$env:PLAYWRIGHT_MODULE = '<existing Playwright module path>'
$env:KAUSHALIQ_TEST_OUTPUT = '<project>/docs/phase-2/implementation/verification/dark-workspace'
npm run check:browser
$env:KAUSHALIQ_TEST_OUTPUT = '<project>/docs/phase-2/implementation/verification/dark-public'
node tests/phase15.browser.cjs
# Repeat both with separate light-* output directories:
$env:KAUSHALIQ_TEST_THEME = 'light'
```
KAUSHALIQ_TEST_* variables are test-harness controls only, not application configuration or .env additions.

## Limits and deferrals

Dark remains the public default. Light is validated internally; there is no switcher, ThemeProvider, system preference detection, persistence or dynamic browser theme-colour update. These belong to Phase 2.2.

Inter remains the only bundled UI font. Editorial font selection, full homepage/auth/workspace redesigns, translations/locale formatters and chart implementations remain later phases. No empty primitive folders or unused UI frameworks were introduced.

The current interface remains explicitly sample/concept/planned content. Auth is a local preview. No real analytics, forecasting, database, storage, OAuth or authentication backend exists as a result of this phase.

Verification used headless Microsoft Edge on Windows. Safari/Firefox, actual touch devices, screen-reader testing, exhaustive contrast/colour-vision audits and 200% browser zoom were not performed. No WCAG compliance claim is made. Original large PNG assets are preserved; optimization is a separate asset task.

## Acceptance

Existing routes, auth preview, backend health, history, keyboard and responsive interactions passed regression checks. No fake data or new dependency was introduced; artwork is unchanged. Navy application chrome has been migrated, evidence text enlarged, and static panel borders/shadows reduced. Theme UI, localization, authentication backend, database/storage and later phases were not implemented.
