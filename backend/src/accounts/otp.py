import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, Response, Request
from src.config import settings
from src.routes.auth import connect, now
from src.accounts.providers import ProviderUnavailable, ProviderResult
from src.accounts.diagnostics import event

PENDING_COOKIE = '__Host-kaushaliq_pending' if settings.environment.lower() == 'production' else 'kaushaliq_pending'


def digest(value):
    return hmac.new(settings.jwt_secret.encode(), value.encode(), hashlib.sha256).hexdigest()


def issue_flow(response: Response, user_id: str | None, target: str):
    token = secrets.token_urlsafe(32)
    with connect() as db:
        db.execute('DELETE FROM verification_flows WHERE expires_at<?', (now().isoformat(),))
        db.execute('INSERT INTO verification_flows(digest,user_id,expires_at,target,sent_at) VALUES(?,?,?,?,?)', (digest(token), user_id, (now()+timedelta(hours=1)).isoformat(),target,now().isoformat()))
    response.set_cookie(PENDING_COOKIE, token, httponly=True, secure=settings.environment.lower()=='production', samesite='lax', path='/', max_age=3600)


def pending_flow(request: Request):
    with connect() as db:
        row=db.execute('SELECT * FROM verification_flows WHERE digest=? AND expires_at>?',(digest(request.cookies.get(PENDING_COOKIE,'')),now().isoformat())).fetchone()
    if not row: raise HTTPException(400,'verification_invalid')
    return row


def pending_user(request: Request):
    with connect() as db:
        row = db.execute('SELECT users.* FROM verification_flows JOIN users ON users.id=verification_flows.user_id WHERE digest=? AND expires_at>?', (digest(request.cookies.get(PENDING_COOKIE, '')), now().isoformat())).fetchone()
    if not row: raise HTTPException(400, 'verification_invalid')
    return row


def mask(target):
    if '@' in target:
        left, right = target.split('@', 1)
        return left[:1] + '***@' + right
    return '••••' + target[-4:]


def issue(user_id, purpose, target, provider):
    # Reserve cooldown before network work. Provider failures invalidate this code.
    stamp = now()
    code = f'{secrets.randbelow(1000000):06d}'
    event('otp_generated', purpose=purpose)
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        old = db.execute('SELECT * FROM account_otps WHERE user_id=? AND purpose=?', (user_id,purpose)).fetchone()
        if old and (stamp-datetime.fromisoformat(old['sent_at'])).total_seconds() < settings.otp_resend_cooldown_seconds:
            raise HTTPException(429, 'verification_cooldown')
        db.execute("INSERT OR REPLACE INTO account_otps(user_id,purpose,target,digest,expires_at,sent_at,attempts,consumed,delivery_error) VALUES(?,?,?,?,?,?,0,0,'')", (user_id,purpose,target,digest(f'{user_id}:{purpose}:{target}:{code}'), (stamp+timedelta(minutes=settings.otp_expiry_minutes)).isoformat(), stamp.isoformat()))
    event('otp_persisted', purpose=purpose)
    provider_name = settings.sms_provider.lower() if purpose == 'phone' else settings.email_provider.lower()
    domain = target.rsplit('@',1)[-1] if '@' in target else 'private_phone'
    event('email_verification_send_started', provider=provider_name, recipient_domain=domain, purpose=purpose)
    try:
        if purpose == 'phone': result = provider.send(target, f'KaushalIQ verification code: {code}. Expires in {settings.otp_expiry_minutes} minutes. Never share this code.')
        else: result = provider.send(target, 'KaushalIQ verification code', f'Your verification code is {code}. It expires in {settings.otp_expiry_minutes} minutes. Never share this code.\n\nआपका सत्यापन कोड {code} है। इसे किसी से साझा न करें।')
        if not isinstance(result, ProviderResult) or result.status != 'accepted':
            raise ProviderUnavailable(result=result if isinstance(result, ProviderResult) else None)
        event('email_verification_send', provider=provider_name, recipient_domain=domain, purpose=purpose, status=result.status, provider_message_id=result.message_id)
    except ProviderUnavailable as exc:
        event('email_verification_send', provider=provider_name, recipient_domain=domain, purpose=purpose, status=exc.result.status, error_code=exc.result.error_code)
        with connect() as db:
            db.execute('UPDATE account_otps SET consumed=1,delivery_error=? WHERE user_id=? AND purpose=? AND digest=?', (exc.code,user_id,purpose,digest(f'{user_id}:{purpose}:{target}:{code}')))
        raise
    return {'state':'CONFIGURED','provider_status':'accepted','masked_target':mask(target), 'cooldown_seconds':settings.otp_resend_cooldown_seconds}


def verify(db, user_id, purpose, code):
    """Caller holds BEGIN IMMEDIATE; consumption and account update commit together."""
    event('otp_verification_attempt', purpose=purpose)
    row = db.execute('SELECT * FROM account_otps WHERE user_id=? AND purpose=?', (user_id,purpose)).fetchone()
    if not row or row['consumed'] or datetime.fromisoformat(row['expires_at']) <= now() or row['attempts'] >= settings.otp_max_attempts:
        event('otp_verification_result', purpose=purpose, status='failed')
        return None
    db.execute('UPDATE account_otps SET attempts=attempts+1 WHERE user_id=? AND purpose=?', (user_id,purpose))
    if not hmac.compare_digest(row['digest'], digest(f"{user_id}:{purpose}:{row['target']}:{code}")):
        event('otp_verification_result', purpose=purpose, status='failed')
        return None
    db.execute('UPDATE account_otps SET consumed=1 WHERE user_id=? AND purpose=?', (user_id,purpose))
    event('otp_verification_result', purpose=purpose, status='succeeded')
    return row['target']


def failure_reason(db, user_id, purpose):
    row=db.execute('SELECT * FROM account_otps WHERE user_id=? AND purpose=?',(user_id,purpose)).fetchone()
    if row and row['attempts'] >= settings.otp_max_attempts: return 'verification_max_attempts'
    if row and datetime.fromisoformat(row['expires_at']) <= now(): return 'verification_expired'
    return 'verification_invalid'
