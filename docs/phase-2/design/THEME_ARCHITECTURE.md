# Theme architecture
Status: required Phase 2 foundation, specified here but not implemented.

## State model
Preference = light | dark | system. ResolvedTheme = light | dark.
Default preference is system; persist only preference in localStorage key kaushaliq.theme.v1. Validate stored values and catch read/write errors. Browser storage unavailable means an in-memory choice for that session, not an application error.
System resolves through prefers-color-scheme. OS changes update only when preference is system. Explicit choices remain stable. Listen for storage events to synchronize tabs; deletion returns to system. Theme does not alter data, locale, route or authentication.

## Before first paint
Place a tiny deterministic bootstrap in index.html head before styles/app paint, with a CSP-approved hash/nonce when CSP is deployed. It reads the preference safely, resolves system, sets document.documentElement.dataset.theme and style.colorScheme. It must not wait for React/useEffect.
CSS provides both complete token sets on :root[data-theme="light"] and :root[data-theme="dark"]. A CSS media-query fallback handles disabled JavaScript/failed bootstrap; HTML's default should not force dark. ThemeProvider initializes from the resolved document state using the same resolver contract, avoiding a second contradictory render.
No transition on initial load; no background/foreground colour animation during theme switching. Update browser theme-color consistently. If SSR arrives later, use a server-visible preference cookie or equivalent boot strategy; do not assume current client logic solves SSR hydration.

## Planned modules, only when implemented
app/providers/ThemeProvider.tsx owns subscriptions and API; app/config/theme.ts owns pure preference resolution; components/ui/ThemeSwitcher.tsx owns labelled radio/select presentation. tokens.css holds semantic roles. Existing components consume variables; they do not each query media or storage.
No theming package or Redux needed. Pure resolution logic is testable independently, and bootstrap/provider behavior must remain equivalent.

## Intentional theme surfaces
Light is paper/ink, distinct control outlines and quiet background grouping, not white-painted dark cards. Dark is charcoal with lighter elevated surfaces, not navy. Subtle separators differ from essential boundaries in both.
Tables: header/body/hover/selection/readable sort state. Modals: surface, scrim, fields and focus. Tooltips: opaque themed surfaces. Dropdowns: same portal token inheritance. Charts: explicit CSS-variable series, axis, labels, tooltip and interval roles. Canvas/WebGL later read resolved colours and redraw; SVG can consume CSS variables directly. Logo never receives invert/filter/blend tricks.
Print/export should default to readable light output and preserve evidence labels; standalone chart exports must include their theme rather than depending on host CSS.

## Migration gates
1. Inventory every hardcoded colour/gradient/shadow across all six CSS files and inline SVG. Define roles and temporary old-token aliases.
2. Migrate controls, dialogs, navigation, workspace, then public sections; inspect both themes internally throughout. No user-facing toggle while surfaces are half migrated.
3. Add provider/bootstrap/switcher and remove dark-only color-scheme.
4. Remove unused old selectors and aliases after usage checks. Keep changes independently reviewable.

## Test matrix
Missing/valid/invalid preference × light/dark OS; blocked storage; OS changes under all three preferences; cross-tab changes; hard refresh with throttled JS; direct route and auth URLs; theme switching with a dialog open; palette and error/loading states; focus outlines; reduced motion; forced colors; chart tooltip contrast.
Existing phase15.browser.cjs storage assertion must allow the named theme/locale keys while explicitly rejecting credential/session writes. Record first-paint screenshots, not only screenshots after effects. Accessibility target is WCAG AA, not a compliance claim until tested.
