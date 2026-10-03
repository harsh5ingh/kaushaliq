# Localization architecture
Status: proposal. Do not translate the whole application or expose a misleading partial Hindi experience in this step.

## Locale and region are different concepts
Initial UI locales en-IN and hi-IN; both LTR. Geography selection is analytical scope, not language selection. Time zone is an explicit user/product setting; start with Asia/Kolkata for India-focused dates, but preserve source reporting periods.
Locale registry fields: code, nativeLabel, direction, messageLoader, font stack, formatting defaults and release coverage. Future RTL locales set html dir=rtl; they are not claimed supported now.

## Planned structure and key strategy
When implementation starts:
- app/i18n/config.ts: registry and locale resolution.
- app/i18n/locales/en-IN/{common,navigation,auth,evidence,public,workspace}.ts.
- app/i18n/locales/hi-IN/ with matching namespaces.
- app/providers/LocaleProvider.tsx.
- utils/formatters.ts for Intl wrappers.
- components/ui/LanguageSwitcher.tsx.

Use semantic keys such as navigation.skills, auth.errors.emailInvalid, evidence.kind.sample, overview.empty.noDataset. English literal sentences are not keys. Keep route IDs/domain IDs stable across languages. Rich messages use named placeholders; no concatenating sentence fragments or translated HTML via dangerouslySetInnerHTML. Dates/numbers are raw values until display.
For the small initial dictionary use typed key parity checks and simple interpolation. When plural/select-rich messages arise, adopt a maintained ICU-capable solution through a separate dependency decision; do not grow a homemade grammar engine.

## Resolution and fallback
Explicit stored choice (kaushaliq.locale.v1) → supported browser locale match → en-IN. Validate values and handle denied storage. Fallback for missing keys: English message, never raw undefined; log missing-key IDs in development without sensitive values. Production readiness requires key parity and reviewed critical journeys.
Show “English” and “हिन्दी” with a text label Language. Make Hindi selectable only when navigation, controls, auth, evidence notices and errors have complete reviewed coverage. Mark content-specific English fallback with lang=en; do not claim a source document has been translated when only chrome has.
No route localization or path rewrite needed initially; future locale URLs require a separate SEO/routing decision. Switching language preserves current path, query, focus context and data filters.

## Formatting
Use Intl.NumberFormat(locale), Intl.DateTimeFormat(locale, options), Intl.RelativeTimeFormat and Intl.PluralRules rather than manual commas/English suffixes.
- en-IN grouping example: 1234567 → 12,34,567. hi-IN uses explicit numberingSystem policy; start with latn for analytical comparability, offer deva later only if researched.
- Store ratios as fractions and format percent explicitly; distinguish percent change from percentage points.
- Currency is a separate ISO currency code (INR for relevant India amounts), not implied by language.
- Preserve ISO date/time values; date-only reporting periods must not shift under time-zone conversion. Label month/year versus timestamps deliberately.
- Empty/missing values have localized explanations; approximate values must say approximate. Table sorting uses raw numbers and Intl.Collator for text.
- Translated geography names map to stable IDs; do not machine-translate identifiers or infer a different regional dataset from UI language.

## Layout and scripts
Use margin-inline, padding-inline, inset-inline-start and text-align:start. Do not mirror brand artwork, numerical axes or factual geography. Mirror directional navigation icons only where semantics require it. Use bdi/dir=auto for mixed user/source labels.
Allow 30–50% text expansion in tests; avoid fixed form-label heights and English-specific line breaks. Devanagari fonts, line heights and no forced tracking are defined in TYPOGRAPHY_SYSTEM.md. Screen-reader labels, validation and evidence notices must translate with visible text.

## Delivery and QA
Start with shared shell/evidence messages, then critical auth/public flows, then workspace copy. Hindi review requires a fluent reviewer and labour-market terminology glossary, not automatic translation alone. Test India number grouping, leap days, time zones, plural forms, long names, mixed scripts, pseudo-localization and an RTL fixture. Full RTL support remains unshipped until verified. No i18n dependency or translation files added in this audit.
