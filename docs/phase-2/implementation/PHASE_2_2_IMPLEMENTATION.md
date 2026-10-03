# Phase 2.2 — Global navigation, themes and product chrome

Completed 2026-10-02. Repository: D:\SIH part 2\KaushalIQ.

## Scope and audit

Inspected the existing shells, routes, route configuration, public navbar, sidebar, logo component/assets, native Modal, auth preview, Phase 2.1 tokens/global/responsive styles, tests and Phase 2 design/implementation documentation before changes. Git already contained earlier-phase uncommitted work; it was preserved. No route replacement or parallel navigation system was introduced.

This phase implements preferences and shared chrome, not the homepage redesign. Homepage hero/sections, intelligence content, data semantics, charts, API abstraction and backend are unchanged.

## Architecture

- public/theme-init.js is a small same-origin blocking head script and the **single theme resolver/store**. It runs before React, validates stored values, resolves the OS preference, applies html data-theme/color-scheme, synchronizes storage/OS events and notifies subscribers.
- ThemeProvider uses useSyncExternalStore against that store; components never query media or localStorage themselves.
- I18nProvider owns locale preference, guarded persistence and cross-tab updates. app/i18n/config.ts owns supported locale metadata, typed semantic message keys and English fallback.
- preferenceContexts.ts holds shared types/contexts; hooks/usePreferences.ts exposes context consumers separately from component exports.
- PreferenceMenu is the shared keyboard menu primitive. ThemeSwitcher and LanguageSwitcher compose it; ProductPreferences is reused across both shells.
- Existing publicNavigation and navigation configurations remain authoritative for their respective existing navigation groups. Existing router, command palette and auth-query architecture are reused.
- WorkspaceUtilities adds an explicit Website link. Workspace chrome now says Preview workspace instead of presenting a fictitious analyst avatar. Planned capability links have visible and associated descriptive labels.

## Theme implementation

Modes: Light, Dark, System. First visit defaults to System without writing a preference. Explicit choices persist under **kaushaliq.theme.v1**. OS changes apply only in System. Deleting the key returns to System. Invalid stored values resolve to System. Failed storage access leaves working in-memory preferences.

The Phase 2.1 warm-paper and neutral-charcoal token values are unchanged. The head bootstrap sets the resolved theme before React starts, avoiding a contradictory React theme initialization. Browser theme-color is updated from the CSS canvas token after styles load and on changes. No new palette literals are duplicated in the resolver.

No interpolated theme background/foreground transition is used; visual review caught an intermediate grey navbar and its legacy background transition was disabled. Existing hover/focus and reduced-motion behavior remains.

The deployment must serve /theme-init.js from the same origin (Vite copies the public asset into dist). Future CSP must permit this same-origin script. No SSR, no-JavaScript application or server preference cookie was added.

## Navigation and responsive behavior

Desktop public navigation retains Product, Intelligence, How it works, About and Contact, plus Appearance, Language, Sign in and Get started. Current routes retain aria-current and a restrained underline. At compact desktop widths preference text reduces to named icons. Below 960px public utilities move into the existing mobile navigation dialog.

Workspace navigation retains Overview and the existing capability URLs. The sidebar's explicit Website link works with browser history. Preferences sit in the workspace header on desktop/tablet and inside the existing drawer below 768px. Sample data labels and page availability remain intact.

Full/compact original logo selection and object-fit remain unchanged. No new logo container or image processing was introduced. html scrollbar-gutter: stable reserves scrollbar space so dialog opening does not move the header.

No account/session state or fake notification UI was introduced. Existing auth URL/query behavior, fields, validation, disclosures and modal lifecycle are unchanged.

## Localization architecture — implemented vs planned

**Implemented:** English default; English and हिन्दी selectable by name; persisted en-IN/hi-IN under **kaushaliq.locale.v1**; guarded storage; cross-tab updates; centralized locale registry, direction/coverage metadata, semantic keys and fallback resolution.

**Not implemented:** full Hindi translation, translation packages, locale-specific routes, number/date conversion of domain data, additional fonts, plural grammar, or RTL layouts.

Hindi is deliberately a saved preference, not a claim of a translated product. The language menu says the interface remains English while Hindi translation is prepared. html lang remains en for actual English content; the Hindi name carries lang=hi. The user-requested English default takes precedence over the earlier proposal to infer browser language. Future translation rollout must review key coverage, terminology, fonts, rendered lang/dir and formatting together.

Only two non-sensitive preference keys are written. No credentials, session tokens, auth fields, API keys or environment variables were added.

## Accessibility and interaction

