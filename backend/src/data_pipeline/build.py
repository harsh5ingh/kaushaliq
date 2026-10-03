"""Offline, fail-closed compilation of preserved official aggregate snapshots."""
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from pypdf import PdfReader
from src.data_pipeline.acquire import DATA, REGISTRY
from src.data_pipeline.models import Snapshot


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self.stack = [], []
    def handle_starttag(self, tag, attrs):
        if tag == "table": self.stack.append({"rows": [], "row": None, "cell": None})
        if not self.stack: return
        table = self.stack[-1]
        if tag == "tr": table["row"] = []
        if tag in {"td", "th"}: table["cell"] = []
    def handle_data(self, value):
        if self.stack and self.stack[-1]["cell"] is not None:
            self.stack[-1]["cell"].append(value)
    def handle_endtag(self, tag):
        if not self.stack: return
        table = self.stack[-1]
        if tag in {"td", "th"} and table["cell"] is not None:
            if table["row"] is not None:
                table["row"].append(" ".join(" ".join(table["cell"]).split()))
            table["cell"] = None
        if tag == "tr" and table["row"] is not None:
            table["rows"].append(table["row"])
            table["row"] = None
        if tag == "table": self.tables.append(self.stack.pop()["rows"])


def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def read_sources(registry_path=REGISTRY):
    sources = json.loads(registry_path.read_text(encoding="utf-8"))
    if len({s["source_id"] for s in sources}) != len(sources): raise ValueError("Duplicate registered source")
    for source in sources:
        required = ["source_id", "publisher", "dataset_name", "url", "license", "geography", "granularity", "methodology", "notes", "access_method", "update_frequency"]
        if source["access_status"] == "approved_public_download": required += ["license_url", "version"]
        if any(not isinstance(source.get(key), str) or not source[key].strip() for key in required):
            raise ValueError("Incomplete source/provenance metadata")
        if not source["url"].startswith("https://") or (source["license_url"] is not None and not source["license_url"].startswith("https://")):
            raise ValueError("Source and terms URLs must use HTTPS")
        source["connected"] = False
        if source["access_status"] == "approved_public_download":
            path = DATA / source["raw_path"]
            receipt = json.loads(path.with_suffix(path.suffix + ".receipt.json").read_text())
            if receipt["source_id"] != source["source_id"] or receipt["url"] != source["url"] or digest(path) != receipt["sha256"]:
                raise ValueError("Raw snapshot integrity failure")
            source.update(receipt)
    return sources


def evidence(source, locator, *transformations):
    return {"source_id": source["source_id"], "locator": locator,
            "raw_sha256": source["sha256"], "transformations": list(transformations)}


