import copy
import hashlib
import json
import unittest
from tempfile import TemporaryDirectory
from pathlib import Path
from fastapi import HTTPException
from unittest.mock import patch
from pydantic import ValidationError
from src.data_pipeline import build as pipeline
from src.data_pipeline.acquire import acquire, DATA
from src.data_pipeline.models import LabourObservation
from src.data_pipeline.repository import read_snapshot
from src.routes.intelligence import published
from src.config import settings


class RealDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot, cls.version = read_snapshot()

    def test_source_integrity_and_no_network_cached_ingestion(self):
        for source in self.snapshot["sources"]:
            if source["connected"]:
                with patch("src.data_pipeline.acquire.urlopen", side_effect=AssertionError("Unexpected download")):
                    receipt = acquire(source["source_id"])
                self.assertEqual(receipt["sha256"], pipeline.digest(DATA / source["raw_path"]))

    def test_restricted_source_not_acquired(self):
        with self.assertRaises(ValueError): acquire("nco-2015")

    def test_known_national_rates_and_cross_source_check(self):
        rows = [r for r in self.snapshot["labour"] if r["region_id"] == "in" and r["period"] == "2023-24" and r["sex"] == "persons" and r["sector"] == "combined" and r["activity_status"] == "US"]
        self.assertEqual({r["indicator"]: r["value"] for r in rows}, {"LFPR": 60.1, "WPR": 58.2, "UR": 3.2})
        sources = pipeline.read_sources()
        source = next(s for s in sources if s["source_id"] == "plfs-annual-2023-24")
        bad = copy.deepcopy(self.snapshot["labour"])
        next(r for r in bad if r["observation_id"] == "plfs:LFPR:2023-24:in:US:combined:persons:15+")["value"] = 60.2
        with self.assertRaisesRegex(ValueError, "disagreement"): pipeline.states(source, bad)

    def test_blank_geography_not_zero_and_no_district_extrapolation(self):
        self.assertFalse(any(r["region_id"] == "in-chandigarh" and r["sector"] == "rural" for r in self.snapshot["labour"]))
        self.assertEqual(len(self.snapshot["regions"]), 37)
        self.assertEqual(sum(r["region_type"] == "ut" for r in self.snapshot["regions"]), 8)
        self.assertTrue(all(r["official_code"] is None and r["geometry_reference"] is None for r in self.snapshot["regions"]))
        self.assertFalse(any(r["region_id"] == "in-lakshadweep" for r in self.snapshot["training"]))

    def test_taxonomy_codes_and_missing_parent_are_not_invented(self):
        groups = [r for r in self.snapshot["industries"] if r["level"] == "group"]
        self.assertTrue(any(r["nic_code"] == "011" for r in groups))
        self.assertEqual(len(self.snapshot["industries"]), 332)
        self.assertIsNone(next(r for r in groups if r["nic_code"] == "021")["parent_id"])
        self.assertEqual(self.snapshot["occupations"], [])
        self.assertEqual(self.snapshot["skills"], [])

    def test_schema_invalid_dates_units_values_and_denominators(self):
        original = self.snapshot["labour"][0]
        for key, value in [("value", -1), ("value", 101), ("period_end", "2010-01-01"), ("unit", "jobs"), ("denominator", "labour force aged 15+"), ("activity_status", "invented")]:
            with self.subTest(key=key, value=value), self.assertRaises(ValidationError):
                LabourObservation.model_validate(original | {key: value})

    def test_duplicates_geography_provenance_and_relationship_validation(self):
        for alteration in ["duplicate", "geography", "provenance", "hierarchy", "wpr"]:
            snapshot = copy.deepcopy(self.snapshot)
            if alteration == "duplicate": snapshot["labour"].append(snapshot["labour"][0])
            if alteration == "geography": snapshot["labour"][0]["region_id"] = "invented"
            if alteration == "provenance": snapshot["labour"][0]["evidence"]["raw_sha256"] = "wrong"
            if alteration == "hierarchy": snapshot["industries"][1]["parent_id"] = "missing"
            if alteration == "wpr": next(r for r in snapshot["labour"] if r["indicator"] == "WPR")["value"] = 100
            with self.subTest(alteration=alteration), self.assertRaises(ValueError): pipeline.validate(snapshot)

    def test_training_quality_quarantine_and_cohort_caution(self):
        self.assertEqual(self.snapshot["quality"]["quarantined"][0]["difference"], 120)
        self.assertFalse(any(r["region_id"] == "in" and r["period"] == "2024-25" and r["indicator"] == "trained" for r in self.snapshot["training"]))
        self.assertTrue(any(r["partial"] for r in self.snapshot["training"]))
        self.assertTrue(any(r["value"] == 304680 for r in self.snapshot["training"]))

    def test_reproducible_offline_build(self):
        before = pipeline.digest(DATA / "canonical" / "labour-market.json")
        pipeline.build()
        self.assertEqual(before, pipeline.digest(DATA / "canonical" / "labour-market.json"))

    def test_corrupt_or_missing_publication_fails_closed(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "labour-market.json"
            path.write_bytes((DATA / "canonical" / "labour-market.json").read_bytes())
            path.with_name("manifest.json").write_text(json.dumps({"sha256": "wrong"}))
            with patch.object(settings, "canonical_data_path", str(path)):
                with self.assertRaises(HTTPException) as failure: published()
                self.assertEqual(failure.exception.status_code, 503)
            with patch.object(settings, "canonical_data_path", str(Path(directory) / "missing.json")):
                with self.assertRaises(HTTPException) as failure: published()
                self.assertEqual(failure.exception.status_code, 503)


if __name__ == "__main__": unittest.main()
