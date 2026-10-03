"""Acquire registered public sources, retaining original bytes and retrieval receipts."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "data"
REGISTRY = DATA / "metadata" / "source_registry.json"

def acquire(source_id: str) -> dict:
    source = next(s for s in json.loads(REGISTRY.read_text(encoding="utf-8")) if s["source_id"] == source_id)
    if source["access_status"] != "approved_public_download":
        raise ValueError("Source is research-only; download/redistribution is not approved.")
    target = DATA / source["raw_path"]
    receipt = target.with_suffix(target.suffix + ".receipt.json")
    if target.exists():
        record = json.loads(receipt.read_text(encoding="utf-8"))
        if record["source_id"] != source_id or record["url"] != source["url"]:
            raise ValueError("Registered source changed: use a new immutable snapshot path.")
        if hashlib.sha256(target.read_bytes()).hexdigest() != record["sha256"]:
            raise ValueError("Raw snapshot changed: refusing to overwrite or ingest it.")
        return record
    request = Request(source["url"], headers={"User-Agent": "KaushalIQ-research/0.1"})
    with urlopen(request, timeout=120) as response:
        content = response.read(50 * 1024 * 1024 + 1)
        content_type, final_url = response.headers.get("Content-Type", ""), response.url
    if len(content) > 50 * 1024 * 1024:
        raise ValueError("Source exceeds the 50 MB acquisition bound.")
    if source["format"] == "pdf" and not content.startswith(b"%PDF"):
        raise ValueError("Expected a PDF; received another payload.")
    if source["format"] == "html" and b"<" not in content[:1000]:
        raise ValueError("Expected HTML.")
    record = {"source_id": source_id, "url": source["url"], "final_url": final_url,
              "retrieved_at": datetime.now(timezone.utc).isoformat(), "bytes": len(content),
              "content_type": content_type, "sha256": hashlib.sha256(content).hexdigest()}
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("xb") as output:
        output.write(content)
    receipt.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    return record

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_ids", nargs="*")
    args = parser.parse_args()
    sources = json.loads(REGISTRY.read_text(encoding="utf-8"))
    ids = args.source_ids or [s["source_id"] for s in sources if s["access_status"] == "approved_public_download"]
    for identifier in ids:
        record = acquire(identifier)
        print(f"{identifier}: {record['bytes']} bytes, SHA256 {record['sha256']}")
