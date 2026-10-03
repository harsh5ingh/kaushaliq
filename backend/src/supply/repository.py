"""Indexed, immutable public supply reads bound to the existing canonical publication."""
import json
import hashlib
from pathlib import Path
from functools import lru_cache
from src.config import settings
from src.data_pipeline.repository import read_snapshot
from src.supply.build import validate


@lru_cache(maxsize=4)
def _read(path_string, modified, manifest_modified, base_version):
    path=Path(path_string);payload=path.read_bytes();manifest=json.loads(path.with_name('manifest.json').read_text())
    if hashlib.sha256(payload).hexdigest()!=manifest['sha256'] or manifest['base_version']!=base_version:raise ValueError('Supply publication/base integrity failure')
    base,_=read_snapshot();snapshot=validate(json.loads(payload),base)
    if snapshot['base_version']!=base_version or manifest['raw_sha256']!={s['source_id']:s['sha256'] for s in snapshot['sources']}:raise ValueError('Supply provenance integrity failure')
    fields=['geography_id','geography_level','reference_period','metric','source_id','quality_status','semantic_category','occupation_code','skill_code','qualification_code','sector_code']
    indexes={key:{} for key in fields}
    for i,row in enumerate(snapshot['signals']):
        for key in fields:indexes[key].setdefault(row[key],set()).add(i)
    return snapshot,manifest['sha256'],indexes


def read_supply():
    path=Path(settings.supply_data_path)
    if not path.is_absolute():path=Path(__file__).resolve().parents[2]/path
    _,base_version=read_snapshot()
    return _read(str(path),path.stat().st_mtime_ns,path.with_name('manifest.json').stat().st_mtime_ns,base_version)
