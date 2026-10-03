"""Deterministic compatibility and READY-only arithmetic. No imputation or inference."""
import hashlib
from decimal import Decimal
from src.gaps.models import GapMeasure, GapResult, CalculationMethod, CompatibilityCheck
from src.supply.models import MappingRelationship
from pydantic import ValidationError

VERSION = 'gap-engine-1.0'
# No approved comparable metric/population pairing is currently connected.
APPROVED_METHODS: tuple[CalculationMethod, ...] = ()


def traceable(evidence, sources):
    if evidence is None:
        return False
    e = evidence.model_dump() if hasattr(evidence, 'model_dump') else evidence
    source = sources.get(e.get('source_id'), {})
    return bool(source.get('connected') and source.get('version') and source.get('sha256') == e.get('raw_sha256'))


def equivalence(a, b, sources, mappings):
    if not a or not b or not a.version or not b.version:
        return False, None
    if a.mapping_status not in {'EXACT', 'DOCUMENTED'} or b.mapping_status not in {'EXACT', 'DOCUMENTED'}:
        return False, None
    if not traceable(a.evidence, sources) or not traceable(b.evidence, sources):
        return False, None
    if (a.code, a.system, a.version) == (b.code, b.system, b.version):
        return True, None
    for raw in mappings:
        try:
            m = MappingRelationship.model_validate(raw).model_dump(mode='json')
        except (ValidationError, TypeError):
            continue
        if (m.get('review_status') == 'APPROVED' and m.get('mapping_status') in {'EXACT', 'DOCUMENTED'}
                and m.get('confidence') == 'confirmed'
                and m.get('mapping_type') in {'EXACT_EQUIVALENCE', 'DOCUMENTED_CROSSWALK'}
                and (m.get('source_code'), m.get('source_system'), m.get('source_version'),
                     m.get('target_code'), m.get('target_system'), m.get('target_version'))
                == (a.code, a.system, a.version, b.code, b.system, b.version)
                and traceable(m.get('evidence'), sources)):
            return True, m
    return False, None


