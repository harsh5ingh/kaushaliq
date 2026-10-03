"""Public official aggregate data, distinct from private account/session APIs."""
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from src.data_pipeline.repository import read_snapshot

router = APIRouter(prefix="/api/v1", tags=["Canonical intelligence"])


def published():
    try: return read_snapshot()
    except (OSError, ValueError, KeyError):
        raise HTTPException(status_code=503, detail="Validated data snapshot unavailable. No sample fallback.") from None


def envelope(snapshot, version, collection, rows, limit=1000, offset=0):
    coverage = next((c for c in snapshot["coverage"] if c["dimension"] == collection), None)
    return {"items": rows[offset:offset+limit], "total": len(rows), "offset": offset,
            "status": "OBSERVED" if rows else "UNAVAILABLE", "coverage": coverage, "version": version}


@router.get("/catalog")
def catalog(bundle=Depends(published)):
    snapshot, version = bundle
    return {key: snapshot[key] for key in ["sources", "regions", "industries", "occupations", "skills", "coverage", "quality"]} | {"version": version, "schema_version": "1.0"}


@router.get("/sources")
def sources(bundle=Depends(published)):
    snapshot, version = bundle
    return {"items": snapshot["sources"], "version": version}


@router.get("/regions")
def regions(bundle=Depends(published)):
    snapshot, version = bundle
    return envelope(snapshot, version, "regions", snapshot["regions"])


@router.get("/industries")
def industries(q: str = Query("", max_length=100), level: Literal["section", "division", "group"] | None = None,
               limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), bundle=Depends(published)):
    snapshot, version = bundle
    rows = [r for r in snapshot["industries"] if (not level or r["level"] == level) and q.lower() in (r["name"] + " " + r["nic_code"]).lower()]
    return envelope(snapshot, version, "industries", rows, limit, offset)


@router.get("/skills")
def skills(bundle=Depends(published)):
    snapshot, version = bundle
    return envelope(snapshot, version, "skills", snapshot["skills"])


@router.get("/occupations")
def occupations(bundle=Depends(published)):
    snapshot, version = bundle
    return envelope(snapshot, version, "occupations", snapshot["occupations"])


@router.get("/labour")
def labour(region_id: str = Query("in", max_length=100), indicator: Literal["LFPR", "WPR", "UR"] | None = None,
           period: str | None = Query(None, pattern=r"^20\d{2}-\d{2}$"), sex: Literal["male", "female", "persons"] = "persons",
           sector: Literal["rural", "urban", "combined"] = "combined", activity_status: Literal["US", "CWS"] = "US",
           limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), bundle=Depends(published)):
    snapshot, version = bundle
    rows = [r for r in snapshot["labour"] if r["region_id"] == region_id and r["sex"] == sex and r["sector"] == sector
            and r["activity_status"] == activity_status and (not indicator or r["indicator"] == indicator) and (not period or r["period"] == period)]
    return envelope(snapshot, version, "labour", rows, limit, offset)


@router.get("/training")
def training(region_id: str = Query("in", max_length=100), period: str | None = Query(None, pattern=r"^20\d{2}-\d{2}$"),
             limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), bundle=Depends(published)):
    snapshot, version = bundle
    rows = [r for r in snapshot["training"] if r["region_id"] == region_id and (not period or r["period"] == period)]
    return envelope(snapshot, version, "training", rows, limit, offset)
