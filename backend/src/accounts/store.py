import json
from src.routes.auth import connect, now


def migrate():
    with connect() as db:
        columns = {row[1] for row in db.execute('PRAGMA table_info(users)')}
        if 'email_verified' not in columns:
            # Earlier accounts had no proof of ownership. Never mark them verified retroactively.
            db.execute('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0')
        if 'phone' not in columns:
            db.execute('ALTER TABLE users ADD COLUMN phone TEXT')
        db.executescript('''
        CREATE TABLE IF NOT EXISTS profile_sections (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          section TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL,
          PRIMARY KEY(user_id,section));
        CREATE TABLE IF NOT EXISTS account_otps (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          purpose TEXT NOT NULL, target TEXT NOT NULL, digest TEXT NOT NULL,
          expires_at TEXT NOT NULL, sent_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
          consumed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,purpose));
        CREATE TABLE IF NOT EXISTS verification_flows (
          digest TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS resumes (
          user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          id TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, media_type TEXT NOT NULL,
          size INTEGER NOT NULL, uploaded_at TEXT NOT NULL, candidates TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS watchlist (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          kind TEXT NOT NULL, entity_id TEXT NOT NULL, created_at TEXT NOT NULL,
          UNIQUE(user_id,kind,entity_id));
        CREATE INDEX IF NOT EXISTS idx_watchlist_owner ON watchlist(user_id);
        CREATE TABLE IF NOT EXISTS saved_analyses (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL, route TEXT NOT NULL, query TEXT NOT NULL,
          source_version TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_analyses_owner ON saved_analyses(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_verification_expiry ON verification_flows(expires_at);
        ''')
        flow_columns={row[1] for row in db.execute('PRAGMA table_info(verification_flows)')}
        if 'target' not in flow_columns: db.execute("ALTER TABLE verification_flows ADD COLUMN target TEXT NOT NULL DEFAULT ''")
        if 'sent_at' not in flow_columns: db.execute("ALTER TABLE verification_flows ADD COLUMN sent_at TEXT NOT NULL DEFAULT ''")


DEFAULTS = {
    'education': {'qualification': '', 'degree': '', 'field': '', 'year': None, 'origin': 'SELF_REPORTED', 'resume_id': None},
    'interests': [], 'skills': [], 'experience': [],
    'career': {'goals': [], 'note': ''},
    'geography': {'current': None, 'preferred': [], 'relocation': False, 'remote': False},
    'onboarding': {'step': 0, 'status': 'not_started'},
    'alerts': {'email': False, 'skills': False, 'occupations': False, 'regions': False, 'datasets': False, 'reports': False},
}


def sections(user_id, db=None):
    if db is None:
        with connect() as connection:
            return sections(user_id, connection)
    result = json.loads(json.dumps(DEFAULTS))
    for row in db.execute('SELECT section,payload FROM profile_sections WHERE user_id=?', (user_id,)):
        result[row['section']] = json.loads(row['payload'])
    return result


def put_section(db, user_id, section, payload):
    db.execute('''INSERT INTO profile_sections VALUES(?,?,?,?)
       ON CONFLICT(user_id,section) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at''',
       (user_id, section, json.dumps(payload, ensure_ascii=False), now().isoformat()))


migrate()
