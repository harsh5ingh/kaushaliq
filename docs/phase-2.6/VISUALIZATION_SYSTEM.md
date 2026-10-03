# Verified visualization system

## Components
`components/visualization/VisualizationFrame.tsx`: neutral semantic section, title/description, source, explicit data status, observation period, controls, annotation. No API request or calculation. `ObservationTooltip` and `ObservationLegend` reuse semantic tokens and bilingual resources. Existing loading/error states and StatusBadge are reused; badge now also supports Unavailable.

`ObservedTrend`: typed PLFS observations sorted by actual period_start; 0–100 percentage axis; linear guide segments, hollow observation marks, selected-period reference line and hover tooltips. Native select exposes every point to keyboard/touch users and an adjacent inspector opens existing EvidencePanel. Accessible table is behind native details, avoiding a long duplicate report. Single-point slices explicitly cannot support a trend. Animations disabled; no smoothing, fills, projections or averages.

`RegionalComparison`: published state/UT rates for identical indicator/period/sex/sector/activity. Sorting changes presentation only. HTML/CSS dot plot on 0–100 domain, readable values and keyboard-operable rows. Every mark opens evidence. Native table fallback, bounded vertically scrolling list, missing regions explicitly named. Country observation is excluded; no unweighted national average. Regions view avoids repeating national history.

`UnavailableIntelligence`: reusable explicit status, reason, connected evidence and useful destination. `RelationshipGraph`: renderer-independent evidence-bearing nodes/edges and semantic edge-list fallback; no connected relationship dataset, so current routes pass null. Pan/zoom/filter/layout implementation is intentionally deferred until meaningful edges exist.

`SpatialCoverage`: reference coverage and acquisition prerequisites, with route to actual regional comparison. No artificial map, coordinate system, elevation or WebGL requirement.

## Boundaries
Phase 2.5 DataProvider, API client, raw/canonical model and EvidencePanel remain the acquisition/evidence boundary. Frontend response validator now rejects nonfinite/out-of-range values and incompatible methodology before plotting. New components do not introduce another dataset or hidden simulated fallback. New labels in one English/Hindi visualization resource, both spread into existing locale dictionaries. Published source names remain English, explicitly identified as source metadata.

## Styling / interaction
`styles/visualization.css` centralizes verified visualization styles; uses existing warm paper/charcoal, chart-series/axis/grid and spacing/radius tokens. Flat sections and thin separators; tooltip is the only elevated visualization surface. Desktop trend + inspector columns; stacked mobile reading order; charts retain percentage baseline and readable period labels. Dense tables horizontally scroll within their own focusable container. Dot lists scroll vertically, never across the page. Semantic buttons, details, selects and visible existing focus rules; no color-only status. No new animation loop. No accessibility certification claimed.
