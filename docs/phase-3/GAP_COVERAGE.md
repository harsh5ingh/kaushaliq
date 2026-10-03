# Available capabilities and missing data

## Verified gap capabilities available today

**None. Gap calculation remains UNAVAILABLE because the connected demand and supply observations are not semantically comparable.** READY arithmetic is verified only with explicitly synthetic automated test fixtures, not production labour observations.

The existing verified layer is unchanged: 37 NCS historical observations (national, 33 matched state/UT and unresolved buckets), 323 PMKVY supply records (287 output, 36 centre counts), 1,341 PLFS observations, 332 partial NIC references and 37 country/state/UT geography references. Exact shared geography produces 296 source-context assessments across 34 geographies. The national default shows seven context pairs. Eligible calculations: zero.

## Unavailable capabilities and requirements

- National/state gap: verified measures of required labour and available labour for a common measured population, unit and observation interval, with documented compatible coverage and source-version review. Current NCS stock cannot stand in for total demand; trained/certified people cannot stand in for available workers.
- Occupation gap: both sides classified with authoritative, ingested versioned occupation references; approved exact/documented crosswalk where systems differ; occupation-level source observations and compatible population coverage. NCO codes must come from source evidence, not title inference.
- Skill gap: defensible skill-level demand and available-supply measures, connected versioned skill/qualification references, approved skill/occupation crosswalk and common coverage. NSQF levels or qualifications alone are not skill-demand counts.
- Industry gap: source-native industry classifications on both measures, full applicable NIC reference/version and reviewed mappings. The 332 partial NIC reference entries alone do not allocate either aggregate dataset into sectors.
- District gap: authoritative district-coded observations on both sides for the same population and time, canonical district references and boundary/version reconciliation. No state-to-district allocation is permitted. GIS would require separately licensed authoritative geometry; it would not create missing measurements.
- Training-capacity stress: measured seats/capacity and suitable comparable demand within a documented programme/qualification/cohort methodology. Centre counts do not provide seats; training outputs are not current capacity.

Any source needing access permission or licensing must be authorized and recorded in the existing source registry before ingestion. No new external source was acquired in Phase 3 and no specific unconnected dataset is claimed to contain these missing fields.

## Machine-readable evidence

`verification/gap-coverage.json`, `gap-quality.json` and `gap-response.json` preserve the current public read results. Every national/state/district/industry/occupation/skill gap capability remains UNAVAILABLE/NOT_READY. Common-period and mapped classification filter arrays are empty; they are not padded with fake reference options.

Forecasting, early warning, scenario products and AI explanations are outside this phase. They have not been started.
