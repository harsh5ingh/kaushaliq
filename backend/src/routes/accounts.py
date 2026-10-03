from __future__ import annotations
import json
import secrets
import sqlite3
import re
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import TypeAdapter, ValidationError
import bcrypt
from src.routes.auth import connect, now, current_session, validate_csrf, rate_limit, safe_user, EMAIL_PATTERN
from src.accounts import store, otp, resumes
from src.accounts.models import Education, Skill, Experience, Career, Geography, Onboarding, Alerts, Name, PasswordChange, TargetChange, Watch, Analysis, ResumeConfirmation
from src.accounts.passwords import validate_password
from src.accounts.providers import email_provider, sms_provider, ProviderUnavailable
from src.accounts.verification import Code
from src.data_pipeline.repository import read_snapshot

router = APIRouter(prefix='/api/v1/me',tags=['private account'],dependencies=[Depends(current_session)])


def mutate(request, user, purpose='account'):
    validate_csrf(request)
    # Separate per-operation budget; never stores raw IP/email values.
    rate_limit(request, user['id'] + ':' + purpose)


def public_snapshot():
    try: return read_snapshot()
    except Exception: raise HTTPException(503,'catalog_unavailable') from None


def require_password(user, supplied):
    raw = supplied.encode()
    if len(raw)>72 or not bcrypt.checkpw(raw,user['password_hash']): raise HTTPException(400,'credentials_invalid')


def resume_metadata(user_id):
    with connect() as db: row=db.execute('SELECT * FROM resumes WHERE user_id=?',(user_id,)).fetchone()
    if not row: return None
    return {key:row[key] for key in ('id','filename','media_type','size','uploaded_at')} | {'candidates':json.loads(row['candidates'])}


@router.get('')
@router.get('/profile')
def profile(response: Response, session=Depends(current_session)):
    user,_=session
    response.headers['Cache-Control']='no-store'
    saved=store.sections(user['id'])
    completed=[key for key in ('education','interests','skills','career','geography') if (bool(saved[key]['qualification']) if key=='education' else bool(saved[key]['goals'] or saved[key]['note']) if key=='career' else bool(saved[key]['current'] or saved[key]['preferred'] or saved[key]['remote'] or saved[key]['relocation']) if key=='geography' else bool(saved[key]))]
    return {'user':safe_user(user),'phone_masked':otp.mask(user['phone']) if user['phone'] else None,'sections':saved,'resume':resume_metadata(user['id']),'completion':{'completed':completed,'total':5}}


@router.patch('/profile')
def name(body: Name,request: Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'profile')
    clean=body.name.strip()
    if not clean: raise HTTPException(422,'profile_invalid')
    with connect() as db:
        db.execute('UPDATE users SET name=? WHERE id=?',(clean,user['id']))
    return {'saved':True}


@router.put('/sections/{section}')
async def section_update(section: str,request: Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'section:'+section)
    raw=bytearray()
    async for chunk in request.stream():
        raw.extend(chunk)
        if len(raw)>32000: raise HTTPException(413,'profile_invalid')
    try:
        value=json.loads(raw)
        model={'education':Education,'career':Career,'geography':Geography,'onboarding':Onboarding,'alerts':Alerts}.get(section)
        if model: value=model.model_validate(value).model_dump()
        elif section=='skills':
            value=TypeAdapter(list[Skill]).validate_python(value)
            if len(value)>50: raise ValueError()
            value=[v.model_dump() for v in value]
        elif section=='experience':
            value=TypeAdapter(list[Experience]).validate_python(value)
            if len(value)>20: raise ValueError()
            value=[v.model_dump() for v in value]
        elif section=='interests':
            if not isinstance(value,list) or len(value)>30 or any(not isinstance(v,str) or not 1<=len(v)<=100 for v in value): raise ValueError()
            value=list(dict.fromkeys(value))
        else: raise ValueError()
        if section=='geography':
            snapshot,_=public_snapshot(); ids={r['region_id'] for r in snapshot['regions']}
            if (value['current'] and value['current'] not in ids) or any(v not in ids for v in value['preferred']): raise ValueError()
        if section=='skills' and any(v['canonical_id'] is not None or v['taxonomy'] is not None or not v['name'].strip() for v in value): raise ValueError()
        if section=='skills' and len({v['name'].strip().casefold() for v in value})!=len(value): raise ValueError()
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            if section in {'education','skills','experience'}:
                # Validation and write share a lock: deletion cannot resurrect provenance.
                existing=store.sections(user['id'],db)[section]
                previous=existing if isinstance(existing,list) else [existing]
                rows=value if isinstance(value,list) else [value]
                for v in rows:
                    if v['origin']=='RESUME_DERIVED' and not any(old==v for old in previous): raise ValueError()
                    if v['origin']=='SELF_REPORTED': v['resume_id']=None
            store.put_section(db,user['id'],section,value)
    except (ValueError,ValidationError,TypeError): raise HTTPException(422,'profile_invalid') from None
    return {'saved':True}


