"""Hash-bound read repository with cached dimension indexes; no runtime downloads."""
import hashlib
import json
from functools import lru_cache
from pathlib import Path
from src.config import settings
from src.data_pipeline.repository import read_snapshot
from src.demand.build import validate

PUBLIC_SOURCE_FIELDS = ('source_id','publisher','dataset_name','url','license','license_url','version','geography','granularity','methodology','notes','access_method','update_frequency','access_status','retrieved_at','sha256','connected','publication_date','observation_period','classification_system','source_kind')


def public_source(source):
    return {key: source.get(key) for key in PUBLIC_SOURCE_FIELDS}


@lru_cache(maxsize=4)
def _read(path_string, modified, manifest_modified, base_version):
    path = Path(path_string)
    payload = path.read_bytes()
    manifest = json.loads(path.with_name('manifest.json').read_text())
    if hashlib.sha256(payload).hexdigest() != manifest['sha256'] or manifest['base_version'] != base_version:
        raise ValueError('Demand publication integrity/base-version failure')
    base, _ = read_snapshot()
    snapshot = validate(json.loads(payload), base)
    if snapshot['base_version'] != base_version or manifest['raw_sha256'] != {s['source_id']:s['sha256'] for s in snapshot['sources']}:
        raise ValueError('Demand provenance integrity failure')
    # The publication is small; indexed sets avoid repeated scans and need no second database.
    fields = ['geography_id','geography_level','occupation_code','occupation_system','skill_code','sector_code','reference_period','metric','source_id','quality_status','status','mapping_status']
    indexes = {field: {} for field in fields}
    for i, signal in enumerate(snapshot['signals']):
        for field in fields: indexes[field].setdefault(signal[field],set()).add(i)
    return snapshot, manifest['sha256'], indexes


def read_demand():
    path = Path(settings.demand_data_path)
    if not path.is_absolute(): path = Path(__file__).resolve().parents[2] / path
    _, base_version = read_snapshot()
    return _read(str(path),path.stat().st_mtime_ns,path.with_name('manifest.json').stat().st_mtime_ns,base_version)


def query(snapshot, indexes, filters):
    selected = set(range(len(snapshot['signals'])))
    for field,value in filters.items():
        if value is not None: selected &= indexes[field].get(value,set())
    return [snapshot['signals'][i] for i in sorted(selected)]
