from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "KaushalIQ"
    app_version: str = "0.1.0"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    api_url: str = ""
    canonical_data_path: str = str(Path(__file__).resolve().parents[2] / "data" / "canonical" / "labour-market.json")
    auth_session_ttl: str = "8h"
    jwt_secret: str = ""
    auth_database_path: str = "data/auth.sqlite3"
    auth_cookie_samesite: str = "lax"
    email_provider: str = ""
    email_api_key: str = ""
    email_from: str = ""
    email_from_name: str = "KaushalIQ"
    sms_provider: str = ""
    sms_api_key: str = ""
    sms_sender_id: str = ""
    otp_expiry_minutes: int = 10
    otp_resend_cooldown_seconds: int = 60
    otp_max_attempts: int = 5
    resume_storage_path: str = "data/private-resumes"
    resume_max_bytes: int = 5 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

if settings.auth_session_ttl != "8h":
    raise ValueError("AUTH_SESSION_TTL is fixed at 8h for this release.")
if settings.environment.lower() == "production" and len(settings.jwt_secret) < 32:
    raise ValueError("JWT_SECRET must be configured with at least 32 characters in production.")
if settings.environment.lower() != "production" and not settings.jwt_secret:
    settings.jwt_secret = "development-only-secret-change-before-deployment-please"
if settings.auth_cookie_samesite.lower() not in {"lax", "strict", "none"}:
    raise ValueError("AUTH_COOKIE_SAMESITE must be lax, strict, or none.")
settings.auth_cookie_samesite = settings.auth_cookie_samesite.lower()
if settings.environment.lower() == "production" and not settings.frontend_url.startswith("https://"):
    raise ValueError("FRONTEND_URL must use HTTPS in production.")

database_path = Path(settings.auth_database_path)
if not database_path.is_absolute():
    database_path = Path(__file__).resolve().parent.parent / database_path
database_path.parent.mkdir(parents=True, exist_ok=True)
settings.auth_database_path = str(database_path)
if not (1 <= settings.otp_expiry_minutes <= 30 and 30 <= settings.otp_resend_cooldown_seconds <= 600 and 1 <= settings.otp_max_attempts <= 10):
    raise ValueError("OTP expiry/cooldown/attempt configuration is outside permitted bounds.")
if not 1024 <= settings.resume_max_bytes <= 10 * 1024 * 1024:
    raise ValueError("Resume limit must be between 1KB and 10MB.")
