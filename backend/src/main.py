from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes.health import router as health_router
from src.routes.auth import router as auth_router
from src.routes.intelligence import router as intelligence_router
from src.routes.demand import router as demand_router
from src.routes.supply import router as supply_router
from src.routes.gaps import router as gaps_router
from src.routes.trends import router as trends_router
from src.routes.scenarios import router as scenarios_router
from src.routes.early_warning import router as early_warning_router
from src.routes.accounts import router as accounts_router
from src.accounts.verification import router as verification_router
from src.routes.oauth import router as oauth_router

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
app.include_router(demand_router)
app.include_router(supply_router)
app.include_router(gaps_router)
app.include_router(trends_router)
app.include_router(scenarios_router)
app.include_router(early_warning_router)
app.include_router(accounts_router)
app.include_router(verification_router)
app.include_router(oauth_router)


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


# Account validation must never echo submitted password/OTP/file payloads.
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def private_validation_error(request, exc):
    if request.url.path.startswith(('/api/auth/', '/api/v1/me')):
        detail = 'verification_invalid' if '/verification/confirm' in request.url.path or '/verify-' in request.url.path else 'request_invalid'
        return JSONResponse(status_code=422,content={'detail':detail})
    from fastapi.exception_handlers import request_validation_exception_handler
    return await request_validation_exception_handler(request,exc)
