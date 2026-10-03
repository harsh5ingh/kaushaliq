# Semantic colour tokens
Status: proposed palette, not installed. Selection informed by the original PNGs; no image pixels are modified.

## Direction
Light: warm paper with ink text. Dark: neutral charcoal with slightly warm light text. One ochre accent echoes the logo's orange/gold family at usable contrast. These are interface colours, not a claim of official brand swatches or government identity. Do not repeat the logo's rainbow across the UI.
Neutral surfaces carry most information. Accent indicates primary action, selected location or focus. Success/error/warning only indicate actual states.

## Token proposal
Values are light / dark. Components consume semantic names, never literal hex or a dark-only utility.
- bg.canvas: #F7F5EF / #191C19
- bg.surface: #FFFFFF / #222622
- bg.subtle: #EEEEE6 / #2C302B
- bg.hover: #E7E8DE / #343A32
- text.primary: #242620 / #EEEDE5
- text.secondary: #62645B / #B5B8AE
- border.subtle: #D5D7CA / #40473E (decorative separation only)
- border.control: #797C70 / #7E847A (essential control boundaries)
- accent.text and focus.ring: #85520B / #E4B76B
- accent.fill: #85520B / #E4B76B
- accent.on-fill: #FFFFFF / #242620
- accent.hover: #704408 / #F0C681
- accent.subtle: #F2E6CF / #3B3020
- success.text: #236247 / #98C9A8
- success.surface: #E5F0E8 / #20382A
- warning.text: #795308 / #E4BE77
- warning.surface: #F4EACF / #392F1D
- danger.text: #A22D34 / #F0A1A5
- danger.surface: #F9E7E7 / #3D2527
- info.text: #335D7E / #A7C9DF
- info.surface: #E6EDF3 / #26333E
- overlay.scrim: rgb(24 27 23 / 38%) / rgb(0 0 0 / 64%)

Implement in CSS as --bg-canvas, --text-primary, etc. Do not add separate tokens for every page. Skeleton aliases bg.subtle; tooltip aliases surface/text/border; inputs alias surface/text/control. Disabled controls retain readable labels, remove activation, and use a dedicated neutral treatment, not a universal opacity reduction. Selection uses accent.subtle + accent.text plus a marker.

## Calculated core contrast
Computed using WCAG relative sRGB luminance, (Llighter + 0.05)/(Ldarker + 0.05), opaque pairs only:
- Light primary/canvas 14.03:1; secondary/canvas 5.51:1; secondary/surface 6.01:1.
- Light accent/canvas 6.00:1; button on-fill/fill 6.54:1; control border/surface 4.26:1; focus/surface 6.54:1.
- Dark primary/canvas 14.64:1; secondary/canvas 8.54:1; secondary/surface 7.62:1.
- Dark accent/canvas 9.24:1; button on-fill/fill 8.22:1; control border/surface 4.00:1; focus/surface 8.25:1.

These are calculated proposed pairs, not a browser or whole-product accessibility certification. Status palettes, hover/selected combinations, overlays and chart marks still require rendered testing. Target >=4.5:1 normal text, >=3:1 large text, >=3:1 essential UI/graphical boundaries; never use subtle-border for required input identification. See [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Chart-specific roles
Separate chart tokens from UI statuses:
- chart.axis and chart.label → text.secondary; chart.grid → border.subtle.
- chart.series.1: #85520B / #E4B76B.
- chart.series.2: #226B68 / #79C6BF.
- chart.series.3: #64518C / #BBA9DC.
- chart.series.4: #3E6585 / #9CC0DA.
- chart.missing → neutral patterned fill, plus “Unavailable” text.
- chart.interval → low-opacity series fill plus visible boundary; never opacity alone.
- Sequential scale: perceptually ordered neutral-to-series ramp to be selected and tested with the actual measure. Diverging scale only when there is a meaningful centre.

Series identity must be stable across pages and filters. Direct labels, line styles and marker shapes carry redundant meaning. Proposed categorical colours are not yet certified as color-vision-safe; test their actual adjacency/size. Do not use green/red to imply every increase/decrease is good/bad. Limit simultaneous series and offer comparison selection.

## Evidence is not status
Observed/Derived/Forecast/Scenario use neutral text badges plus explicit words; line styles distinguish chart evidence. Sample retains a prominent labelled notice, with optional warning treatment. Forecast is not success, and Observed is not necessarily high quality. Future metadata needs separate fields for evidence kind, sample mode, freshness and uncertainty.

## Migration
Map existing --color-* aliases to roles temporarily, then replace hardcoded sidebar/modal/chart/gradient values by component family. Remove old aliases only after usage search and screenshots. New theme controls must not ship until every active surface consumes complete token sets. Keep logo image files and colours unchanged; test an external neutral backing area if needed for legibility.
