from typing import Literal
from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from src.routes.auth import connect, now, validate_csrf, rate_limit, safe_user, issue_session, set_csrf
from src.accounts import otp
from src.accounts.providers import email_provider, sms_provider, ProviderUnavailable
from src.config import settings

router = APIRouter(prefix='/api/auth', tags=['verification'])


def begin_registration(user, email, response):
    otp.issue_flow(response, user['id'] if user else None, email)
    result = {'verification_required': True, 'masked_target': otp.mask(email), 'cooldown_seconds': 0, 'state': 'NOT_CONFIGURED', 'csrfToken': set_csrf(response)}
    try:
        provider = email_provider()
        if user:
            try: result.update(otp.issue(user['id'], 'signup', email, provider))
            except HTTPException as exc:
                if exc.status_code != 429: raise
                # A retry during cooldown must not turn a rejected send into success.
                with connect() as db:
                    previous=db.execute("SELECT delivery_error FROM account_otps WHERE user_id=? AND purpose='signup'",(user['id'],)).fetchone()
                error=previous['delivery_error'] if previous else ''
                result.update(state='TEMPORARILY_UNAVAILABLE' if error else 'CONFIGURED', cooldown_seconds=settings.otp_resend_cooldown_seconds)
                if error: result['error_code']=error
        else: result.update(state='CONFIGURED', cooldown_seconds=settings.otp_resend_cooldown_seconds)
    except ProviderUnavailable as exc:
        result['state'] = exc.state
        result['error_code'] = exc.code
    return result


class Code(BaseModel):
    model_config = ConfigDict(extra='forbid')
    code: str = Field(pattern=r'^\d{6}$')


@router.get('/verification')
def verification(request: Request):
    flow=otp.pending_flow(request)
    with connect() as db:
        row = db.execute("SELECT sent_at,consumed,delivery_error FROM account_otps WHERE user_id=? AND purpose='signup'", (flow['user_id'],)).fetchone()
    from datetime import datetime
    from src.config import settings
    stamp=row['sent_at'] if row else flow['sent_at']
    remaining = max(0, settings.otp_resend_cooldown_seconds - int((now()-datetime.fromisoformat(stamp)).total_seconds())) if stamp else 0
    try: email_provider(); state = 'TEMPORARILY_UNAVAILABLE' if row and row['consumed'] else 'CONFIGURED'
    except ProviderUnavailable as exc: state = exc.state
    return {'verification_required':True, 'masked_target':otp.mask(flow['target']), 'state':state, 'cooldown_seconds':remaining, 'error_code':row['delivery_error'] if row else ''}


@router.post('/verification/resend')
def resend(request: Request):
    validate_csrf(request)
    rate_limit(request, 'resend')
    flow=otp.pending_flow(request)
    try:
        provider=email_provider()
        if flow['user_id']:
            user=otp.pending_user(request)
            return otp.issue(user['id'], 'signup', user['email'], provider)
        from datetime import datetime
        from src.config import settings
        if (now()-datetime.fromisoformat(flow['sent_at'])).total_seconds()<settings.otp_resend_cooldown_seconds: raise HTTPException(429,'verification_cooldown')
        with connect() as db: db.execute('UPDATE verification_flows SET sent_at=? WHERE digest=?',(now().isoformat(),flow['digest']))
        return {'state':'CONFIGURED','masked_target':otp.mask(flow['target']),'cooldown_seconds':settings.otp_resend_cooldown_seconds}
    except ProviderUnavailable as exc: raise HTTPException(503, exc.code) from None


@router.post('/verification/confirm')
def confirm(body: Code, request: Request, response: Response):
    validate_csrf(request)
    rate_limit(request, 'verify')
    user = otp.pending_user(request)
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        target = otp.verify(db, user['id'], 'signup', body.code)
        reason = otp.failure_reason(db,user['id'],'signup') if not target else ''
        if target:
            db.execute('UPDATE users SET email_verified=1 WHERE id=? AND email=?', (user['id'],target))
            db.execute('DELETE FROM verification_flows WHERE user_id=?', (user['id'],))
    if not target: raise HTTPException(400, reason)
    with connect() as db: user = db.execute('SELECT * FROM users WHERE id=?', (user['id'],)).fetchone()
    csrf, expiry = issue_session(response, user)
    response.delete_cookie(otp.PENDING_COOKIE, path='/', httponly=True, secure=otp.PENDING_COOKIE.startswith('__Host-'), samesite='lax')
    return {'user':safe_user(user),'expiresAt':expiry,'csrfToken':csrf}


@router.get('/verification/providers')
def availability():
    result = {}
    for name, factory in [('email', email_provider), ('sms', sms_provider)]:
        try: factory(); result[name] = 'CONFIGURED'
        except ProviderUnavailable as exc: result[name] = exc.state
    return {**result, 'google':'NOT_CONFIGURED', 'github':'NOT_CONFIGURED'}
