from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "KaushalIQ",
        "version": "0.1.0",
    }