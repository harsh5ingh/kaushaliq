"""Read-only published canonical snapshot; no network and no simulated fallback."""
import hashlib
import json
from functools import lru_cache
from pathlib import Path
from src.config import settings
from src.data_pipeline.models import Snapshot


@lru_cache(maxsize=4)
def _read(path_string, modified, manifest_modified):
    path = Path(path_string)
    payload = path.read_bytes()
    manifest = json.loads(path.with_name("manifest.json").read_text())
    if hashlib.sha256(payload).hexdigest() != manifest["sha256"]:
        raise ValueError("Canonical integrity failure")
    snapshot = Snapshot.model_validate_json(payload).model_dump(mode="json")
    if manifest["raw_sha256"] != {s["source_id"]: s["sha256"] for s in snapshot["sources"] if s["connected"]}:
        raise ValueError("Canonical provenance integrity failure")
    return snapshot, manifest["sha256"]


def read_snapshot():
    path = Path(settings.canonical_data_path)
    if not path.is_absolute(): path = Path(__file__).resolve().parents[2] / path
    return _read(str(path), path.stat().st_mtime_ns, path.with_name("manifest.json").stat().st_mtime_ns)
