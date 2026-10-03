# Typography system
Status: proposed. No font assets or packages added.

## Family decision
Retain locally bundled Inter Variable for navigation, forms, tables and numerical UI: familiarity here is useful, and changing sans fonts alone would not solve the hierarchy.
Trial Noto Serif for Latin editorial headlines and Noto Serif Devanagari for matching Hindi editorial text. Use Noto Sans Devanagari for Hindi UI text. Limit serif use to public display, occasional section headings and report titles; never dense tables, controls or KPI values.
[Noto's official usage guidance](https://github.com/notofonts/noto-docs/blob/main/docs/website/use.md) recommends matching script-specific families. Final font choice remains subject to bilingual visual testing, OFL license packaging and payload measurement; do not fetch fonts at runtime from a CDN.
Fallbacks: UI Inter → system-ui; Hindi UI Noto Sans Devanagari → Nirmala UI → sans-serif; editorial Noto Serif → Georgia → serif, with Hindi Noto Serif Devanagari before serif. Do not pretend current Latin-only Inter covers Hindi.

## Role specifications
Sizes/line heights in px at a 16px root; implement in rem. Weights limited to 400/500/600 for UI, 400/500 for editorial.
- Display: editorial 48/56 desktop, 40/48 tablet, 34/42 mobile, 400; maximum 56px only after composition review. Tracking 0 to -0.02em Latin.
- Page title: UI 32/40 desktop, 28/36 mobile, 600.
- Public section heading: editorial 32/40 desktop, 28/36 mobile, 400.
- Workspace section heading: UI 20/28, 600.
- Body/prose: UI 16/26; dense analytical explanation 14/22. Hindi 16/28 baseline.
- Navigation: UI 14/20, 500; mobile menu 16/24.
- Button/input: UI 14/20 desktop; mobile input 16/24 to avoid browser zoom.
- Table: UI 14/22, headers 13/20 at 500; minimum row height 40px desktop, 44px touch.
- Metadata: UI 13/20. Essential evidence and caveats never below 13px.
- Short label: UI 12/16 at 500. Sentence case default; sparse Latin uppercase labels with <=0.08em tracking.
- Metric: UI 32/36 desktop, 28/34 mobile, 500; tabular lining numerals. Unit and evidence remain adjacent at readable size.

Do not apply Latin negative tracking, forced uppercase or tight fixed line heights to Devanagari. Test conjuncts, matras and mixed Latin/Hindi strings for clipping. Allow translated headings to wrap; no hardcoded line breaks tied to English.

## Analytical typography
Right-align comparable numeric columns; left-align identifiers; use tabular-nums and lining-nums. Keep units in headers and exact-value tooltips/accessible descriptions. Align decimals where comparison benefits, without padding text with spaces.
Use locale formatters on raw numeric values, not preformatted data strings. A dash denotes unavailable only with an accessible explanation; it does not mean zero. Avoid monospaced text everywhere; use system monospace only for IDs/code where appropriate.

## Reading rhythm and delivery
Body line length 55–70 characters; headings about 18–30 characters per line when composition permits, not a fixed two-line promise. Paragraph gap 16px; heading-to-body 16–24px. No full-page paragraphs of muted 11px text.
Self-host licensed WOFF2 subsets, preload only the critical UI subset, font-display: swap, measure fallback layout shift. Lazy-load locale-specific font assets with translations. Do not duplicate Inter or add a font dependency before the specimen is approved.
Acceptance: English/Hindi specimens at 390/768/1024/1280/1440px, 200% zoom, font-download failure, slow network, real currency/date/percentage strings and long region/occupation labels. The type system is accepted by readability, not resemblance to another SaaS product.
