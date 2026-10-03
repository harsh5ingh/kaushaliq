from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes.health import router as health_router
from src.routes.auth import router as auth_router
from src.routes.intelligence import router as intelligence_router
from src.routes.accounts import router as accounts_router
from src.accounts.verification import router as verification_router

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
app.include_router(auth_router)
app.include_router(intelligence_router)
app.include_router(accounts_router)
app.include_router(verification_router)


@app.middleware('http')
async def private_response_headers(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(('/api/auth/', '/api/v1/me')):
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "message": "Labour Market Intelligence API is running.",
        "docs": "/docs",
    }
