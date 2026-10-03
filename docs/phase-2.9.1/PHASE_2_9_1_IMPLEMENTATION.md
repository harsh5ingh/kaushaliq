# Phase 2.9.1 — Homepage hero

## Audit and implementation plan

Read the supplied HeroSection, current HomePage/home-hero/Phase2.3 styles, public layout/routes, semantic tokens, theme and locale providers, shared buttons/modal/loading/evidence components, demand contracts/client/routes, Phase2.2/2.3/2.6/2.8/2.9 implementation and verification documentation, source registry and current browser suites before source edits. The repository already contained substantial uncommitted earlier-phase work. Baseline frontend build/lint passed.

Reuse the existing API, demand decoders, public routes, semantic palette, locale resources and native evidence dialog. Replace only the hero composition. Add a bounded public snapshot consumer, two optimized local background variants and hero-specific browser verification. Preserve all sections below the hero, auth, navigation, footer, backend, canonical publications and Phase2.9 compatibility/readiness gates.

## Visual adaptation

The user-supplied reference establishes the full-width masked image, large left heading, description/actions, right intelligence card and subordinate moving source card. This implementation uses original JSX/CSS adapted to that composition, not the reference's agency statistics, clients, progress bars, CDN image, fake awards or technology branding. No third-party component/dependency was installed.

`HeroSection` owns presentation; `useDemandSnapshot` owns fetching/validation; `SourceMarquee` and `SnapshotLoading` are small local presentation boundaries. `Skeleton` wraps the existing theme-aware `.skeleton` primitive. The supplemental Loader snippet contains unstyled box/face classes; no cube loader or competing animation system was added. Loading uses the skeleton explicitly requested for this hero.

The heading and exact requested supporting copy are bilingual. A nearby disclosure states that skill demand, comparable supply gaps and forecasts remain unavailable. This distinguishes the product direction in the copy from the narrower connected evidence. A restrained text gradient uses existing text/accent tokens. Surface, border, status, spacing, controls and focus tokens remain authoritative. The large hero-card radius is scoped to this composition; it does not change global panels.

## API and measurement semantics

- `/api/v1/intelligence/demand?geography_id=in&metric=active_vacancies`: the sole national historical active-vacancy stock, its dates, source and evidence.
- `/api/v1/intelligence/demand/coverage`: same-publication record count and unique matched state/UT identifiers.
- `/api/v1/sources`: connected base sources for the source strip, combined with the verified demand source.

Values are never embedded in production hero code. The current publication displays 4,005,028 vacancies,33 matched state/UTs and37 published observed records. English uses international grouping as requested; Hindi uses Indian grouping. This is the historical NCS/PIB administrative stock observed14July2025 and published24July2025. It is not current/live demand, annual hiring or a count of all Indian jobs. The37 records include the national observation and source rows with unresolved geography; they are not37 matched states.

Existing decoders bind observation evidence to source checksums and reject unsupported measurements. Additional hero checks require a single national stock, valid dates, matching observation/coverage versions, matching coverage source hash, one matching reference period and consistent published/valid/warning counts. Multiple periods or national stocks fail closed until an explicit selection is designed; none is silently chosen or added together.

Loading exposes a labelled status inside an `aria-busy` region and no numbers. Missing observations use an unavailable state. API/network/contract errors use the existing error/retry control, with no sample fallback or false source claims. Requests abort on unmount/retry. Locale/theme changes reuse the loaded observation rather than refetching it.

The secondary CTA navigates to the existing `/demand` evidence-backed experience. The card's evidence button opens the shared evidence dialog. `EvidencePanel` now accepts supplied source metadata without requiring a workspace provider; its existing workspace lookup remains available. No parallel evidence UI was created.

## Sources, artwork and motion

Only connected PLFS/MoSPI, NCS/PIB, PMKVY/MSDE and partial NIC source families enter the strip. Names are typographic source marks, not official logos or claims of partnership. NSQF/NCVET are excluded. Source family names and controls are localized centrally.

Two original generated editorial India/workforce illustrations are local WebP assets; see `ASSET_PROVENANCE.md`. Their recognizable workers/workplaces/geographic motif are conceptual, not measured GIS or actual source imagery. The artwork caption makes that boundary visible. Existing official KaushalIQ logos were neither modified nor re-encoded.

The existing theme provider selects one image, so initial load requests only the active theme's asset. Full-width cover imagery uses the reference's vertical fade mask with a semantic canvas-colored readability overlay. No new theme state or persistence key exists.

Entrance fade/translation is650ms, with a180ms secondary delay. Source movement is36s linear and has a keyboard-accessible pause/resume button; hover/focus pauses it. Reduced motion disables animation/transforms through the existing global rule, hides the repeated source group/control and renders a static wrapping source row.

## Responsive and accessibility

Desktop uses a7:5 grid with existing1248px content width. Below960px it becomes a reading-order stack: copy, actions, snapshot, source strip. Mobile buttons span the available width; metrics use readable tabular numerals. Hindi has natural tracking/line-height. Data labels and provenance remain textual, not color-only. Keyboard-accessible links/buttons retain shared focus styling. Decorative images have empty alt text and an explicit conceptual caption. Shared modal Escape, focus containment and restoration are tested. No accessibility certification is claimed.

## Verification and remaining limits

See `VERIFICATION.md` and `verification/results.json` for executed tests and rendered checks. Source updates still require the existing reproducible ingestion process; this is a historical snapshot, not a live feed. No new statistics, demand growth, occupation/skill breakdown, gap, forecast, GIS boundary, supply calculation or authentication behavior was introduced. No environment/dependency change, commit or push.