@router.get('/sessions')
def sessions(session=Depends(current_session)):
    user,_=session
    with connect() as db: rows=db.execute('SELECT jti,expires_at FROM sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>? ORDER BY expires_at DESC',(user['id'],now().isoformat())).fetchall()
    # JTI is an opaque revocation identifier, not the signed bearer cookie.
    return {'items':[{'id':r['jti'],'expires_at':r['expires_at'],'current':r['jti']==user['jti']} for r in rows]}


@router.post('/sessions/revoke-others')
def revoke_others(request: Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'sessions')
    with connect() as db: db.execute('UPDATE sessions SET revoked_at=? WHERE user_id=? AND jti<>? AND revoked_at IS NULL',(now().isoformat(),user['id'],user['jti']))
    return {'saved':True}


@router.delete('/sessions/{identifier}')
def revoke(identifier:str,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'sessions')
    if identifier==user['jti']: raise HTTPException(422,'use_signout')
    with connect() as db:
        result=db.execute('UPDATE sessions SET revoked_at=? WHERE user_id=? AND jti=? AND revoked_at IS NULL',(now().isoformat(),user['id'],identifier))
        if not result.rowcount: raise HTTPException(404,'not_found')
    return {'saved':True}


@router.post('/change-password')
def change_password(body: PasswordChange,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'password'); require_password(user,body.current_password); validate_password(body.new_password)
    encoded=bcrypt.hashpw(body.new_password.encode(),bcrypt.gensalt(rounds=12))
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        db.execute('UPDATE users SET password_hash=? WHERE id=?',(encoded,user['id']))
        db.execute('UPDATE sessions SET revoked_at=? WHERE user_id=? AND jti<>?',(now().isoformat(),user['id'],user['jti']))
    return {'saved':True}


@router.post('/change-{purpose}')
def change_target(purpose:str,body:TargetChange,request:Request,session=Depends(current_session)):
    if purpose not in {'email','phone'}: raise HTTPException(404,'not_found')
    user,_=session; mutate(request,user,purpose); require_password(user,body.current_password)
    target=body.target.strip().casefold() if purpose=='email' else body.target.strip()
    if not (EMAIL_PATTERN.fullmatch(target) if purpose=='email' else re.fullmatch(r'\+[1-9]\d{7,14}',target)): raise HTTPException(422,'target_invalid')
    try: return otp.issue(user['id'],purpose,target,email_provider() if purpose=='email' else sms_provider())
    except ProviderUnavailable as exc: raise HTTPException(503,purpose+'_'+exc.state.lower()) from None


@router.post('/verify-{purpose}')
def verify_target(purpose:str,body:Code,request:Request,session=Depends(current_session)):
    if purpose not in {'email','phone'}: raise HTTPException(404,'not_found')
    user,_=session; mutate(request,user,'verify:'+purpose)
    conflict=False
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        target=otp.verify(db,user['id'],purpose,body.code)
        if target:
            if purpose=='email':
                conflict=bool(db.execute('SELECT id FROM users WHERE email=? AND id<>?',(target,user['id'])).fetchone())
                if not conflict: db.execute('UPDATE users SET email=? WHERE id=?',(target,user['id']))
            else: db.execute('UPDATE users SET phone=? WHERE id=?',(target,user['id']))
            if not conflict: db.execute('UPDATE sessions SET revoked_at=? WHERE user_id=? AND jti<>?',(now().isoformat(),user['id'],user['jti']))
    if not target or conflict: raise HTTPException(400,'verification_invalid')
    if purpose=='email':
        try: email_provider().send(user['email'],'KaushalIQ account security','Your account email was changed. If this was not you, contact support immediately.')
        except ProviderUnavailable: pass  # Verification already committed; do not misreport it as failed.
    return {'saved':True}