def calculate(demand: GapMeasure | None, supply: GapMeasure | None, sources: dict,
              *, dimension='skill', methods=APPROVED_METHODS, mappings=()) -> GapResult:
    checks = []
    def check(dim, ok, code, explanation, *, missing=False):
        checks.append(CompatibilityCheck(dimension=dim, status='COMPATIBLE' if ok else 'INSUFFICIENT_EVIDENCE' if missing else 'INCOMPATIBLE', reason_code=code, explanation=explanation))
    method = None
    used_mappings = []
    if demand and supply:
        candidates = [m for m in methods if m.approved and dimension in m.dimensions
                      and (m.demand_metric, m.supply_metric, m.demand_semantics, m.supply_semantics,
                           m.demand_population, m.supply_population)
                      == (demand.metric, supply.metric, demand.semantic_category, supply.semantic_category,
                          demand.population, supply.population)]
        # Conflicting or absent reviews never select a method implicitly.
        method = candidates[0] if len(candidates) == 1 else None
        method_verified = bool(method and traceable(method.evidence, sources)
                               and all(sources.get(sid, {}).get('version') == version and sources.get(sid, {}).get('connected') for sid, version in method.source_versions.items())
                               and all(method.source_versions.get(row.source_id) == row.source_version for row in (demand, supply)))
        metric_code = 'VACANCY_STOCK_NOT_TRAINING_ACTIVITY' if demand.metric == 'active_vacancies' and supply.semantic_category.startswith('TRAINING_') else 'METRIC_COMPARABILITY_NOT_APPROVED'
        check('metric', method_verified, 'APPROVED_METRIC_PAIR' if method_verified else metric_code,
              'A versioned reviewed metric/population method is required; vacancy stock is not training output or centre capacity.')
        same_unit = demand.unit == supply.unit and (not method or demand.unit == method.unit)
        check('unit', same_unit, 'SAME_UNIT' if same_unit else 'UNIT_SEMANTICS_DIFFER', 'Units must agree under the reviewed method; vacancies, persons, centres and seats are not silently converted.')
        same_type = demand.period_type == supply.period_type
        same_period = same_type and (demand.period_start, demand.period_end) == (supply.period_start, supply.period_end) and not demand.partial and not supply.partial
        check('time', same_period, 'SAME_PERIOD' if same_period else 'TIME_SEMANTICS_DIFFER' if not same_type else 'PERIOD_DIFFERS_OR_PARTIAL', 'Exact observation boundaries and temporal semantics must agree; publication dates and partial intervals are not substitutes.')
        mapped_geo = bool(demand.geography_id and supply.geography_id and demand.geography_mapping_status in {'EXACT', 'DOCUMENTED'} and supply.geography_mapping_status in {'EXACT', 'DOCUMENTED'})
        same_geo = mapped_geo and bool(demand.geography_version and supply.geography_version) and (demand.geography_id, demand.geography_level, demand.geography_version) == (supply.geography_id, supply.geography_level, supply.geography_version)
        check('geography', same_geo, 'SAME_GEOGRAPHY' if same_geo else 'GEOGRAPHY_DIFFERS' if mapped_geo else 'GEOGRAPHY_UNMAPPED', 'Both inputs must map to the same canonical geography, level and base version; no district allocation.', missing=not mapped_geo)
        required = set(method.required_classifications) if method else {'occupation', 'skill', 'sector'}
        required |= {'skill'} if dimension == 'skill' else {'occupation'} if dimension == 'occupation' else {'sector'} if dimension == 'industry' else set()
        classified = {}
        for dim in ('occupation', 'skill', 'sector'):
            a, b = demand.classifications.get(dim), supply.classifications.get(dim)
            needed = dim in required or a is not None or b is not None
            equivalent, mapping = equivalence(a, b, sources, mappings) if needed else (True, None)
            ok = not needed or equivalent
            if mapping:
                used_mappings.append(mapping)
            classified[dim] = ok
            code = 'NOT_REQUIRED_BY_APPROVED_METHOD' if not needed else 'SAME_REVIEWED_CLASSIFICATION' if ok else 'NO_' + dim.upper() + '_MAPPING' if not a or not b else 'CLASSIFICATION_NOT_EQUIVALENT'
            check(dim, ok, code, 'Required classifications need versioned approved equal codes or an evidence-backed exact/documented crosswalk; title similarity, partial and related edges do not suffice.', missing=not ok)
        versions = all(demand.classifications.get(dim) and supply.classifications.get(dim) and demand.classifications[dim].version and supply.classifications[dim].version for dim in required)
        check('taxonomy', versions, 'VERSIONED_TAXONOMIES' if versions else 'TAXONOMY_VERSION_UNAVAILABLE', 'Required taxonomy versions must be explicit and their relationship must be reviewed.', missing=not versions)
        mapping_ok = all(classified.values())
        check('mapping', mapping_ok, 'APPROVED_MAPPINGS' if mapping_ok else 'MAPPING_NOT_VERIFIED', 'Every required mapping must be approved and traceable; unresolved mappings remain unresolved.', missing=not mapping_ok)
        same_granularity = demand.geography_level == supply.geography_level and set(demand.classifications) == set(supply.classifications)
        check('granularity', same_granularity, 'SAME_GRANULARITY' if same_granularity else 'GRANULARITY_DIFFERS', 'The observation strata must agree; aggregate data cannot populate finer dimensions.')
        complete = (demand.coverage_fraction == supply.coverage_fraction == 1 and demand.coverage_population
                    and demand.coverage_population == supply.coverage_population
                    and traceable(demand.coverage_evidence, sources) and traceable(supply.coverage_evidence, sources))
        check('coverage', bool(complete), 'SUFFICIENT_COVERAGE' if complete else 'COVERAGE_INSUFFICIENT', 'Full compatible measured population coverage needs source evidence. Publication record counts are not population coverage.', missing=not complete)
        quality = all(row.quality_status == 'VALID' and not row.quality_flags and row.status in {'OBSERVED', 'DERIVED'} for row in (demand, supply))
        check('quality', quality, 'VALIDATED_RECORDS' if quality else 'QUALITY_REVIEW_REQUIRED', 'Only validated observed/explicitly derived inputs are eligible; warnings, quarantine, estimates and scenarios cannot open the gate.')
        source_ok = all(traceable(row.evidence, sources) and row.source_version == sources.get(row.source_id, {}).get('version') and row.publication_version for row in (demand, supply))
        check('source', source_ok, 'VERIFIED_SOURCES' if source_ok else 'SOURCE_NOT_VERIFIED', 'Both source versions, checksums, immutable publication identities and evidence must agree.', missing=not source_ok)
    else:
        check('observations', False, 'OBSERVATION_UNAVAILABLE', 'An exact verified demand and supply observation is required.', missing=True)
    ready = all(c.status == 'COMPATIBLE' for c in checks)
    hard_fail = any(c.status == 'INCOMPATIBLE' for c in checks)
    readiness = 'READY' if ready else 'PARTIAL' if demand and supply and not hard_fail else 'NOT_READY'
    status = 'COMPATIBLE' if ready else 'UNAVAILABLE' if not demand or not supply else 'INCOMPATIBLE' if hard_fail else 'PARTIAL'
    flags = sorted({flag for row in (demand, supply) if row for flag in row.quality_flags} | {row.quality_status for row in (demand, supply) if row and row.quality_status != 'VALID'})
    delta = ratio = uncovered = direction = None
    if ready:
        d, s = Decimal(str(demand.value)), Decimal(str(supply.value))
        difference = d - s
        delta, uncovered = float(difference), float(max(difference, 0))
        ratio = float(s / d) if d else None
        direction = 'SHORTFALL' if difference > 0 else 'SURPLUS' if difference < 0 else 'BALANCED'
        if not d:
            flags.append('ZERO_DEMAND_DENOMINATOR')
    dim_key = {'skill': 'skill', 'occupation': 'occupation', 'industry': 'sector'}.get(dimension)
    identifier = demand.geography_id if demand and dimension == 'geography' else demand.classifications[dim_key].code if demand and dim_key in demand.classifications else None
    identities = [VERSION, dimension, demand.signal_id if demand else '', supply.signal_id if supply else '', demand.publication_version if demand else '', supply.publication_version if supply else '', method.method_id if method else '', method.version if method else '']
    evidence = [row.evidence for row in (demand, supply) if row]
    if method:
        evidence.append(method.evidence)
    evidence.extend(m['evidence'] for m in used_mappings)
    for row in (demand, supply):
        if row:
            evidence.extend(c.evidence for c in row.classifications.values() if c.evidence)
            if row.coverage_evidence:
                evidence.append(row.coverage_evidence)
    transformations = [step for row in (demand, supply) if row for step in row.evidence.transformations]
    transformations.extend(f"mapping {m['mapping_id']} / {m['methodology_version']}" for m in used_mappings)
    if ready:
        transformations.extend(['gap = demand - supply', 'uncovered = max(gap, 0)', 'coverage = supply / demand; undefined when demand = 0'])
    return GapResult(result_id='gap-' + hashlib.sha256('|'.join(identities).encode()).hexdigest()[:24], dimension_type=dimension,
                     dimension_id=identifier, readiness=readiness, compatibility_status=status, gap_status='DERIVED' if ready else 'UNAVAILABLE',
                     demand=demand, supply=supply, gap_value=delta, uncovered_amount=uncovered, coverage_ratio=ratio, gap_direction=direction,
                     quality_status='VALID' if ready else 'WARNING' if demand and supply else 'UNAVAILABLE', quality_flags=flags,
                     checks=checks, reason_codes=[c.reason_code for c in checks if c.status != 'COMPATIBLE'],
                     method_id=method.method_id if method else None, method_version=method.version if method else None, engine_version=VERSION,
                     methodology=method.methodology if method else None, transformations=transformations, evidence=evidence, mapping_references=used_mappings,
                     limitations=(method.limitations if method else ['No approved comparable demand/current-supply metric and population pairing is connected.'])
                     + ['Coverage ratio is a supply/demand ratio, not a forecast or causal explanation.'] if ready else
                     (method.limitations if method else ['No approved comparable demand/current-supply metric and population pairing is connected.']))
