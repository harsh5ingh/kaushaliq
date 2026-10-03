from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from src.config import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])
SESSION_SECONDS = 8 * 60 * 60
COOKIE_NAME = "kaushaliq_session"
if settings.environment.lower() == "production":
    COOKIE_NAME = "__Host-kaushaliq_session"
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
DUMMY_PASSWORD_HASH = bcrypt.hashpw(b"not-a-real-account-password", bcrypt.gensalt(rounds=12))


class ManagedConnection(sqlite3.Connection):
    def __exit__(self, *args):
        try:
            return super().__exit__(*args)
        finally:
            self.close()


def connect() -> sqlite3.Connection:
    db = sqlite3.connect(settings.auth_database_path, timeout=10, factory=ManagedConnection)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    return db


def initialize_database() -> None:
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
          password_hash BLOB NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          jti TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
          expires_at TEXT NOT NULL, revoked_at TEXT
        );
        CREATE TABLE IF NOT EXISTS auth_attempts (
          fingerprint TEXT NOT NULL, attempted_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_auth_attempts_time ON auth_attempts(attempted_at);
        """)


initialize_database()


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=200)
    name: str | None = Field(default=None, min_length=1, max_length=80)


def now() -> datetime:
    return datetime.now(timezone.utc)


def csrf_signature(value: str) -> str:
    return hmac.new(settings.jwt_secret.encode(), f"csrf:{value}".encode(), hashlib.sha256).hexdigest()


def csrf_token() -> str:
    nonce = secrets.token_urlsafe(24)
    return f"{nonce}.{csrf_signature(nonce)}"


def validate_csrf(request: Request) -> None:
    cookie = request.cookies.get("kaushaliq_csrf", "")
    header = request.headers.get("x-csrf-token", "")
    origin = request.headers.get("origin", "")
    if not origin or origin.rstrip("/") != settings.frontend_url.rstrip("/"):
        raise HTTPException(status_code=403, detail="Request origin is not allowed.")
    try:
        nonce, signature = cookie.rsplit(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="Request verification failed.") from exc
    if not header or not hmac.compare_digest(cookie, header) or not hmac.compare_digest(signature, csrf_signature(nonce)):
        raise HTTPException(status_code=403, detail="Request verification failed.")


def set_csrf(response: Response) -> str:
    token = csrf_token()
    response.set_cookie("kaushaliq_csrf", token, httponly=False, secure=settings.environment.lower() == "production", samesite="lax", path="/", max_age=SESSION_SECONDS)
    return token


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(COOKIE_NAME, token, httponly=True, secure=settings.environment.lower() == "production", samesite=settings.auth_cookie_samesite, path="/", max_age=SESSION_SECONDS)


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/", httponly=True, secure=settings.environment.lower() == "production", samesite=settings.auth_cookie_samesite)


def safe_user(row: sqlite3.Row) -> dict[str, str]:
    return {"id": row["id"], "name": row["name"], "email": row["email"], "provider": "email"}


def issue_session(response: Response, user: sqlite3.Row) -> tuple[str, str]:
    issued = now()
    expiry = issued + timedelta(seconds=SESSION_SECONDS)
    jti = secrets.token_urlsafe(32)
    payload = {"sub": user["id"], "jti": jti, "iat": issued.timestamp(), "exp": expiry.timestamp()}
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    with connect() as db:
        db.execute("INSERT INTO sessions(jti,user_id,expires_at) VALUES(?,?,?)", (jti, user["id"], expiry.isoformat()))
    set_session_cookie(response, token)
    csrf = set_csrf(response)
    return csrf, expiry.isoformat()


def session_user(token: str | None) -> tuple[sqlite3.Row, str] | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    with connect() as db:
        row = db.execute("""SELECT users.*, sessions.jti, sessions.expires_at, sessions.revoked_at
          FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.jti=? AND users.id=?""", (payload.get("jti"), payload.get("sub"))).fetchone()
    if not row or not row["email_verified"] or row["revoked_at"] or datetime.fromisoformat(row["expires_at"]) <= now():
        return None
    return row, row["expires_at"]


def session_expired(token: str | None) -> bool:
    if not token:
        return False
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options={"verify_exp": False})
    except jwt.PyJWTError:
        return False
    if float(payload.get("exp", 0)) <= now().timestamp():
        return True
    with connect() as db:
        row = db.execute("SELECT expires_at,revoked_at FROM sessions WHERE jti=?", (payload.get("jti"),)).fetchone()
    return bool(row and not row["revoked_at"] and datetime.fromisoformat(row["expires_at"]) <= now())


async def current_session(token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None):
    session = session_user(token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return session


def rate_limit(request: Request, fingerprint: str) -> None:
    ip = request.client.host if request.client else "unknown"
    key = hashlib.sha256(f"{ip}:{fingerprint}".encode()).hexdigest()
    threshold = (now() - timedelta(minutes=15)).isoformat()
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        db.execute("DELETE FROM auth_attempts WHERE attempted_at < ?", (threshold,))
        count = db.execute("SELECT COUNT(*) FROM auth_attempts WHERE fingerprint=? AND attempted_at>=?", (key, threshold)).fetchone()[0]
        if count >= 8:
            raise HTTPException(status_code=429, detail="Too many attempts. Please wait and try again.")
        db.execute("INSERT INTO auth_attempts(fingerprint,attempted_at) VALUES(?,?)", (key, now().isoformat()))


@router.get("/csrf")
def get_csrf(response: Response):
    return {"csrfToken": set_csrf(response)}


@router.get("/providers")
def providers():
    # OAuth credentials alone do not enable a provider: callback/state/PKCE routes are not implemented.
    return {"email": True, "oauth": {"google": False, "github": False, "facebook": False}}


@router.post("/register", status_code=201)
def register(body: Credentials, request: Request, response: Response):
    from src.accounts.passwords import validate_password
    from src.accounts.verification import begin_registration
    validate_csrf(request)
    email = body.email.strip().casefold()
    name = (body.name or "").strip()
    if not EMAIL_PATTERN.fullmatch(email) or not name:
        raise HTTPException(status_code=422, detail="Check the name and email address.")
    validate_password(body.password)
    rate_limit(request, 'registration')
    rate_limit(request, email)
    password_hash = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    user_id = secrets.token_urlsafe(18)
    try:
        with connect() as db:
            db.execute("INSERT INTO users(id,name,email,password_hash,created_at) VALUES(?,?,?,?,?)", (user_id, name, email, password_hash, now().isoformat()))
            user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    except sqlite3.IntegrityError:
        user = None
    # A duplicate account produces the same pending UI, never an authenticated user.
    return begin_registration(user, email, response)


@router.post("/login")
def login(body: Credentials, request: Request, response: Response):
    validate_csrf(request)
    email = body.email.strip().casefold()
    rate_limit(request, email)
    with connect() as db:
        user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    valid = False
    try:
        supplied = body.password.encode("utf-8")
        encoded = user["password_hash"] if user else DUMMY_PASSWORD_HASH
        valid = len(supplied) <= 72 and bcrypt.checkpw(supplied[:72], encoded) and user is not None
    except (ValueError, TypeError):
        valid = False
    if not valid:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if not user["email_verified"]:
        from src.accounts.verification import begin_registration
        return begin_registration(user, email, response)
    csrf, expires_at = issue_session(response, user)
    return {"user": safe_user(user), "expiresAt": expires_at, "csrfToken": csrf}


@router.get("/session")
def get_session(token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None):
    session = session_user(token)
    if not session:
        return {"authenticated": False, "expired": session_expired(token)}
    user, expires_at = session
    return {"authenticated": True, "user": safe_user(user), "expiresAt": expires_at}


@router.post("/logout")
def logout(request: Request, response: Response, token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None):
    validate_csrf(request)
    if token:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options={"verify_exp": False})
            with connect() as db:
                db.execute("UPDATE sessions SET revoked_at=? WHERE jti=?", (now().isoformat(), payload.get("jti")))
        except jwt.PyJWTError:
            pass
    clear_session_cookie(response)
    response.delete_cookie("kaushaliq_csrf", path="/", secure=settings.environment.lower() == "production", samesite="lax")
    return {"signedOut": True}


@router.get("/me")
def me(session=Depends(current_session)):
    user, expires_at = session
    return {"user": safe_user(user), "expiresAt": expires_at}
