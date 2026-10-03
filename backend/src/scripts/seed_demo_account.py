"""Manual development bootstrap, preserving edited profiles on repeated runs."""
import argparse
import json
import secrets
import bcrypt
from src.config import settings
from src.accounts import store
from src.accounts.demo import allowed
from src.accounts.passwords import validate_password
from src.routes.auth import connect, now, EMAIL_PATTERN
from src.data_pipeline.repository import read_snapshot


def seed(reset_password=False):
    if not allowed(): raise ValueError('Demo seeding requires development and explicit DEMO_ACCOUNT_ENABLED=true.')
    email=settings.demo_account_email.strip().casefold()
    if not EMAIL_PATTERN.fullmatch(email) or not email.endswith('@kaushaliq.local'):
        raise ValueError('Use a synthetic @kaushaliq.local demo address.')
    validate_password(settings.demo_account_password)
    snapshot,version=read_snapshot()
    region='in-karnataka'
    if region not in {r['region_id'] for r in snapshot['regions']}: raise ValueError('Required canonical region is unavailable.')
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        existing=db.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
        if existing:
            if not existing['is_demo']: raise ValueError('Refusing to convert an existing normal account into a demo account.')
            if reset_password:
                db.execute('UPDATE users SET password_hash=? WHERE id=?',(bcrypt.hashpw(settings.demo_account_password.encode(),bcrypt.gensalt(rounds=12)),existing['id']))
                db.execute('UPDATE sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL',(now().isoformat(),existing['id']))
            return 'password_reset' if reset_password else 'already_seeded'
        identifier=secrets.token_urlsafe(18)
        db.execute('INSERT INTO users(id,name,email,password_hash,created_at,email_verified,is_demo) VALUES(?,?,?,?,?,1,1)',(identifier,'KaushalIQ Demo',email,bcrypt.hashpw(settings.demo_account_password.encode(),bcrypt.gensalt(rounds=12)),now().isoformat()))
        values={
          'education':{'qualification':'undergraduate','degree':'','field':'','year':None,'origin':'SELF_REPORTED','resume_id':None},
          'interests':['technology','ai'],
          'skills':[{'name':name,'proficiency':'intermediate','origin':'SELF_REPORTED','resume_id':None,'canonical_id':None,'taxonomy':None} for name in ['Python','React','FastAPI']],
          'career':{'goals':['job','upskill'],'note':'Synthetic local demo preferences'},
          'geography':{'current':region,'preferred':[region],'relocation':False,'remote':True},
          'onboarding':{'step':0,'status':'in_progress'},
        }
        for section,payload in values.items(): store.put_section(db,identifier,section,payload)
        db.execute('INSERT INTO watchlist VALUES(?,?,?,?,?)',(secrets.token_hex(16),identifier,'regions',region,now().isoformat()))
        db.execute('INSERT INTO saved_analyses VALUES(?,?,?,?,?,?,?)',(secrets.token_hex(16),identifier,'Local demo · verified India labour indicators','/intelligence',json.dumps({'region_id':'in','period':'2023-24'}),version,now().isoformat()))
    return 'created'


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reset-password',action='store_true',help='Explicitly reset only the demo password and revoke its sessions.')
    args=parser.parse_args()
    try: result=seed(args.reset_password)
    except Exception: parser.exit(1,'Demo seed refused. Check development/enable flags, synthetic email, password policy and canonical publication.\n')
    print('Demo account: '+result+'. Credentials remain in local environment configuration.')


if __name__=='__main__': main()
