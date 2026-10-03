# KaushalIQ design audit
Date: 2 October 2026. Scope: Phase 2, Step 1. Documentation only; recommendations below are not implemented.

## Executive decision
Preserve the application structure and working interactions. The product needs a coherent visual grammar and clearer preview expectations, not a framework migration. Prioritize readable evidence, intentional density and reliable navigation before additional effects.

## Evidence and inspection
Inspected frontend/src application configuration/routes, all page and component areas, hooks, services, types and six stylesheet files (tokens, global, components, public, auth, home-hero). In particular:
- app/App.tsx, app/routes/AppRoutes.tsx, app/config/{navigation,publicNavigation,intelligence}.ts; main.tsx.
- pages/{HomePage,OverviewPage,CapabilityPage,ProductPage,HowItWorksPage,PublicInfoPage}.tsx.
- components/layout, navigation, landing, footer, auth, ui, charts and dashboard; features/overview/sampleMetrics.ts and ConnectionPanel.tsx.
- frontend/package.json, tsconfig.app.json, vite.config.ts, index.html and frontend/.env.example.
- frontend/tests/{phase1,phase15}.browser.cjs; stored Phase 1.5 verification results and screenshots, including desktop homepage, workspace and mobile account form.
- docs/phase-0/KaushalIQ-Phase-0-Audit.md; docs/phase-1/README.md; docs/phase-1.5/authentication-boundary.md and change-manifest.json.
- backend/src/{main,config}.py, routes/health.py and package initializers; backend/requirements.txt and .env.example; data directory inventory.

Assets visually inspected: frontend/src/assets/kaushaliq-logo.png (full wordmark) and kaushaliq-mark.png (K mark). The full PNG is 564,462 bytes; mark is 908,293 bytes. Both contain vivid blue/cyan and orange/gold with additional hues. These assets are the authority; no artwork edits proposed.

This is a source/document/saved-screenshot audit, not a new browser test run or usability study. Stored reports record 26 workspace checks and 14 public-experience checks passing. Those results are historical evidence, not a claim of new testing or WCAG compliance. No screen-reader, color-vision, Hindi, light-theme or cross-browser sign-off exists.

## Preserve: production-quality foundations, not production readiness
- Separate PublicLayout and AppShell, functioning React Router links, /intelligence Overview and five domain routes. Direct refresh tested in Vite; hosted SPA rewrites remain a deployment requirement.
- Shared native-dialog Modal with Escape, focus containment/restoration and scroll locking; command palette with keyboard selection. AuthField associates labels and errors.
- Explicit Sample labels and provenance language. Recharts is installed but no fake chart pipeline exists.
- Strict TypeScript, local Inter, reduced-motion CSS, API decoder and real health check.
- Reusable Panel, MetricCard, ChartCard and status/state components; public sections are already modular.
- Original PNGs used directly with object-fit: contain; full footer logo and compact responsive brand.

## Prioritized findings
### P1 — Theme architecture is absent
tokens.css fixes color-scheme to dark. components.css embeds navy values in sidebar, selection, badges, modal, skeletons and metric gradients; public.css/auth.css add more. Changing root background alone cannot deliver light mode. Resolve semantic roles first, migrate all surfaces together before exposing a switcher. No theme/localization provider currently exists.

### P1 — Evidence is honest but visually subordinate
sampleMetrics.ts contains 24,680 / 8,420 / 1,284 and a presentation year, explicitly labelled illustrative. Large numerals dominate 10px disclaimers in MetricCard. Screenshot cropping could remove context. Keep the labels; promote “Sample” into the metric name/value group and omit meaningless KPI quantities in the later workspace redesign rather than supplying new invented ones. “Skill gap watch” remains aspirational despite “not assessed” rows.

### P1 — Readability and incomplete accessibility evidence
public.css uses 9–10px specimen/availability/caption/footer text; auth.css uses a 10px preview notice. components.css uses 10px evidence badges and metric notes. Increase essential text to 13–14px, labels to 12px, with tested contrast. Existing focus and semantic controls are valuable; small type is a usability concern, not by itself proof of WCAG failure.
Auth errors are all cleared when any field changes. Completion replaces the form without deliberate focus transfer; returning to the form does not retrigger the mode-only focus effect. Modal restores only a still-connected opener, so mobile menu-to-auth handoff deserves a fallback focus target test. These are source-derived risks, not reproduced defects in this step.