@router.get('/connected-accounts')
def connections():
    return {'items':[{'provider':p,'state':'NOT_CONFIGURED','connected':False} for p in ['google','github']]}


@router.post('/connected-accounts/{provider}')
@router.delete('/connected-accounts/{provider}')
def connect_provider(provider:str,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'provider')
    if provider not in {'google','github'}: raise HTTPException(404,'not_found')
    raise HTTPException(503,'oauth_not_configured')


@router.get('/watchlist')
def watchlist(session=Depends(current_session)):
    user,_=session
    snapshot,_=public_snapshot()
    lookup={kind:{v[{'regions':'region_id','industries':'industry_id','skills':'skill_id','occupations':'occupation_id'}[kind]]:v['name'] for v in snapshot[kind]} for kind in ['regions','industries','skills','occupations']}
    with connect() as db: rows=db.execute('SELECT * FROM watchlist WHERE user_id=? ORDER BY created_at DESC',(user['id'],)).fetchall()
    return {'items':[dict(r)|{'name':lookup[r['kind']].get(r['entity_id'],r['entity_id']),'available':r['entity_id'] in lookup[r['kind']]} for r in rows]}


@router.post('/watchlist',status_code=201)
def follow(body:Watch,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'watchlist'); snapshot,_=public_snapshot()
    field={'regions':'region_id','industries':'industry_id','skills':'skill_id','occupations':'occupation_id'}[body.kind]
    if not any(r[field]==body.entity_id for r in snapshot[body.kind]): raise HTTPException(422,'entity_unavailable')
    with connect() as db:
        if db.execute('SELECT COUNT(*) FROM watchlist WHERE user_id=?',(user['id'],)).fetchone()[0]>=200: raise HTTPException(422,'limit_reached')
        db.execute('INSERT OR IGNORE INTO watchlist VALUES(?,?,?,?,?)',(secrets.token_hex(16),user['id'],body.kind,body.entity_id,now().isoformat()))
    return {'saved':True}


@router.delete('/watchlist/{identifier}')
def unfollow(identifier:str,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'watchlist')
    with connect() as db:
        result=db.execute('DELETE FROM watchlist WHERE id=? AND user_id=?',(identifier,user['id']))
        if not result.rowcount: raise HTTPException(404,'not_found')
    return {'saved':True}


@router.get('/reports')
def reports(session=Depends(current_session)):
    user,_=session; _,version=public_snapshot()
    with connect() as db: rows=db.execute('SELECT * FROM saved_analyses WHERE user_id=? ORDER BY created_at DESC',(user['id'],)).fetchall()
    return {'items':[dict(r)|{'query':json.loads(r['query']),'updated_data':r['source_version']!=version} for r in rows]}


@router.post('/reports',status_code=201)
def save_analysis(body:Analysis,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'reports'); snapshot,version=public_snapshot()
    allowed={'region_id','period','sex','sector','activity_status','indicator','view'}
    if not set(body.query)<=allowed or any(len(v)>120 for v in body.query.values()): raise HTTPException(422,'analysis_invalid')
    if 'region_id' in body.query and body.query['region_id'] not in {r['region_id'] for r in snapshot['regions']}: raise HTTPException(422,'analysis_invalid')
    with connect() as db:
        if db.execute('SELECT COUNT(*) FROM saved_analyses WHERE user_id=?',(user['id'],)).fetchone()[0]>=100: raise HTTPException(422,'limit_reached')
        db.execute('INSERT INTO saved_analyses VALUES(?,?,?,?,?,?,?)',(secrets.token_hex(16),user['id'],body.title,body.route,json.dumps(body.query),version,now().isoformat()))
    return {'saved':True}


@router.delete('/reports/{identifier}')
def delete_analysis(identifier:str,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'reports')
    with connect() as db:
        result=db.execute('DELETE FROM saved_analyses WHERE id=? AND user_id=?',(identifier,user['id']))
        if not result.rowcount: raise HTTPException(404,'not_found')
    return {'saved':True}


