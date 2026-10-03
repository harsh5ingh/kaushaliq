import asyncio
import io
import json
import re
import unittest
from http.cookies import SimpleCookie
from tempfile import TemporaryDirectory
from unittest.mock import patch
from datetime import timedelta
from pathlib import Path
from pypdf import PdfWriter
from src.main import app
from src.config import settings
from src.routes import auth
from src.accounts import store, otp, verification
from src.routes import accounts


class Client:
    """Minimal ASGI harness: real routing/dependencies/cookies, no extra runtime library."""
    def __init__(self): self.cookies={}; self.csrf=''
    def request(self,method,path,body=None,raw=None,headers=None):
        async def call():
            data=raw if raw is not None else json.dumps(body).encode() if body is not None else b''
            sent=[]; received=False
            async def receive():
                nonlocal received
                if not received: received=True; return {'type':'http.request','body':data,'more_body':False}
                return {'type':'http.disconnect'}
            async def send(message): sent.append(message)
            hdr={'host':'testserver','origin':settings.frontend_url,'cookie':'; '.join(f'{k}={v}' for k,v in self.cookies.items()),'content-type':'application/json','x-csrf-token':self.csrf,**(headers or {})}
            await app({'type':'http','asgi':{'version':'3.0'},'http_version':'1.1','method':method,'scheme':'http','path':path.split('?')[0],'raw_path':path.encode(),'query_string':path.partition('?')[2].encode(),'root_path':'','headers':[(k.encode(),v.encode()) for k,v in hdr.items()],'client':('127.0.0.1',1234),'server':('testserver',80)},receive,send)
            start=next(m for m in sent if m['type']=='http.response.start')
            self.last_headers=dict(start['headers'])
            for key,value in start['headers']:
                if key==b'set-cookie':
                    cookie=SimpleCookie();cookie.load(value.decode())
                    for name,item in cookie.items():
                        if item['max-age']=='0': self.cookies.pop(name,None)
                        else:self.cookies[name]=item.value
            payload=b''.join(m.get('body',b'') for m in sent if m['type']=='http.response.body')
            try: value=json.loads(payload)
            except ValueError:value=payload
            if isinstance(value,dict) and value.get('csrfToken'):self.csrf=value['csrfToken']
            return start['status'],value
        return asyncio.run(call())


