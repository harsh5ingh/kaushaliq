import io
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.error import HTTPError, URLError
from unittest.mock import patch
import bcrypt
from src.config import settings
from src.routes import auth
from src.accounts import store, otp, verification, providers, diagnostics
from src.scripts.seed_demo_account import seed
from test_accounts import Client


class VerificationAndDemoTests(unittest.TestCase):
    def setUp(self):
        self.temp=TemporaryDirectory()
        self.old={key:getattr(settings,key) for key in ['auth_database_path','resume_storage_path','environment','demo_account_enabled','demo_account_email','demo_account_password']}
        settings.auth_database_path=str(Path(self.temp.name)/'auth.sqlite3')
        settings.resume_storage_path=str(Path(self.temp.name)/'resumes')
        settings.environment='development';settings.demo_account_enabled=True
        settings.demo_account_email='demo@kaushaliq.local';settings.demo_account_password='UnitDemoAccount9!'
        auth.initialize_database();store.migrate()
        self.log_level=diagnostics.logger.level;diagnostics.logger.setLevel(50)
    def tearDown(self):
        for key,value in self.old.items():setattr(settings,key,value)
        diagnostics.logger.setLevel(self.log_level);self.temp.cleanup()
    def login(self):
        client=Client();client.request('GET','/api/auth/csrf')
        status,body=client.request('POST','/api/auth/login',{'email':settings.demo_account_email,'password':settings.demo_account_password})
        return client,status,body
    def test_seed_secure_idempotent_profile_and_real_queries(self):
        self.assertEqual(seed(),'created');self.assertEqual(seed(),'already_seeded')
        with auth.connect() as db:
            row=db.execute('SELECT * FROM users').fetchone()
            self.assertTrue(row['is_demo']);self.assertTrue(row['email_verified'])
            self.assertNotEqual(row['password_hash'],settings.demo_account_password)
            self.assertTrue(bcrypt.checkpw(settings.demo_account_password.encode(),row['password_hash']))
            self.assertEqual(db.execute('SELECT COUNT(*) FROM users').fetchone()[0],1)
        client,status,body=self.login();self.assertEqual(status,200)
        self.assertIn(auth.COOKIE_NAME,client.cookies)
        self.assertEqual(client.request('GET','/api/v1/me')[1]['sections']['education']['qualification'],'undergraduate')
        self.assertIsNone(client.request('GET','/api/v1/me')[1]['resume'])
        self.assertEqual(client.request('GET','/api/v1/me/watchlist')[1]['items'][0]['entity_id'],'in-karnataka')
        report=client.request('GET','/api/v1/me/reports')[1]['items'][0]
        self.assertEqual(report['query'],{'region_id':'in','period':'2023-24'});self.assertFalse(report['updated_data'])
    def test_demo_disabled_blocks_login_and_existing_session(self):
        seed();client,status,_=self.login();self.assertEqual(status,200)
        settings.demo_account_enabled=False
        self.assertEqual(self.login()[1],401)
        self.assertFalse(client.request('GET','/api/auth/session')[1]['authenticated'])
        self.assertEqual(client.request('GET','/api/v1/me')[0],401)
        with self.assertRaises(ValueError):seed()
    def test_non_development_refuses_seed_auth_and_session(self):
        seed();client,status,_=self.login();self.assertEqual(status,200)
        for environment in ['production','staging','test']:
            settings.environment=environment
            with self.assertRaises(ValueError):seed()
            self.assertEqual(self.login()[1],401)
            self.assertEqual(client.request('GET','/api/v1/me')[0],401)
    def test_password_policy_and_explicit_reset(self):
        settings.demo_account_password='weak'
        with self.assertRaises(Exception):seed()
        with auth.connect() as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM users').fetchone()[0],0)
        settings.demo_account_password='UnitDemoAccount9!';seed();client,status,_=self.login();self.assertEqual(status,200)
        settings.demo_account_password='ChangedDemoAccount9!'
        self.assertEqual(seed(),'already_seeded');self.assertEqual(self.login()[1],401)
        self.assertEqual(seed(True),'password_reset');self.assertEqual(self.login()[1],200)
        self.assertEqual(client.request('GET','/api/v1/me')[0],401)
    def test_existing_normal_identity_never_converted(self):
        with auth.connect() as db:db.execute('INSERT INTO users(id,name,email,password_hash,created_at) VALUES(?,?,?,?,?)',('ordinary','Normal',settings.demo_account_email,auth.DUMMY_PASSWORD_HASH,auth.now().isoformat()))
        with self.assertRaises(ValueError):seed()
        with auth.connect() as db:self.assertFalse(db.execute('SELECT is_demo FROM users').fetchone()[0])
    def test_demo_logout_csrf_and_owner_checks(self):
        seed();client,status,_=self.login();self.assertEqual(status,200)
        self.assertEqual(client.request('PATCH','/api/v1/me/profile',{'name':'Changed'},headers={'x-csrf-token':''})[0],403)
        self.assertEqual(client.request('DELETE','/api/v1/me/sessions/another-user-session')[0],404)
        self.assertEqual(client.request('POST','/api/auth/logout')[0],200)
        self.assertEqual(client.request('GET','/api/v1/me')[0],401)
        with auth.connect() as db:self.assertIsNotNone(db.execute('SELECT revoked_at FROM sessions').fetchone()[0])
    def test_provider_classifies_errors_and_never_returns_raw_body(self):
        cases=[(403,{'name':'suspended_api_key'},'auth_failed'),(403,{'name':'invalid_permission'},'auth_failed'),(401,{'message':'sensitive'},'auth_failed'),(403,{'name':'validation_error','message':'You can only send testing emails to your own email address (private@example.in).'},'test_recipient_restricted'),(403,{'message':'The domain is not verified'},'sender_unverified'),(422,{},'invalid_sender_or_request'),(429,{},'rate_limited'),(500,{'message':'secret traceback'},'provider_error'),(403,{'name':[]},'rejected')]
        for status,payload,code in cases:
            error=HTTPError('https://api.resend.com/emails',status,'upstream',{},io.BytesIO(json.dumps(payload).encode()))
            with patch.object(providers,'urlopen',side_effect=error):result=providers.post('https://api.resend.com/emails',{}, {})
            self.assertEqual(result.error_code,code);self.assertNotIn('sensitive',str(result));self.assertNotIn('private@example',str(result))
        with patch.object(providers,'urlopen',side_effect=URLError('secret network exception')):self.assertEqual(providers.post('https://api.resend.com/emails',{},{}).status,'network_error')
    def test_provider_acceptance_requires_safe_identifier(self):
        class Response(io.BytesIO):status=200
        with patch.object(providers,'urlopen',return_value=Response(b'{"id":"11111111-1111-4111-8111-111111111111"}')):
            result=providers.post('https://api.resend.com/emails',{},{});self.assertEqual(result.status,'accepted')
        with patch.object(providers,'urlopen',return_value=Response(b'{}')):self.assertEqual(providers.post('https://api.resend.com/emails',{},{}).status,'provider_error')
        self.assertNotEqual(providers._identifier('123456'), '123456')
    def test_failed_send_and_reload_preserve_safe_error_never_session(self):
        class Rejected:
            def send(self,*args):return providers.ProviderResult('configuration_error','auth_failed')
        client=Client();client.request('GET','/api/auth/csrf')
        with patch.object(verification,'email_provider',return_value=Rejected()):
            status,body=client.request('POST','/api/auth/register',{'name':'Pending','email':'pending@example.in','password':'NormalAccount9!'})
            self.assertEqual(status,201);self.assertEqual(body['error_code'],'email_provider_auth_failed')
            self.assertNotIn('provider_status',body)
            self.assertEqual(client.request('GET','/api/auth/verification')[1]['error_code'],'email_provider_auth_failed')
            status,retry=client.request('POST','/api/auth/login',{'email':'pending@example.in','password':'NormalAccount9!'})
            self.assertEqual(status,200);self.assertEqual(retry['state'],'TEMPORARILY_UNAVAILABLE')
            self.assertEqual(retry['error_code'],'email_provider_auth_failed');self.assertNotIn('provider_status',retry)
        self.assertFalse(client.request('GET','/api/auth/session')[1]['authenticated'])
        with auth.connect() as db:self.assertTrue(db.execute('SELECT consumed FROM account_otps').fetchone()[0])
    def test_diagnostics_and_validation_do_not_echo_secrets(self):
        class Accepted:
            def send(self,*args):return providers.ProviderResult('accepted',message_id='11111111-1111-4111-8111-111111111111')
        client=Client();client.request('GET','/api/auth/csrf')
        with patch.object(otp.secrets,'randbelow',return_value=123456),patch.object(verification,'email_provider',return_value=Accepted()),self.assertLogs(diagnostics.logger,level='INFO') as logs:
            client.request('POST','/api/auth/register',{'name':'Safe','email':'safe@example.in','password':'NeverLogPassword9!'})
        joined=' '.join(logs.output)
        for value in ['123456','NeverLogPassword9!','safe@example.in',settings.email_api_key]:
            if value:self.assertNotIn(value,joined)
        self.assertIn('otp_persisted',joined);self.assertIn('accepted',joined)
        status,result=client.request('POST','/api/auth/verification/confirm',{'code':'123456','unexpected':'secret'})
        self.assertEqual(status,422);self.assertEqual(result,{'detail':'verification_invalid'})
        status,result=client.request('POST','/api/auth/register',{'name':'Bad','email':'bad@example.in','password':'x'*201})
        self.assertEqual(status,422);self.assertNotIn('x'*201,str(result))


if __name__=='__main__':unittest.main()
