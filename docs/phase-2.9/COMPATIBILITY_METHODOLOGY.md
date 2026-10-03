# Deterministic demand–supply compatibility

Version `demand-training-compatibility-1.0`. Inputs are exact canonical demand/supply observations and their verified source metadata; no private profile, resume, LLM or inferred skill distribution is involved.

## Ten checks

1. Geography: both mapped and the same ID/level. Country and State observations are not interchangeable; no district allocation.
2. Time: period type and bounds match; partial supply intervals do not grant complete-period comparability. POINT stock versus FISCAL_YEAR activity is incompatible.
3. Occupation: reviewed matching system/code or approved evidence-backed equivalence/crosswalk. Missing codes mean insufficient evidence.
4. Skill: the same conservative mapping requirement; no title inference.
5. Sector: the same requirement. A source's sector-themed title is not a sector code.
6. Unit: units match. Vacancies, persons, centres and seats are not converted.
7. Metric/population semantics: no approved active-vacancy/current-available-worker pairing exists. Training activity/infrastructure cannot satisfy it.
8. Quality: both records must be VALID; warning/unreviewed states block readiness.
9. Source: connected source IDs and matching raw checksums for both evidence records.
10. Mapping approval: unresolved/partial/ambiguous mappings do not establish equivalence.

The output contains dimension statuses, deterministic reason codes, both evidence records, methodology version and observation IDs. Missing IDs/records return UNAVAILABLE. An incompatible check makes the overall result INCOMPATIBLE; absent evidence prevents comparability. The current engine is deliberately conservative: it does not prorate years, convert units, overlap periods or claim PARTIALLY_COMPATIBLE readiness without a reviewed method.

## Current result

The default reference pair is national NCS active-vacancy stock on 2025-07-14 versus national PMKVY certified activity FY2025-26. The UI names this pair and says it is independent of the observation filters; changing the supply table is not falsely presented as changing this national assessment. Exact alternative IDs may be assessed via the API.

Geography, source traceability and quality can pass. Time, units and metric/population semantics fail. Occupation, skill, sector and mapping approval lack evidence. Result:

```json
{
  "status": "INCOMPATIBLE",
  "supply_status": "SUPPLY_AVAILABLE_BUT_INCOMPATIBLE",
  "readiness": "NOT_READY",
  "gap_status": "UNAVAILABLE",
  "gap_value": null
}
```

## Gap gate

No subtraction, ratio, shortage ranking or gap arithmetic exists in this release. A future gap needs a documented approved metric pair, compatible populations and taxonomy versions, periods, units, geographies, quality and exact relationship evidence. Matching integer units or having both tables is insufficient.

RELATED/PARENT_CHILD is not equivalence; PARTIAL is not exact; unreviewed targets cannot be assigned. Published centre stock is not a supply denominator. The API never returns an estimated zero gap when evidence is absent. Forecasting and current-worker availability remain unimplemented.