Real buttons, links, navigation landmarks, menu/menuitemradio semantics, checked state and text labels. Preference controls/items are at least 44px high. Menus support trigger Enter/Space/arrows, option arrows/Home/End, Enter/Space selection, Tab exit, Escape with focus return and outside-pointer dismissal.

Mobile preferences reuse the existing Modal rather than layering modal focus traps. Escape closes the preference menu first, then the navigation dialog. Existing modal focus containment/restoration remains. Planned links preserve their accessible route name and expose availability through a description. Preferences do not remount route content or clear an open auth form.

No accessibility certification is claimed. Browser keyboard testing is not a substitute for screen-reader, assistive-device and cross-browser testing.

## Verification

- npm install: up to date; 73 packages audited, zero vulnerabilities reported. No dependencies or lockfile changes.
- npm run build: TypeScript and Vite passed. JS bundle about 320.91 kB / 100.31 kB gzip, plus the small theme bootstrap.
- npm run lint: passed without warnings after separating hooks/contexts from provider component files.
- Existing workspace suite: 26 grouped checks passed in dark; 26 in light.
- Existing public/auth suite: 14 grouped checks passed in dark; 14 in light.
- New phase22.browser.cjs: 11 grouped checks passed.
- Total: **91 grouped passing browser checks** across the three suites/modes, no recorded uncaught exceptions.

Existing suites verify route refresh, history, palette shortcuts and navigation, mobile drawer, auth query/history/validation, OAuth/recovery disclosures, focus containment, reduced motion, and real backend health/loading/failure/retry. Backend root, health and OpenAPI endpoints returned 200.

New coverage verifies first-visit System/English; all theme modes; persistence/refresh; live OS changes and explicit overrides; browser theme-color; cross-tab updates/deletion; menu keyboard/focus/outside behavior; Hindi preference/fallback disclosure; responsive public/workspace chrome; stable mobile header geometry; active route and Website navigation; auth field/focus preservation while theme changes; blocked storage; invalid stored theme; bootstrap before React loads; and preference-only storage.

Test changes were narrow:
1. Legacy test palette injection now exercises actual OS preference via emulateMedia instead of directly overriding data-theme.
2. The public auth test now waits for the keyed reset form before filling its email field. A run exposed a race with the previous sign-in field during route transition; no auth logic or expected result was changed.
3. Screenshots disable finite entrance animations for stable inspection.

## Screenshots and visual review

Artifacts live in [phase-2.2-verification](phase-2.2-verification/).

- preferences/dark-public-{1440,1280,1024,768,390}.png
- preferences/light-public-{1440,1280,1024,768,390}.png
- preferences/dark-workspace-{1440,1280,1024,768,390}.png
- preferences/light-workspace-{1440,1280,1024,768,390}.png
- preferences/mobile-navigation-open.png
- preferences/theme-open.png
- preferences/language-open.png

Inspected desktop public/workspace in both themes, mobile public in both themes, intermediate widths and the three open-menu states. No horizontal page overflow or public navbar collisions at the requested widths. The legacy suites also captured full-page, auth and dialog states.

Each suite directory has a JSON result report. Existing Phase 1/1.5/2.1 artifacts were preserved by directing outputs to new directories.

Reproduce from frontend using an existing Playwright installation:
```powershell
$env:PLAYWRIGHT_MODULE = '<existing Playwright module path>'
$env:KAUSHALIQ_TEST_THEME = 'dark' # repeat light
$env:KAUSHALIQ_TEST_OUTPUT = '<project>/docs/phase-2/implementation/phase-2.2-verification/dark-workspace'
npm run check:browser
$env:KAUSHALIQ_TEST_OUTPUT = '<project>/docs/phase-2/implementation/phase-2.2-verification/dark-public'
node tests/phase15.browser.cjs
node tests/phase22.browser.cjs
```

## Files and safety

See [PHASE_2_2_CHANGED_FILES.md](PHASE_2_2_CHANGED_FILES.md) for the exact phase delta. Start-of-task hash comparison confirmed backend files, logos, package files, environment files, homepage/data content and previous Markdown reports were unchanged.

Git status/diff snapshots are in the verification directory. Their full diff includes earlier uncommitted phases; use this phase manifest to identify this task's edits. No commit, push, reset or unrelated deletion occurred.

## Known limitations and next phase

Verified with headless Microsoft Edge on Windows. Safari/Firefox, actual touch hardware, screen-reader output and a formal accessibility audit remain unverified. Hindi is a persisted preference only. The product remains a sample/planned workspace and auth preview; no new backend/authentication/data functionality exists.

Phase 2.3 should redesign the actual homepage composition and storytelling using these stable global controls and Phase 2.1 tokens. It should preserve route/auth behavior, test both themes and retain honest evidence labels. Do not begin that redesign automatically.