def remove_resume(db,user_id):
    row=db.execute('SELECT id FROM resumes WHERE user_id=?',(user_id,)).fetchone()
    if not row: return None
    saved=store.sections(user_id,db)
    for key in ['skills','experience']:
        store.put_section(db,user_id,key,[v for v in saved[key] if v.get('resume_id')!=row['id']])
    if saved['education'].get('resume_id')==row['id']: store.put_section(db,user_id,'education',store.DEFAULTS['education'])
    db.execute('DELETE FROM resumes WHERE user_id=?',(user_id,))
    return resumes.file_path(row['id'])


@router.get('/resume')
def resume_info(session=Depends(current_session)):
    return {'resume':resume_metadata(session[0]['id'])}


@router.get('/resume/download')
def download(session=Depends(current_session)):
    row=resume_metadata(session[0]['id'])
    if not row or not resumes.file_path(row['id']).exists(): raise HTTPException(404,'not_found')
    return FileResponse(resumes.file_path(row['id']),filename=row['filename'],media_type=row['media_type'],headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})


@router.post('/resume',status_code=201)
async def upload(request:Request,session=Depends(current_session)):
    from src.config import settings
    user,_=session; mutate(request,user,'resume')
    data=bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data)>settings.resume_max_bytes: raise HTTPException(413,'resume_too_large')
    media=request.headers.get('content-type','').split(';')[0]
    from starlette.concurrency import run_in_threadpool
    candidates=await run_in_threadpool(resumes.extract_isolated,bytes(data),media)
    from urllib.parse import unquote
    name=unquote(request.headers.get('x-file-name','resume')).replace('\\','/').split('/')[-1]
    name=re.sub(r'[\x00-\x1f\x7f]','',name)[:150] or 'resume'
    suffix='.pdf' if media=='application/pdf' else '.docx'
    if not name.lower().endswith(suffix): name='resume'+suffix
    identifier=secrets.token_hex(16); path=resumes.file_path(identifier)
    try:
        path.write_bytes(data)
        with connect() as db:
            db.execute('BEGIN IMMEDIATE'); old_path = remove_resume(db,user['id'])
            db.execute('INSERT INTO resumes VALUES(?,?,?,?,?,?,?)',(user['id'],identifier,name,media,len(data),now().isoformat(),json.dumps(candidates)))
    except Exception:
        path.unlink(missing_ok=True); raise
    if old_path: old_path.unlink(missing_ok=True)
    return {'resume':resume_metadata(user['id'])}


@router.post('/resume/confirm')
def confirm_resume(body:ResumeConfirmation,request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'resume-confirm')
    if any(not v.strip() or len(v)>100 for v in body.skills) or any(not v.strip() or len(v)>120 for v in body.experience): raise HTTPException(422,'profile_invalid')
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        row=db.execute('SELECT id FROM resumes WHERE user_id=?',(user['id'],)).fetchone()
        if not row or row['id']!=body.resume_id: raise HTTPException(404,'not_found')
        saved=store.sections(user['id'],db)
        skills=saved['skills'].copy(); names={s['name'].casefold() for s in skills}
        for value in body.skills:
            clean=value.strip()
            if clean.casefold() not in names:
                skills.append({'name':clean,'canonical_id':None,'taxonomy':None,'proficiency':'','origin':'RESUME_DERIVED','resume_id':row['id']})
                names.add(clean.casefold())
        if len(skills)>50: raise HTTPException(422,'limit_reached')
        store.put_section(db,user['id'],'skills',skills)
        experience=saved['experience'].copy(); existing_names={v['name'].casefold() for v in experience}
        for value in body.experience:
            clean=value.strip()
            if clean.casefold() not in existing_names:
                experience.append({'name':clean,'origin':'RESUME_DERIVED','resume_id':row['id']})
                existing_names.add(clean.casefold())
        if len(experience)>20: raise HTTPException(422,'limit_reached')
        store.put_section(db,user['id'],'experience',experience)
        if body.degree.strip(): store.put_section(db,user['id'],'education',{'qualification':'other','degree':body.degree.strip(),'field':'','year':None,'origin':'RESUME_DERIVED','resume_id':row['id']})
    return {'saved':True}


@router.delete('/resume')
def delete_resume(request:Request,session=Depends(current_session)):
    user,_=session; mutate(request,user,'resume-delete')
    with connect() as db:
        db.execute('BEGIN IMMEDIATE'); old_path = remove_resume(db,user['id'])
    if old_path: old_path.unlink(missing_ok=True)
    return {'saved':True}