def html_tables(source):
    parser = Tables()
    content = (DATA / source["raw_path"]).read_bytes()
    parser.feed(content.decode("utf-16" if content.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig"))
    return parser.tables


def region_key(name):
    aliases = {
        "Andaman & N. Island": "Andaman and Nicobar Islands",
        "A & N Islands": "Andaman and Nicobar Islands",
        "Andaman & Nicobar Islands": "Andaman and Nicobar Islands",
        "Dadra & Nagar Haveli & Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
        "Dadra and Nagar Haveli & Daman and Diu": "Dadra and Nagar Haveli and Daman and Diu",
        "Dadra & Nagar Haveli and Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
        "Jammu & Kashmir": "Jammu and Kashmir", "NCT of Delhi": "Delhi", "Orissa": "Odisha",
        "all India": "India", "All India": "India", "Total": "India",
    }
    name = aliases.get(name.strip(), name.strip())
    return "in" if name == "India" else "in-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def observation(source, indicator, period, region, values, status, locator):
    start = int(period[:4])
    records = []
    for index, value in enumerate(values):
        if value is None: continue  # source blank is unavailable, never zero
        sector = ["rural", "urban", "combined"][index // 3]
        sex = ["male", "female", "persons"][index % 3]
        records.append({"observation_id": f"plfs:{indicator}:{period}:{region}:{status}:{sector}:{sex}:15+",
            "indicator": indicator, "region_id": region, "period": period,
            "period_start": f"{start}-07-01", "period_end": f"{start+1}-06-30",
            "sex": sex, "sector": sector, "activity_status": status, "value": float(value),
            "denominator": "labour force aged 15+" if indicator == "UR" else "population aged 15+",
            "evidence": evidence(source, f"{locator}; {sector}/{sex}", "Published percentage retained; no reweighting")})
    return records


def national(source):
    tables = []
    for rows in html_tables(source):
        periods = [r for r in rows if r and re.fullmatch(r"201[7-9]-\d{2}|202[0-3]-\d{2}", r[0])]
        if len(periods) == 7 and all(len(r) == 10 for r in periods): tables.append((rows, periods))
    if len(tables) != 6: raise ValueError(f"Expected six PLFS tables, got {len(tables)}")
    records = []
    for index, (rows, periods) in enumerate(tables):
        indicator = ["LFPR", "WPR", "UR"][index % 3]
        header = " ".join(" ".join(r) for r in rows).lower()
        expected = {"LFPR": "participation", "WPR": "population", "UR": "unemployment"}[indicator]
        if expected not in header: raise ValueError("PLFS table order/schema changed")
        for row in periods:
            records.extend(observation(source, indicator, row[0], "in", row[1:], "US" if index < 3 else "CWS", f"Table {index+1}; row {row[0]}"))
    return records


def states(source, national_records):
    reader = PdfReader(DATA / source["raw_path"])
    records, regions = [], []
    uts = {"Chandigarh", "Delhi", "Puducherry", "Ladakh", "Lakshadweep", "Jammu & Kashmir", "Andaman & N. Island", "Dadra & Nagar Haveli & Daman & Diu"}
    missing = []
    for indicator, page, table in [("LFPR", 124, 16), ("WPR", 129, 17), ("UR", 134, 18)]:
        text = reader.pages[page].extract_text()
        if f"Table ({table})" not in text or "15 years and above" not in text:
            raise ValueError("PLFS page/age/table schema changed")
        rows = []
        for line in text.splitlines():
            match = re.fullmatch(r"\s*(.+?)\s+((?:\d+\.\d+\s*){6,9})\s*", line)
            if match: rows.append((match[1].strip(), [float(v) for v in match[2].split()]))
        if len(rows) != 37: raise ValueError(f"Expected 37 PLFS regional rows on page {page+1}, got {len(rows)}")
        for name, values in rows:
            identifier = region_key(name)
            if len(values) == 6 and name == "Chandigarh":
                values = [None, None, None] + values
                missing.append({"indicator": indicator, "region_id": identifier, "sector": "rural", "reason": "Blank in source table"})
            if len(values) != 9: raise ValueError(f"Unexpected regional cells: {name}")
            extracted = observation(source, indicator, "2023-24", identifier, values, "US", f"PDF page {page+1}; printed A-{page-62}; Table {table}; row {name}")
            if identifier == "in":
                lookup = {r["observation_id"]: r["value"] for r in national_records}
                if any(lookup[r["observation_id"]] != r["value"] for r in extracted): raise ValueError("National PLFS cross-source disagreement")
                continue
            records.extend(extracted)
            if indicator == "LFPR": regions.append({"region_id": identifier, "name": identifier[3:].replace("-", " ").title(), "source_name": name,
                "parent_region_id": "in", "region_type": "ut" if name in uts else "state",
                "evidence": evidence(source, f"Table 16; PDF page125; row {name}", "Internal identifiers, not official LGD codes; source-name alias normalization")})
    return records, regions, missing


def industries(source):
    result, section, division = [], None, None
    for rows in html_tables(source):
        for row in rows:
            if len(row) != 2: continue
            match = re.fullmatch(r"(Section|Division|Group)\s*([A-U]|\d{2,3})\s*>?", row[0])
            if not match: continue
            level, code = match[1].lower(), match[2]
            identifier = f"nic2008-{code}"
            parent = None if level == "section" else section if level == "division" else f"nic2008-{code[:2]}"
            if level == "section": section = identifier
            if level == "division": division = identifier
            result.append({"industry_id": identifier, "nic_code": code, "name": row[1], "level": level, "parent_id": parent,
                "evidence": evidence(source, f"{match[1]} {code}", "Whitespace normalization; code retained as string; group parent from two-digit code prefix, not HTML display order")})
    ids = {r["industry_id"] for r in result}
    for row in result:
        if row["parent_id"] not in ids and row["parent_id"] is not None:
            row["evidence"]["transformations"].append(f"Parent {row['parent_id']} absent in source; not invented")
            row["parent_id"] = None
    counts = {level: sum(r["level"] == level for r in result) for level in ["section", "division", "group"]}
    if counts != {"section": 19, "division": 82, "group": 231}: raise ValueError(f"Unexpected NIC hierarchy: {counts}")
    return result


def training(source, regions):
    candidates = []
    for rows in html_tables(source):
        numeric = [r for r in rows if len(r) == 9 and all(re.fullmatch(r"[\d,]+", c) for c in r[1:])]
        if len(numeric) == 36 and rows[0] == ["State", "FY-23-24", "FY-24-25", "FY-25-26", "FY-26-27"] and rows[1] == ["Trained", "Certified"] * 4:
            if numeric not in candidates: candidates.append(numeric)  # identical desktop/mobile copies
    if len(candidates) != 1: raise ValueError(f"Unexpected PMKVY Annexure I tables: {len(candidates)}")
    rows = candidates[0]
    known = {r["region_id"] for r in regions}
    result = []
    totals = None
    for row in rows:
        identifier = region_key(row[0])
        if identifier not in known: raise ValueError(f"Unknown PMKVY geography: {row[0]}")
        values = [int(c.replace(",", "")) for c in row[1:]]
        if identifier == "in": totals = values
        for index, value in enumerate(values):
            year = 2023 + index // 2
            period = f"{year}-{str(year+1)[2:]}"
            indicator = "trained" if index % 2 == 0 else "certified"
            if identifier == "in" and year == 2024 and indicator == "trained": continue  # published sum discrepancy, quarantined
            result.append({"observation_id": f"pmkvy:{identifier}:{period}:{indicator}", "region_id": identifier,
                "period": period, "period_start": f"{year}-04-01", "period_end": f"{year+1}-03-31",
                "as_of": "2026-06-30", "partial": year == 2026, "indicator": indicator, "value": value,
                "evidence": evidence(source, f"Annexure I; {row[0]}; FY{period}; {indicator}", "Integer parsing; geography aliases; no cohort conversion rate")})
    if totals is None: raise ValueError("PMKVY total missing")
    for index, total in enumerate(totals):
        state_sum = sum(int(r[index+1].replace(",", "")) for r in rows if region_key(r[0]) != "in")
        if index == 2 and state_sum == 2038199 and total == 2038319: continue
        if state_sum != total:
            raise ValueError(f"PMKVY state sum disagrees with published total column {index}")
    return result


def validate(snapshot):
    snapshot = Snapshot.model_validate(snapshot).model_dump(mode="json")
    regions = {r["region_id"] for r in snapshot["regions"]}
    sources = {s["source_id"]: s for s in snapshot["sources"]}
    for collection, key in [("regions", "region_id"), ("industries", "industry_id"), ("labour", "observation_id"), ("training", "observation_id")]:
        rows = snapshot[collection]
        if len({r[key] for r in rows}) != len(rows): raise ValueError(f"Duplicate {collection} identifier")
        for row in rows:
            if row["evidence"]["source_id"] not in sources: raise ValueError("Unknown source")
            if "region_id" in row and row["region_id"] not in regions: raise ValueError("Unknown geography")
            source = sources[row["evidence"]["source_id"]]
            if row["evidence"]["raw_sha256"] != source["sha256"]: raise ValueError("Provenance hash mismatch")
    ids = {r["industry_id"] for r in snapshot["industries"]}
    for row in snapshot["industries"]:
        if row["parent_id"] and row["parent_id"] not in ids: raise ValueError("Broken NIC hierarchy")
        if row["level"] == "group" and row["parent_id"] and row["parent_id"] != f"nic2008-{row['nic_code'][:2]}": raise ValueError("Invalid NIC parent mapping")
    lookup = {r["observation_id"]: r["value"] for r in snapshot["labour"]}
    for row in snapshot["labour"]:
        if row["indicator"] == "WPR" and row["value"] > lookup[row["observation_id"].replace(":WPR:", ":LFPR:")]:
            raise ValueError("WPR exceeds LFPR for identical population")
    return snapshot


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(content, encoding="utf-8")
    temporary.replace(path)


def build():
    sources = read_sources()
    by_id = {s["source_id"]: s for s in sources}
    national_records = national(by_id["plfs-pib-2024"])
    state_records, regions, missing = states(by_id["plfs-annual-2023-24"], national_records)
    regions.insert(0, {"region_id": "in", "name": "India", "source_name": "all India", "parent_region_id": None, "region_type": "country", "evidence": evidence(by_id["plfs-pib-2024"], "All-India tables1–6", "Internal country identifier")})
    snapshot = {"sources": sources, "regions": regions, "industries": industries(by_id["nic-2008"]),
                "labour": national_records + state_records, "training": training(by_id["pmkvy-pib-2026"], regions),
                "coverage": [], "quality": {"status": "VALIDATED_WITH_QUARANTINE", "errors": [], "missing": missing,
                    "quarantined": [{"source_id": "pmkvy-pib-2026", "indicator": "trained", "region_id": "in", "period": "2024-25", "published_total": 2038319, "state_sum": 2038199, "difference": 120, "reason": "Published total does not reconcile; omitted from canonical observations, raw retained"}],
                    "limitations": ["State/UT history limited to 2023-24 US ages15+", "Chandigarh rural rates absent", "Lakshadweep training row absent", "No official geography codes or geometry", "NIC2008 Sixth Economic Census reference is partial: 19 sections, 82 divisions, 231 groups; no class/subclass", "PMKVY counts are not a certification conversion rate"]}}
    for s in sources: s["connected"] = s["access_status"] == "approved_public_download"
    for dimension, status, ids, note in [
        ("labour", "OBSERVED", ["plfs-pib-2024", "plfs-annual-2023-24"], "National 2017-18–2023-24 US/CWS; state/UT 2023-24 US; ages15+"),
        ("regions", "OBSERVED", ["plfs-annual-2023-24"], "36 state/UT source labels; internal identifiers, no district metrics or GIS"),
        ("industries", "OBSERVED", ["nic-2008"], "Reference classification only, not employment/demand"),
        ("training", "OBSERVED", ["pmkvy-pib-2026"], "35 state/UT plus national administrative counts; FY2026-27 partial"),
        ("occupations", "UNAVAILABLE", ["nco-2015"], "Reproduction permission pending; no invented NCO codes"),
        ("skills", "UNAVAILABLE", ["nsdc-nos"], "Versioned NOS/QP acquisition and reuse terms pending; taxonomy is not demand"),
        ("demand", "UNAVAILABLE", ["ncs-vacancies"], "No validated compatible vacancy feed ingested"),
        ("gaps", "UNAVAILABLE", [], "No compatible demand/supply populations and units"),
        ("forecast", "UNAVAILABLE", [], "No validated predictive model; historical observations only"),
        ("spatial", "UNAVAILABLE", ["soi-boundaries"], "No authoritative boundaries ingested")]:
        snapshot["coverage"].append({"dimension": dimension, "status": status, "source_ids": ids, "note": note})
    snapshot = validate(snapshot)
    snapshot["quality"]["records"] = {k: len(snapshot[k]) for k in ["regions", "industries", "labour", "training", "skills", "occupations"]}
    write_json(DATA / "staging" / "extracted.json", snapshot)
    write_json(DATA / "processed" / "validated.json", snapshot)
    write_json(DATA / "canonical" / "labour-market.json", snapshot)
    path = DATA / "canonical" / "labour-market.json"
    write_json(DATA / "canonical" / "manifest.json", {"schema_version": "1.0", "sha256": digest(path), "raw_sha256": {s["source_id"]: s["sha256"] for s in sources if s["connected"]}})
    write_json(DATA / "metadata" / "quality_report.json", snapshot["quality"])
    (DATA / "metadata" / "failed_build.json").unlink(missing_ok=True)
    print(json.dumps(snapshot["quality"], indent=2))


if __name__ == "__main__":
    try: build()
    except Exception as error:
        write_json(DATA / "metadata" / "failed_build.json", {"status": "REJECTED", "reason": str(error)})
        raise
