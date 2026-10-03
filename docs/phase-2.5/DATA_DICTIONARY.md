# Canonical dictionary — schema 1.0

## Labour observations

- `observation_id`: deterministic composite of source family, indicator, period, geography, activity status, sector, sex, age.
- `indicator`: LFPR (labour force / population), WPR (employed / population), UR (unemployed / labour force).
- `value`, `unit`: source percentage, 0–100; no population count reconstructed from it.
- `status`: OBSERVED. Future status vocabulary: DERIVED, FORECAST, SCENARIO, UNAVAILABLE; not interchangeable. Reference tables are explicitly reference-only.
- `period`, `period_start`, `period_end`: annual July–June, not calendar/fiscal-year shorthand.
- `region_id`: `in` or internal state/UT slug. No city/district observations.
- `sex`: male/female/persons. `sector`: rural/urban/combined. Combined is the published weighted figure, not a frontend arithmetic mean.
- `activity_status`: US = usual status ps+ss; CWS = current weekly status. Not merged.
- `age_group`: 15+. `denominator`: population aged15+ or labour force aged15+ according to indicator.
- `methodology_version`: PLFS pre-January-2025. New sampling designs require comparability review.
- `evidence`: source ID, table/page/row/cell locator, raw SHA-256, explicit transformations.

## Region

`region_id`, `name`, `source_name`, `parent_region_id`, `region_type` country/state/ut, `official_code=null`, `geometry_reference=null`, evidence. 28 state +8 UT +1 country. Source aliases normalize A&N, DNH&Daman&Diu, J&K; original label retained. Internal names/codes are not claimed to be official administrative codes. No fictitious child geographies.

## Industry

`industry_id=nic2008-{code}`, `nic_code` string (leading zero retained), published `name`, `level` section/division/group, `parent_id` verified or null, `source_version=NIC-2008`, `class_code=null`, `subclass_code=null`, evidence. Partial Sixth Economic Census listing; absent parents are not invented. Taxonomy has no demand/workforce/growth measure.

## Training

`observation_id`, `region_id`, `period`, fiscal `period_start` April1 and `period_end` March31, `as_of=2026-06-30`, `partial`, indicator trained/certified, nonnegative integer `value`, `unit=reported persons`, `programme=PMKVY`, OBSERVED, evidence. Years may include different cohorts. Do not calculate certified/trained as a conversion rate. One non-reconciling national trained total quarantined; absence distinct from zero.

## Future references

Occupation contract should preserve occupation_id, exact NCO code/version, published name, hierarchy, skill level/description only where source provides them and evidence. Skill contract should preserve verified qualification/competency identifiers, names/category/type, version and only evidenced occupation/industry links. Both collections are empty in this release: no invented rows, mappings or skills-demand scores.
