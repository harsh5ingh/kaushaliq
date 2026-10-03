"""Read-only projections of the existing canonical rows. Unknown fields stay unknown."""
from src.gaps.models import GapMeasure, Classification


def measure(row, role, sources, publication_version='', geography_version=''):
    if row is None:
        return None
    classifications = {}
    for dim in ('occupation', 'skill', 'sector'):
        if row.get(dim + '_code') and row.get(dim + '_system'):
            classifications[dim] = Classification(code=row[dim + '_code'], system=row[dim + '_system'],
                version=row.get(dim + '_version'), mapping_status=row.get('mapping_status', 'UNAVAILABLE'),
                evidence=row.get('classification_evidence', {}).get(dim))
    return GapMeasure(signal_id=row['signal_id'] if role == 'demand' else row['supply_signal_id'],
        source_id=row['source_id'], source_record_id=row.get('source_record_id', row['signal_id'] if role == 'demand' else row['supply_signal_id']),
        provenance_id=row.get('provenance_id', row['evidence']['locator']), source_version=sources.get(row['source_id'], {}).get('version'),
        publication_version=publication_version, reference_period=row['reference_period'], period_start=row['period_start'], period_end=row['period_end'],
        period_type=row['period_type'], publication_date=row.get('publication_date'), partial=row.get('partial', False),
        geography_id=row.get('geography_id'), geography_level=row['geography_level'], source_geography_label=row['source_geography_label'],
        geography_mapping_status=row.get('geography_mapping_status', 'UNAVAILABLE'), geography_version=geography_version,
        source_geography_code=row.get('source_geography_code'), observation_date=row.get('observed_at', row.get('observation_date')), as_of=row.get('as_of'),
        metric=row['metric'], semantic_category=row.get('semantic_category', 'VACANCY_STOCK' if row['metric'] == 'active_vacancies' else 'UNCLASSIFIED'),
        population=row.get('population'), value=row['value'], normalized_value=row['normalized_value'], unit=row['unit'],
        original_value=row['original_value'], original_unit=row['original_unit'], status=row['status'], quality_status=row['quality_status'],
        quality_flags=row.get('quality_flags', []), classifications=classifications,
        coverage_fraction=row.get('coverage_fraction'), coverage_population=row.get('coverage_population'), coverage_evidence=row.get('coverage_evidence'),
        methodology_version=row['methodology_version'], evidence=row['evidence'])
