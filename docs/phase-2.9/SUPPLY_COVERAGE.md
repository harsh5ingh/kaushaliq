# Supply and reference coverage

Machine-readable authoritative coverage: `data/metadata/supply_coverage.json`, exposed by `/api/v1/intelligence/supply/coverage`. Counts below count **published records**, not summed persons/centres or national estimates.

| Dimension | Country records | State/UT records | District | Status / limitation |
| --- | ---: | ---: | --- | --- |
| PMKVY trained | 3 | 140 | Unavailable | PARTIAL; FY2024-25 country total quarantined |
| PMKVY certified | 4 | 140 | Unavailable | VERIFIED within the published source; 35 State/UT entities |
| PMKVY training centres | Unavailable | 36 | Unavailable | VERIFIED at State/UT level only; no country total |
| Seats | Unavailable | Unavailable | Unavailable | No verified source ingested |
| Current annual capacity | Unavailable | Unavailable | Unavailable | Not derivable from output or centres |
| Occupation mapping | Unavailable | Unavailable | Unavailable | No reviewed crosswalk |
| Skill/NOS/QP alignment | Unavailable | Unavailable | Unavailable | No reviewed crosswalk |

Output covers FY2023-24, FY2024-25, FY2025-26 and partial FY2026-27 as of 2026-06-30. All four periods exist at State/UT level; absence of the country trained row in FY2024-25 stays unavailable. Lakshadweep output is absent. Infrastructure covers all 36 source State/UT rows at one point, 2026-06-30; its Lakshadweep count does not fill the output gap.

Global VERIFIED in the matrix means reviewed publication coverage, not complete labour-market or all-geographic coverage. Explicit unavailable cells are shown in the UI; zero stored as a record-count absence in machine metadata is never rendered as an observed workforce or capacity zero.

The existing 37 geography references are reused, without new district/LGD codes or geometry. Source aliases preserve original labels. The Andhra Pradesh footnote mentioning six Konaseema centres does not create a verified district row.

Reference coverage: partial NIC 2008, 332 entries; occupation/skill/qualification/crosswalk collections unavailable. Reference entries are separate from demand observations. Existing NCS demand remains 37 historical administrative observations at one point, with 34 geographic matches including the national row. It has no occupation/skill/sector/district breakdown and no trend series.

Consequently occupation-level supply, current available workers, employment conversion, district capacity, demand–supply gap and forecasting remain unavailable. These are explicit product limits, not hidden empty charts.