### P2 — Homepage feels like a roadmap presentation
Hero plus numbered explanatory sections repeatedly describe future capability. IntelligenceSignal's four-stage spine and RegionalSection's nested rectangles are labelled concepts, but communicate process more than a user question. Replace in Phase 2.3 with a compact evidence-reading specimen showing what a user can inspect; no fabricated series or inferred conclusions. Preserve the core narrative and honest readiness copy.
The hero's viewport-based minimum height and public-section padding up to 116px produce long gaps. This is not excessive typography everywhere: the actual hero caps at 50px. Improve composition before increasing headline size.

### P2 — Uncoordinated grid and visual emphasis
Hero max-width 1440px and 4.4vw gutter differ from public-wrap's 1240px content and 4vw gutter; workspace has its own 1510px container. Public section gaps include 80/96/100px. Component-level values coexist with a short spacing scale.
Workspace uses bordered, shadowed panels plus gradient KPI cards and icon tiles; header, metadata, rows and footer add more rules. Radii of 6–14px are not extreme; repetition of outlined boxes is the larger issue. Reserve containment for comparison groups and controls.

### P2 — Navigation and account affordances overpromise
Most domain links land on the same intentional unavailable state. Keep URLs but label availability before entry. “Get started” opens a nonfunctional account preview although exploration needs no account. Give “Explore preview” first priority until account functionality exists. The presentation-only analyst avatar resembles a real signed-in account.
Product reuses ModulesSection and How it works reuses ProcessSection: useful component reuse, but duplicated storytelling needs route-specific purpose. Contact/legal/docs pages are honest holding content, not production-complete resources.

### P2 — CSS debt and metadata duplication
public.css retains .landing-hero, .hero-copy, .intelligence-diagram and related old diagram styles, while HomePage uses .home-hero and IntelligenceSignal. components.css retains synthetic .brand-mark/.brand-type styling after PNG adoption. Confirm selector usage before later deletion.
Buttons have shared styles plus public/home/auth overrides. SectionHeader and SectionHeading have different useful responsibilities; do not blindly merge them. publicTitles exists but PublicLayout derives titles from path strings. Footer route strings duplicate navigation destinations.
Reduced-motion rules appear globally and again in public/home styles. Consolidate carefully during token migration, preserving behavior.

### P2 — Brand performance and small-size readability
Original PNGs total about 1.47 MB. Preserve originals; do not silently recompress, recolor or trace them. Ask for official optimized web/icon exports later if required. Dark-blue wordmark details have low visual separation on charcoal; evaluate an unfiltered neutral backing surface in both themes, not image CSS filters. Favicon uses the large original mark, so delivery cost remains a known tradeoff.

### P3 — Future readiness
Inter's loaded subset is Latin-only. All messages and preformatted metric strings are English. Search only indexes static page names. Physical left/right CSS and fixed label widths complicate future localization.
The public browser test asserts total localStorage + sessionStorage length is zero. Theme persistence will legitimately break it: change to assert that no credentials/tokens are stored while allowing named preference keys.
No new UI library, 3D engine or global-state framework is warranted. Keep React, Router, Lucide, Recharts and local Inter; no dependency changes in this step.

## Backend/configuration boundary
Backend is a small FastAPI service with settings, CORS, root and health routes. Health is liveness, not intelligence readiness. data/raw, processed and sample are not a real analytical platform. Frontend VITE_API_BASE_URL exists; Vite dev proxy uses process.env.API_PROXY_TARGET. Backend FRONTEND_URL configures one allowed origin. No auth/database/storage/AI integration exists.
No new .env variables are needed for documentation. Preserve examples; future consumed variables and security ownership are specified in PHASE_2_ROADMAP.md.

## Decision
Adopt warm neutral “research desk” surfaces, restrained ochre emphasis and an editorial/UI type pairing. This is KaushalIQ's proposal, not a competitor palette. See DESIGN_SYSTEM.md for research and the remaining documents for implementable contracts. No existing functionality should be removed merely to simplify the visuals.
