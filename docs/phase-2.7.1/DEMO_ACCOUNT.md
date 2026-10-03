# Development-only demo account

The actual local account is manually seeded and its normal UI login/profile/My Intelligence/watchlist/query/logout have been verified. Identity: `demo@kaushaliq.local`, display name `KaushalIQ Demo`. The generated strong password is only in the ignored backend/.env; it is not printed, copied into documentation, embedded in browser bundles or persisted as plaintext in SQLite.

## Explicit setup

Backend `.env.example` defaults to `DEMO_ACCOUNT_ENABLED=false`, a synthetic demo email and an empty password. Development alone never enables this account. Actual local development .env was explicitly set to true for this requested inspection account; a random strong password was generated there. Existing Resend credentials were unchanged.

From D:/SIH part 2/KaushalIQ/backend:

```powershell
python -m src.scripts.seed_demo_account
```

The command requires development, explicit enable, a synthetic @kaushaliq.local email, normal password-policy compliance and the verified canonical publication. It stores only bcrypt-12 hash, marks this explicitly synthetic local identity verified, seeds user-owned context and sets the persistent `is_demo` marker. No startup seeding or bypass route exists. A normal existing account with the same email cannot be converted. Repeating the command is idempotent and preserves edited preferences/password.

Explicit password reset (revokes existing demo sessions, keeps profile):

```powershell
python -m src.scripts.seed_demo_account --reset-password
```

The normal login UI is used. Disabling the flag blocks login and existing sessions. Any environment other than development blocks seed/login/session creation/session lookup even if the flag remains true and the account/database is copied. Eight-hour HttpOnly cookies, CSRF, server revocation and owner checks remain active.

## Synthetic user context only

Undergraduate qualification; Technology/AI interests; self-reported Python/React/FastAPI; job/upskill goals; explicitly selected canonical Karnataka; optional in-progress onboarding. No resume is fabricated. A canonical region follow and saved India/2023-24 analysis configuration use the existing publication version and reopen current verified observations. No labour metrics, forecasts, alerts or recommendations are seeded.

## Current inspection server commands

From backend:

```powershell
$env:FRONTEND_URL='http://localhost:5174'
python -m uvicorn src.main:app --host 127.0.0.1 --port 8001 --reload --log-level warning --no-access-log
```

From frontend:

```powershell
$env:API_PROXY_TARGET='http://127.0.0.1:8001'
npm run dev -- --host localhost --port 5174 --strictPort
```

Open http://localhost:5174/auth/signin and use the local .env demo credentials. These separate ports preserve the previously running 5173/8000 servers. Existing servers need restart to reload changed .env settings. Do not copy the local .env/database into production. Deleting or disabling the demo account is a developer action; it is not a privileged administrator account.
