# KaushalIQ design system direction
Status: proposed specification, 2 October 2026. Read DESIGN_AUDIT.md first. No implementation in this step.

## Product philosophy
Calm, intelligent, editorial, technical and human. A working research desk rather than a wall of indicators. The identity comes from warm neutral paper/charcoal surfaces, measured typography, clear evidence annotations and precise comparison layouts. The supplied multicolour logo remains the richest object in the chrome.

Design order: user question → evidence and scope → comparison → interpretation → possible decision. An unavailable conclusion is preferable to decorative intelligence.

## Research: principles, not imitation
Reviewed current first-party documentation on 2 October 2026. Some guidance predates 2026; it is relevant current guidance, not proof of a universal “2026 style.” No signed-in competitor product testing was performed.
- [Linear's October 2025 mobile redesign rationale](https://linear.app/now/linear-liquid-glass): navigation must accommodate different roles and professional density; their account of avoiding distracting refraction reinforces readability. Adopt role-aware structure, not their glass effects or appearance.
- [Vercel Geist colors](https://vercel.com/geist/colors): separates background, interaction, border and text roles. Adopt role-based token contracts, not its grayscale palette or component styling.
- [Vercel typography](https://vercel.com/geist/typography): type styles combine size, line height, tracking and weight. Adopt complete text roles, not Geist as a new font dependency.
- [Notion appearance and preferences](https://www.notion.com/en-gb/help/account-settings): explicit system/light/dark choices, with language as a separate preference. Adopt understandable preference controls, not a document-editor shell.
- [Raycast quickstart](https://manual.raycast.com/quickstart): searchable commands and discoverable shortcuts reduce navigation friction. Keep KaushalIQ commands scoped and disclose when only pages are searchable.
- [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/): coherent readable roles are more important than novelty. Adapt accessible density without GOV.UK branding, proprietary font or implied affiliation.
- [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): contrast targets are testable requirements, not aesthetic claims.
- [Noto usage guidance](https://github.com/notofonts/noto-docs/blob/main/docs/website/use.md): script-specific matching families support multilingual typography. Font coverage must be designed, not left to accidental fallback.

Datadog graph-query guidance and Apple charts guidance were also searched; their full pages were not reliably readable through this research interface. No detailed claims about those interfaces are used. Stripe, Attio, Supabase, Sentry and Figma are reference candidates, not falsely claimed as audited products.

## Layout and density contract
Proposed spacing tokens in px: 4, 8, 12, 16, 24, 32, 48, 64, 96; names space-1 through space-9 in that order. Use 2px only for optical/border corrections.
- Shared public content maximum 1248px, inclusive content area excluding outer gutter; 32px desktop and 20px mobile gutters. All hero, section and footer content use this anchor.
- >=1200px: 12-column grid, 24px gap; workspace sidebar 232px. >=960px compact desktop: 8 columns, 24px gap and 72px rail. 768–959px: 8 columns with 16px gaps; public links collapse. <768px: four-column layout scaffold, one-column reading order, modal drawer; <600px compact brand.
- Breakpoints respond to actual content fit; document any exception rather than adding one per component. Do not force desktop side-by-side composition at 1024px.
- Public section rhythm 64–96px desktop, 48–64px mobile. No hero viewport minimum by default; keep value proposition and primary action within the first screen where feasible.
- Workspace 24–32px page inset; related content 16–24px apart. Prose 55–70 characters per line. User controls default to 44px height; dense desktop rows may use 40px with separate touch mode.
- Dense tables scroll inside a labelled region; retain key identity column and visibly indicate more columns. Never hide essential evidence only to avoid overflow.

Radius: 4px controls/badges, 8px panels, 12px dialogs maximum. Flat sections have no corner treatment. One subtle overlay shadow; no static card shadows or card hover lift when nothing is clickable. Separators mark scope changes, not every nested div.

## Component strategy
Evolve existing components; do not generate empty folders or all primitives in advance.
- Buttons.tsx remains the basis for Button/PrimaryButton/SecondaryButton/IconButton. Share variant classes with semantic Link, never wrap a link in a button. Primary, secondary, quiet, destructive; disabled and pending are distinct.
- AuthField becomes a thin domain wrapper over Input + field label/help/error when a second form needs it. Use native Select first. Search uses combobox semantics only when suggestions exist.
- Preserve Modal; Drawer is its layout variant with the same lifecycle. Test active focus after content changes and opener removal.
- Preserve StatusBadge; evidence type is independent from freshness, dataset mode and quality. Sample is never interpreted as a lower-confidence observation.
- Panel becomes DataPanel only where it owns a meaningful evidence/interaction grouping. MetricCard may render an unboxed metric row. ChartCard evolves into ChartContainer with required provenance/availability props; presentation receives data, never fetches or calculates.
- Table: semantic table with caption, numeric alignment, sortable button labels and units. Add once there is a real table consumer.
- Tabs only for related in-place views; NavLink for routes. Tooltip for supplementary help, never sole access to provenance; support focus/Escape. Dropdown for actions, native select/radio for preferences.
- Keep EmptyState, LoadingState and ErrorState. Add Toast only for transient action confirmation; persistent errors stay inline.
- Reuse navigation shell and CommandPalette. ThemeSwitcher gets three labelled options; LanguageSwitcher uses language names. Do not add placeholder notification bells or account dropdowns without functionality.

Required primitive states: default, hover, pressed, focus-visible, disabled, pending, error where relevant. Focus has a visible 2px outline and offset; selected state also uses weight/marker. Prefer text plus restrained icon, not icons for every sentence.

## Homepage composition proposal
Retain one primary exploration CTA. Short editorial headline and supporting sentence lead into a “Read the evidence” specimen: source/period/geography on one aligned rail, interpretation area on another, with explicit unavailable fields until real evidence exists. It may illustrate anatomy but must say “Interface concept — not a finding.”
Tell the DATA → SIGNAL → INTELLIGENCE → DECISION story through one annotated specimen and progressively revealed explanation, not four connected neon boxes. Follow with a compact capability index, regional scope, evidence commitment and useful footer. Consolidate duplicated roadmap sections. Public pages should answer distinct questions.
Do not add fake dashboards, trend arrows, national coverage fills or unlabeled metrics. A static specimen is sufficient until real data is authorized.

## Motion
120ms hover/focus response, 180ms navigation state, 220ms drawer disclosure; ease-out, opacity or small transform only. No animation on every section. Focus changes must be immediate, not delayed until animation ends. Do not animate numerical values between unrelated periods. Data refresh preserves axes and explains the updated period. Reduced motion removes spatial transitions and animated skeleton pulses. No parallax or looping ambient effects.

## Visualization and 3D
Each chart answers a written question, with units, period, geography, source and limitations. Show missingness explicitly, never as zero. Avoid misleading truncated bar axes; comparisons require comparable definitions. Forecasts use a distinct dashed segment and uncertainty interval where justified; scenarios state assumptions. Categorical colour is not confidence.
Accessible table/summary alternatives accompany graphics. Focusable interaction exposes the same content as pointer hover. Recharts remains the default candidate; no library change now.
3D is deferred. Require a documented analytical task that a 2D view cannot explain well, an accessible 2D alternative, performance budget, user testing and lazy loading. No spinning globe.

## Acceptance standard
Validate at 1440/1280/1024/768/390px in both themes, 200% zoom and 320 CSS px reflow, keyboard-only use and reduced motion. Measure text contrast, control boundaries and selected states; conduct screen-reader and color-vision checks before compliance claims. Preserve history/refresh, command shortcuts and evidence labels. New visual work must not change API or domain behavior.