class AccountTests(unittest.TestCase):
    def setUp(self):
        self.temp=TemporaryDirectory();self.previous=(settings.auth_database_path,settings.resume_storage_path)
        settings.auth_database_path=str(Path(self.temp.name)/'auth.sqlite3');settings.resume_storage_path=str(Path(self.temp.name)/'resumes')
        auth.initialize_database();store.migrate();self.codes={};self.deliveries=[]
        outer=self
        class Capture:
            def send(self,target,*args):
                text=args[-1];match=re.search(r'\b\d{6}\b',text)
                if match:outer.codes[target]=match[0]
                outer.deliveries.append(target)
                from src.accounts.providers import ProviderResult
                return ProviderResult('accepted')
        self.patches=[patch.object(verification,'email_provider',return_value=Capture()),patch.object(accounts,'email_provider',return_value=Capture()),patch.object(accounts,'sms_provider',return_value=Capture())]
        for p in self.patches:p.start()
        self.a=self.register('a@example.in');self.b=self.register('b@example.in')
    def tearDown(self):
        for p in self.patches:p.stop()
        settings.auth_database_path,settings.resume_storage_path=self.previous;self.temp.cleanup()
    def register(self,email,verify=True):
        client=Client();client.request('GET','/api/auth/csrf')
        status,result=client.request('POST','/api/auth/register',{'name':'Test User','email':email,'password':'ValidPass9!'})
        self.assertEqual(status,201);self.assertNotIn('code',result);self.assertNotIn(auth.COOKIE_NAME,client.cookies)
        if verify:self.assertEqual(client.request('POST','/api/auth/verification/confirm',{'code':self.codes[email]})[0],200)
        return client
    def test_public_and_private_boundary(self):
        anonymous=Client();self.assertEqual(anonymous.request('GET','/api/v1/catalog')[0],200);self.assertEqual(anonymous.request('GET','/api/v1/me')[0],401)
    def test_profile_sections_persistence_and_isolation(self):
        cases={'education':{'qualification':'graduate','degree':'BSc','field':'Math','year':2022},'interests':['data','technology'],'skills':[{'name':'Python','proficiency':'intermediate'}],'career':{'goals':['upskill'],'note':'Learn'},'geography':{'current':'in-karnataka','preferred':['in'],'remote':True},'onboarding':{'step':3,'status':'in_progress'},'alerts':{'datasets':True}}
        for key,value in cases.items():self.assertEqual(self.a.request('PUT','/api/v1/me/sections/'+key,value)[0],200,key)
        a=self.a.request('GET','/api/v1/me')[1];b=self.b.request('GET','/api/v1/me')[1]
        self.assertEqual(a['sections']['skills'][0]['origin'],'SELF_REPORTED');self.assertEqual(b['sections']['skills'],[]);self.assertEqual(a['completion']['completed'],['education','interests','skills','career','geography'])
        self.assertEqual(self.a.request('PATCH','/api/v1/me/profile',{'name':'Updated'})[0],200)
        self.assertEqual(self.a.request('GET','/api/v1/me')[1]['user']['name'],'Updated')
        self.assertEqual(self.a.request('PUT','/api/v1/me/sections/skills',[{'name':'Fake','origin':'VERIFIED'}])[0],422)
        self.assertEqual(self.a.request('PUT','/api/v1/me/sections/geography',{'current':'fake-city'})[0],422)
    def test_csrf_and_user_id_injection(self):
        self.assertEqual(self.a.request('PATCH','/api/v1/me/profile',{'name':'X'},headers={'x-csrf-token':''})[0],403)
        self.assertEqual(self.a.request('PATCH','/api/v1/me/profile',{'name':'X','user_id':'someone'})[0],422)
        self.assertEqual(self.a.request('PATCH','/api/v1/me/profile',{'name':'X'},headers={'origin':'https://evil.example'})[0],403)
    def test_otp_hash_one_use_and_expiry(self):
        pending=self.register('pending@example.in',False);code=self.codes['pending@example.in']
        with auth.connect() as db:
            row=db.execute("SELECT account_otps.* FROM account_otps JOIN users ON users.id=user_id WHERE email='pending@example.in'").fetchone()
            self.assertNotEqual(row['digest'],code);self.assertEqual(len(row['digest']),64)
        self.assertEqual(pending.request('POST','/api/auth/verification/resend')[0],429)
        self.assertEqual(pending.request('POST','/api/auth/verification/confirm',{'code':code})[0],200)
        self.assertEqual(pending.request('POST','/api/auth/verification/confirm',{'code':code})[0],400)
        expired=self.register('expired@example.in',False)
        with auth.connect() as db:db.execute("UPDATE account_otps SET expires_at=? WHERE user_id=(SELECT id FROM users WHERE email='expired@example.in')",((auth.now()-timedelta(seconds=1)).isoformat(),))
        self.assertEqual(expired.request('POST','/api/auth/verification/confirm',{'code':self.codes['expired@example.in']})[0],400)
    def test_otp_attempt_limit(self):
        client=self.register('attempt@example.in',False)
        for _ in range(settings.otp_max_attempts):self.assertEqual(client.request('POST','/api/auth/verification/confirm',{'code':'999999' if self.codes['attempt@example.in']!='999999' else '000000'})[0],400)
        self.assertEqual(client.request('POST','/api/auth/verification/confirm',{'code':self.codes['attempt@example.in']})[0],400)
    def test_missing_provider_and_failed_delivery_never_authenticates(self):
        from src.accounts.providers import ProviderUnavailable
        with patch.object(verification,'email_provider',side_effect=ProviderUnavailable('NOT_CONFIGURED')):
            c=Client();c.request('GET','/api/auth/csrf');status,payload=c.request('POST','/api/auth/register',{'name':'N','email':'no@example.in','password':'ValidPass9!'})
        self.assertEqual(payload['state'],'NOT_CONFIGURED');self.assertNotIn(auth.COOKIE_NAME,c.cookies);self.assertFalse(c.request('GET','/api/auth/session')[1]['authenticated'])
    def test_email_phone_changes_only_after_verification(self):
        self.assertEqual(self.a.request('POST','/api/v1/me/change-email',{'target':'new@example.in','current_password':'ValidPass9!'})[0],200)
        self.assertEqual(self.a.request('GET','/api/v1/me')[1]['user']['email'],'a@example.in')
        self.assertEqual(self.a.request('POST','/api/v1/me/verify-email',{'code':self.codes['new@example.in']})[0],200)
        self.assertEqual(self.a.request('GET','/api/v1/me')[1]['user']['email'],'new@example.in')
        self.assertEqual(self.a.request('POST','/api/v1/me/change-phone',{'target':'+919876543210','current_password':'ValidPass9!'})[0],200)
        self.assertIsNone(self.a.request('GET','/api/v1/me')[1]['phone_masked'])
        self.assertEqual(self.a.request('POST','/api/v1/me/verify-phone',{'code':self.codes['+919876543210']})[0],200)
        self.assertEqual(self.a.request('GET','/api/v1/me')[1]['phone_masked'],'••••3210')
    def test_password_policy_change_and_session_revocation(self):
        from src.accounts.passwords import validate_password
        from fastapi import HTTPException
        for value in ['short9!','lowercase9!','UPPERCASE9!','NoNumbers!','NoSpecial9']:
            with self.assertRaises(HTTPException):validate_password(value)
        other=Client();other.request('GET','/api/auth/csrf');self.assertEqual(other.request('POST','/api/auth/login',{'email':'a@example.in','password':'ValidPass9!'})[0],200)
        self.assertEqual(self.a.request('POST','/api/v1/me/change-password',{'current_password':'wrong','new_password':'NewValidPass9!'})[0],400)
        self.assertEqual(self.a.request('POST','/api/v1/me/change-password',{'current_password':'ValidPass9!','new_password':'NewValidPass9!'})[0],200)
        self.assertFalse(other.request('GET','/api/auth/session')[1]['authenticated']);self.assertTrue(self.a.request('GET','/api/auth/session')[1]['authenticated'])
        with auth.connect() as db:
            stored=db.execute("SELECT password_hash FROM users WHERE email='a@example.in'").fetchone()[0]
            self.assertTrue(bytes(stored).startswith(b'$2b$12$'))
    def test_session_isolation_and_logout(self):
        target=self.b.request('GET','/api/v1/me/sessions')[1]['items'][0]['id']
        self.assertEqual(self.a.request('DELETE','/api/v1/me/sessions/'+target)[0],404)
        self.assertEqual(self.a.request('POST','/api/v1/me/sessions/revoke-others')[0],200)
        self.assertEqual(self.a.request('POST','/api/auth/logout')[0],200);self.assertEqual(self.a.request('GET','/api/v1/me')[0],401)
    def test_watchlist_reports_ownership_and_catalogue_validation(self):
        self.assertEqual(self.a.request('POST','/api/v1/me/watchlist',{'kind':'regions','entity_id':'in-karnataka'})[0],201)
        self.assertEqual(self.a.request('POST','/api/v1/me/watchlist',{'kind':'skills','entity_id':'Python'})[0],422)
        item=self.a.request('GET','/api/v1/me/watchlist')[1]['items'][0]
        self.assertEqual(self.b.request('DELETE','/api/v1/me/watchlist/'+item['id'])[0],404)
        self.assertEqual(self.b.request('GET','/api/v1/me/watchlist')[1]['items'],[])
        self.assertEqual(self.a.request('POST','/api/v1/me/reports',{'title':'National','route':'/intelligence','query':{'region_id':'in','period':'2023-24'}})[0],201)
        report=self.a.request('GET','/api/v1/me/reports')[1]['items'][0]
        self.assertEqual(self.b.request('DELETE','/api/v1/me/reports/'+report['id'])[0],404)
        self.assertEqual(self.b.request('GET','/api/v1/me/reports')[1]['items'],[])
    def test_resume_validation_private_access_confirmation_and_deletion(self):
        import zipfile
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w') as z:z.writestr('word/document.xml','<w:document xmlns:w="urn:w"><w:p><w:t>Skills: Python, SQL</w:t></w:p><w:p><w:t>Education: BSc</w:t></w:p></w:document>')
        media='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        self.assertEqual(self.a.request('POST','/api/v1/me/resume',raw=b'bad',headers={'content-type':'application/pdf'})[0],422)
        status,value=self.a.request('POST','/api/v1/me/resume',raw=buffer.getvalue(),headers={'content-type':media,'x-file-name':'resume.docx'})
        self.assertEqual(status,201);row=value['resume'];self.assertEqual(row['candidates']['skills'],['Python','SQL'])
        self.assertEqual(self.a.request('GET','/api/v1/me')[1]['sections']['skills'],[])
        self.assertIsNone(self.b.request('GET','/api/v1/me/resume')[1]['resume']);self.assertEqual(self.b.request('GET','/api/v1/me/resume/download')[0],404)
        self.assertEqual(self.b.request('POST','/api/v1/me/resume/confirm',{'resume_id':row['id'],'skills':['Python']})[0],404)
        self.assertEqual(self.a.request('POST','/api/v1/me/resume/confirm',{'resume_id':row['id'],'skills':['Python','python',' Python '],'degree':'BSc','experience':['Analyst']})[0],200)
        self.assertEqual(self.a.request('GET','/api/v1/me')[1]['sections']['skills'][0]['origin'],'RESUME_DERIVED');self.assertEqual(len(self.a.request('GET','/api/v1/me')[1]['sections']['skills']),1)
        self.assertEqual(self.a.request('POST','/api/v1/me/resume/confirm',{'resume_id':row['id'],'skills':['SQL']})[0],200)
        saved=self.a.request('GET','/api/v1/me')[1]['sections'];self.assertEqual(saved['experience'][0]['name'],'Analyst')
        self.assertEqual(self.a.request('DELETE','/api/v1/me/resume')[0],200)
        self.assertEqual(self.a.request('POST','/api/v1/me/resume/confirm',{'resume_id':row['id'],'skills':['Old']} )[0],404);self.assertEqual(self.a.request('PUT','/api/v1/me/sections/experience',saved['experience'])[0],422);self.assertFalse((Path(settings.resume_storage_path)/row['id']).exists());self.assertEqual(self.a.request('GET','/api/v1/me')[1]['sections']['skills'],[])
    def test_connected_accounts_never_fake_link_or_unlink(self):
        for provider in ['google','github']:
            self.assertEqual(self.a.request('POST','/api/v1/me/connected-accounts/'+provider)[0],503)
            self.assertEqual(self.a.request('DELETE','/api/v1/me/connected-accounts/'+provider)[0],503)
        self.assertTrue(all(not row['connected'] for row in self.a.request('GET','/api/v1/me/connected-accounts')[1]['items']))


    def test_delivery_failure_invalidates_code_and_duplicate_is_generic(self):
        from src.accounts.providers import ProviderUnavailable
        class Failing:
            def send(self, *args): raise ProviderUnavailable()
        c=Client();c.request('GET','/api/auth/csrf')
        with patch.object(verification,'email_provider',return_value=Failing()):
            status,value=c.request('POST','/api/auth/register',{'name':'Pending','email':'failed@example.in','password':'ValidPass9!'})
        self.assertEqual(status,201);self.assertEqual(value['state'],'TEMPORARILY_UNAVAILABLE');self.assertEqual(c.request('GET','/api/auth/verification')[1]['state'],'TEMPORARILY_UNAVAILABLE')
        with auth.connect() as db:
            row=db.execute("SELECT consumed FROM account_otps JOIN users ON users.id=user_id WHERE email='failed@example.in'").fetchone()
        self.assertEqual(row[0],1);self.assertFalse(c.request('GET','/api/auth/session')[1]['authenticated'])
        before=len(self.deliveries);duplicate=self.register('a@example.in',False)
        self.assertEqual(len(self.deliveries),before)
        self.assertEqual(duplicate.request('GET','/api/auth/verification')[1]['state'],'CONFIGURED')
        self.assertEqual(duplicate.request('POST','/api/auth/verification/confirm',{'code':self.codes['a@example.in']})[0],400)
        self.assertNotIn(auth.COOKIE_NAME,duplicate.cookies)

    def test_resend_invalidates_previous_code(self):
        with patch.object(otp.secrets,'randbelow',return_value=123456):c=self.register('resend@example.in',False)
        with auth.connect() as db:db.execute("UPDATE account_otps SET sent_at=? WHERE user_id=(SELECT id FROM users WHERE email='resend@example.in')",((auth.now()-timedelta(seconds=601)).isoformat(),))
        with patch.object(otp.secrets,'randbelow',return_value=654321):self.assertEqual(c.request('POST','/api/auth/verification/resend')[0],200)
        self.assertEqual(c.request('POST','/api/auth/verification/confirm',{'code':'123456'})[0],400)
        self.assertEqual(c.request('POST','/api/auth/verification/confirm',{'code':'654321'})[0],200)

    def test_resume_pdf_limits_replacement_and_content_safety(self):
        import zipfile
        pdf=io.BytesIO();writer=PdfWriter();writer.add_blank_page(width=72,height=72);writer.write(pdf)
        status,payload=self.a.request('POST','/api/v1/me/resume',raw=pdf.getvalue(),headers={'content-type':'application/pdf','x-file-name':'../../safe.pdf'})
        self.assertEqual(status,201);old=payload['resume']['id'];self.assertFalse(payload['resume']['candidates']['text_available']);self.assertEqual(payload['resume']['filename'],'safe.pdf')
        bad=io.BytesIO()
        with zipfile.ZipFile(bad,'w',compression=zipfile.ZIP_DEFLATED) as z:z.writestr('word/document.xml',b'x'*(10*1024*1024+1))
        media='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        self.assertEqual(self.a.request('POST','/api/v1/me/resume',raw=bad.getvalue(),headers={'content-type':media})[0],422)
        self.assertEqual(self.a.request('POST','/api/v1/me/resume',raw=b'x'*(settings.resume_max_bytes+1),headers={'content-type':'application/pdf'})[0],413)
        self.assertTrue((Path(settings.resume_storage_path)/old).exists())
        good=io.BytesIO()
        with zipfile.ZipFile(good,'w') as z:z.writestr('word/document.xml','<w:document xmlns:w="urn:w"><w:p><w:t>Skills: SQL</w:t></w:p></w:document>')
        self.assertEqual(self.a.request('POST','/api/v1/me/resume',raw=good.getvalue(),headers={'content-type':media})[0],201)
        self.assertFalse((Path(settings.resume_storage_path)/old).exists())
        self.assertEqual(self.a.request('GET','/api/v1/me/resume/download')[0],200)
        self.assertEqual(self.a.last_headers[b'cache-control'],b'no-store')

    def test_expired_session_and_no_test_delivery_endpoint(self):
        self.assertEqual(Client().request('GET','/__test/otp')[0],404)
        self.assertEqual(self.a.request('GET','/api/v1/me')[0],200);self.assertEqual(self.a.last_headers[b'cache-control'],b'no-store')
        with auth.connect() as db:db.execute("UPDATE sessions SET expires_at=? WHERE user_id=(SELECT id FROM users WHERE email='a@example.in')",((auth.now()-timedelta(seconds=1)).isoformat(),))
        self.assertEqual(self.a.request('GET','/api/v1/me')[0],401);self.assertTrue(self.a.request('GET','/api/auth/session')[1]['expired'])
        self.assertEqual(Client().request('GET','/api/v1/labour')[0],200)

    def test_section_limits_invalid_json_and_duplicate_skills(self):
        self.assertEqual(self.a.request('PUT','/api/v1/me/sections/skills',[{'name':'SQL'},{'name':'sql'}])[0],422)
        self.assertEqual(self.a.request('PUT','/api/v1/me/sections/skills',raw=b'not-json')[0],422)
        self.assertEqual(self.a.request('PUT','/api/v1/me/sections/interests',raw=b'x'*32001)[0],413)
        self.assertEqual(self.a.request('PUT','/api/v1/me/sections/education',{'qualification':'graduate','origin':'RESUME_DERIVED','resume_id':'invented'})[0],422)

    def test_provider_adapters_use_documented_requests_without_real_delivery(self):
        from src.accounts import providers
        with patch.object(providers,'post') as send:
            providers.ResendEmailProvider().send('a@example.in','subject','body')
            self.assertEqual(send.call_args.args[0],'https://api.resend.com/emails');self.assertEqual(send.call_args.args[1]['to'],['a@example.in'])
            providers.BrevoEmailProvider().send('a@example.in','subject','body')
            self.assertEqual(send.call_args.args[1]['textContent'],'body')
            providers.BrevoSmsProvider().send('+919876543210','body')
            self.assertEqual(send.call_args.args[1]['type'],'transactional')


    def test_parallel_rate_budget_is_atomic(self):
        from concurrent.futures import ThreadPoolExecutor
        from fastapi import Request, HTTPException
        request=Request({'type':'http','client':('127.0.0.1',9000)})
        def attempt(_):
            try:auth.rate_limit(request,'parallel-budget');return 200
            except HTTPException as exc:return exc.status_code
        with ThreadPoolExecutor(max_workers=20) as executor:results=list(executor.map(attempt,range(20)))
        self.assertEqual(results.count(200),8);self.assertEqual(results.count(429),12)


if __name__=='__main__':unittest.main()
