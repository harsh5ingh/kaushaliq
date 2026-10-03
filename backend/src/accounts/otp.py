import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, Response, Request
from src.config import settings
from src.routes.auth import connect, now
from src.accounts.providers import email_provider, sms_provider, ProviderUnavailable

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
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        old = db.execute('SELECT * FROM account_otps WHERE user_id=? AND purpose=?', (user_id,purpose)).fetchone()
        if old and (stamp-datetime.fromisoformat(old['sent_at'])).total_seconds() < settings.otp_resend_cooldown_seconds:
            raise HTTPException(429, 'verification_cooldown')
        db.execute('INSERT OR REPLACE INTO account_otps VALUES(?,?,?,?,?,?,0,0)', (user_id,purpose,target,digest(f'{user_id}:{purpose}:{target}:{code}'), (stamp+timedelta(minutes=settings.otp_expiry_minutes)).isoformat(), stamp.isoformat()))
    try:
        if purpose == 'phone': provider.send(target, f'KaushalIQ verification code: {code}. Expires in {settings.otp_expiry_minutes} minutes. Never share this code.')
        else: provider.send(target, 'KaushalIQ verification code', f'Your verification code is {code}. It expires in {settings.otp_expiry_minutes} minutes. Never share this code.\n\nआपका सत्यापन कोड {code} है। इसे किसी से साझा न करें।')
    except ProviderUnavailable:
        with connect() as db:
            db.execute('UPDATE account_otps SET consumed=1 WHERE user_id=? AND purpose=? AND digest=?', (user_id,purpose,digest(f'{user_id}:{purpose}:{target}:{code}')))
        raise
    return {'state':'CONFIGURED','masked_target':mask(target), 'cooldown_seconds':settings.otp_resend_cooldown_seconds}


def verify(db, user_id, purpose, code):
    """Caller holds BEGIN IMMEDIATE; consumption and account update commit together."""
    row = db.execute('SELECT * FROM account_otps WHERE user_id=? AND purpose=?', (user_id,purpose)).fetchone()
    if not row or row['consumed'] or datetime.fromisoformat(row['expires_at']) <= now() or row['attempts'] >= settings.otp_max_attempts:
        return None
    db.execute('UPDATE account_otps SET attempts=attempts+1 WHERE user_id=? AND purpose=?', (user_id,purpose))
    if not hmac.compare_digest(row['digest'], digest(f"{user_id}:{purpose}:{row['target']}:{code}")):
        return None
    db.execute('UPDATE account_otps SET consumed=1 WHERE user_id=? AND purpose=?', (user_id,purpose))
    return row['target']
