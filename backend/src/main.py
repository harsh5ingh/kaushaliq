from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes.health import router as health_router

app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Labour Market Intelligence & Skill Demand Forecasting",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "message": "Labour Market Intelligence API is running.",
        "docs": "/docs",
    }