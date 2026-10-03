# Navigation architecture
Status: design proposal; preserve current route URLs.

## Public and workspace remain separate
Public routes: /, /product, /how-it-works, /about, /contact, /documentation, /privacy, /terms. Public navbar destinations remain Product, Intelligence (/intelligence), How it works, About, Contact.
Workspace: /intelligence, /skills, /regions, /occupations, /industries, /forecast. Brand links home; add an explicit “Website” destination in workspace utility navigation rather than making logo behavior mysterious. No route renames in the visual migration.

Use one typed registry for route id, path, titleKey, labelKey, navigation group, icon, availability and search aliases. Public, workspace and footer consume filtered views, not separate pasted URLs. Domain pages stay accessible but display “Planned” before entry. Registration does not mean a capability is available.

## Public chrome
Full official PNG when space permits, K-only when compact, unchanged proportions. Primary action “Explore preview” until accounts do something useful; keep Sign in/Get started only with visible account-preview disclosure.
Theme control is labelled Appearance with Light/Dark/System choices. Language shows “English” or “हिन्दी”, not a flag. At narrow widths place utilities in a labelled menu section rather than squeezing all controls beside the logo. Footer remains a directory and includes accurate preview/legal/contact status.

## Workspace chrome
Primary sidebar: Overview, Skills, Regions, Occupations, Industries, Forecast. Future groups may be Explore, Model and Evidence only when supported by implemented workflows. Do not expose every planned engine.
Top bar: page/breadcrumb and context first; search trigger second; dataset/source status separately from account state. Existing fake analyst avatar should become a factual “Preview workspace” label until a session exists.
Settings/appearance/language are utility actions, independent from data filters. Notification entry appears only with actionable events; no decorative unread dot. Backend liveness belongs in diagnostics, not a headline intelligence panel.

## Search and commands
Keep current Ctrl/Cmd+K, Escape, arrows and Enter behavior. Static navigation and future data search are separate result groups with separate loading/errors. No fake index. Display shortcut hints by platform without requiring shortcuts to discover features. Never intercept typing or override an already-open dialog.
Future results need accessible names, stable IDs, roving selection via combobox activedescendant, empty-result explanation and scoped filters. Settings commands may change local theme; search records require a real data contract.

## Account architecture
Preserve ?auth=login|signup|reset and browser history. Link opening pushes one overlay entry, mode switches replace it, close returns to the originating page. Direct URLs close by removing only auth, preserving other query/hash state.
Future session provider sits above shells; auth services stay separate from form rendering. Plan anonymous, checking, authenticated, expired and failed states without fake sessions. Timeout explains what happened, offers sign-in and preserves safe context; never preserve password fields. Return URLs must be same-origin/allowlisted.
Google/GitHub actions remain honest previews until backend integration. Session cookie/token policy is owned by the later security design, not a UI shortcut.

## Focus, history and responsive contract
Do not remount the whole shell on theme/locale changes. Close mobile menu on navigation, then focus destination heading/main. Preserve browser back/forward scroll where expected; avoid unconditional scroll resets on query changes.
Modal focus returns to opener if connected; otherwise a stable corresponding menu/utility control. Test mobile-menu → auth handoff, success replacement, direct query load and back to form. Never layer two active modal focus traps.
Public desktop links collapse below 960px initially; workspace rail at 960–1199px, drawer below 768px, with 768–959 behavior confirmed by translated content. Icons retain accessible names and focus help; no hover-only explanations.
Unknown public URLs should eventually use the public missing-page treatment; unknown workspace paths retain workspace recovery. Current catch-all always enters AppShell: fix deliberately when routes are classified.

## Acceptance
All existing route-refresh and palette tests remain. Add active-route announcements, menu escape/restoration, query preservation, sticky-header focus visibility, 44px touch targets, 200% zoom and translated-label overflow checks. No new router or state library is required.
