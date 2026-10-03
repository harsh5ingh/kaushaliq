"""Owner-scoped revocation using the existing tracked JWT/session store."""
from fastapi import HTTPException
from src.routes.auth import connect, now


def revoke_account_sessions(user, *, keep_current: bool) -> int:
    timestamp = now().isoformat()
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        # Revalidate after acquiring the write lock; a concurrent logout cannot be revived.
        current = db.execute('''SELECT 1 FROM sessions WHERE jti=? AND user_id=?
          AND revoked_at IS NULL AND expires_at>?''', (user['jti'], user['id'], timestamp)).fetchone()
        if not current:
            raise HTTPException(401, 'Authentication required.')
        query = 'UPDATE sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL AND expires_at>?'
        values = [timestamp, user['id'], timestamp]
        if keep_current:
            query += ' AND jti<>?'
            values.append(user['jti'])
        return db.execute(query, values).rowcount
