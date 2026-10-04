# Skill Shock and explicit sensitivity scenarios

Methodology version: `scenario-gate-1.0`. Scenarios are separate from Early Warning and canonical observed datasets.

## Skill Shock: NOT_READY

AI adoption, automation and sector expansion are controlled user assumptions. They currently produce **no numerical skill, occupation, industry, regional, training-pressure or workforce impact**. No reviewed adoption-impact coefficients or compatible evidenced relationships are connected. The result preserves the assumption and an eligible observed baseline, and explains required data without inventing edges, percentages, effects or uncertainty.

Required to unlock propagation: a reviewed adoption-impact model, versioned evidenced skill/occupation/industry relationships, compatible measurement/population/period/geography and calibrated empirical uncertainty. A taxonomy reference or similar title is insufficient.

## Direct metric sensitivity: executable arithmetic only

A separate explicit method applies the user's direct percentage assumption to one eligible observed metric:

`simulated value = observed baseline × (1 + user-assumed percent / 100)`

`simulated change = simulated value − observed baseline`

This is a same-period counterfactual sensitivity, **not a forecast, adoption model, labour-demand estimate, gap calculation or skill propagation**. The original period is retained; no future date is created. Count results may be continuous sensitivity quantities and are not observed persons, vacancies or seats. Percentages must remain inside the native 0–100 domain; impossible assumptions return `NOT_READY`, without clipping.

The baseline must be a geographically mapped, complete, `VALID`, source-authenticated observed point with native units and identity. Partial, warned, quarantined, duplicate, unmapped, post-methodology-boundary and incomplete-as-of inputs cannot become baselines. The latest eligible complete observation is used. Missing intervals are never filled. Baseline choices expose classification, geography, period and observed value.

All outputs carry `is_simulation=true`; numerical results additionally carry `status=SCENARIO` and `simulation=true`. The UI persistently says **SIMULATION — NOT OBSERVED DATA**. Observed baseline and simulated value are separate. No confidence interval is available: user assumptions have no connected empirical impact model or calibrated uncertainty distribution.

## Relationship foundation

Typed source/target metadata supports relationship type, source evidence, confidence/qualification, review status and origins `OBSERVED`, `EVIDENCED`, `INFERRED`, `SIMULATED`. Verified relationships require matching source evidence; inference is not verification. The production relationship registry is empty. No illustrative Python/AI/Cloud network is inserted.

## Safety and reproducibility

The public POST is stateless and does not mutate private accounts or canonical intelligence. Input schema forbids extra properties, executable formulas, arbitrary entities, nonfinite numbers and percentages outside -100 through +1000. Inputs are controlled enums and an existing series ID selected server-side. No user-supplied code, URL or coefficient executes. IDs bind validated input, baseline observation, canonical version and methodology. No scenario persistence or background inference is introduced.

The frontend rejects missing simulation labels, incorrect baseline lineage, mismatched publications, invented relationships and arithmetic inconsistent with the request. Changing an assumption/filter aborts the old request and invalidates the previous output. Network errors offer retry without numerical fallback.
