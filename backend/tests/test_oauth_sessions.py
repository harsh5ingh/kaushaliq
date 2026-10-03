import base64
import hashlib
import logging
import secrets
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import parse_qs, urlencode, urlsplit
from unittest.mock import patch

import bcrypt
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from src.accounts import oauth, store
from src.config import settings
from src.routes import auth
from test_accounts import Client


class OAuthSessionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = bcrypt.hashpw(b'ValidPass9!', bcrypt.gensalt(rounds=12))
        cls.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def setUp(self):
        self.temp = TemporaryDirectory()
        keys = ['auth_database_path', 'frontend_url', 'api_url', 'environment',
                'google_client_id', 'google_client_secret', 'google_callback_url',
                'github_client_id', 'github_client_secret', 'github_callback_url']
        self.original = {key: getattr(settings, key) for key in keys}
        settings.auth_database_path = str(Path(self.temp.name) / 'auth.sqlite3')
        settings.frontend_url = 'http://localhost:5173'; settings.api_url = 'http://localhost:8000'
        settings.environment = 'development'
        for provider in oauth.PROVIDERS:
            setattr(settings, provider + '_client_id', 'test-client')
            setattr(settings, provider + '_client_secret', 'isolated-test-only-secret')
            setattr(settings, provider + '_callback_url', f'http://localhost:8000/api/auth/oauth/{provider}/callback')
        auth.initialize_database(); store.migrate()

    def tearDown(self):
        for key, value in self.original.items(): setattr(settings, key, value)
        self.temp.cleanup()

    def user(self, email='existing@example.in'):
        uid = secrets.token_urlsafe(18)
        with auth.connect() as db:
            db.execute('''INSERT INTO users(id,name,email,password_hash,created_at,email_verified)
              VALUES(?,?,?,?,?,1)''', (uid, 'Test User', email, self.password_hash, auth.now().isoformat()))
        return uid

    def login(self, email='existing@example.in'):
        client=Client(); client.request('GET','/api/auth/csrf')
        self.assertEqual(client.request('POST','/api/auth/login',{'email':email,'password':'ValidPass9!'})[0],200)
        return client

    def begin(self, provider='google', client=None, destination='/intelligence', link=False):
        client=client or Client(); client.request('GET','/api/auth/csrf')
        path='/api/v1/me/connected-accounts/'+provider if link else '/api/auth/oauth/'+provider+'/start'
        status, result=client.request('POST',path,None if link else {'return_to':destination})
        self.assertEqual(status,200,result)
        params=parse_qs(urlsplit(result['authorizationUrl']).query)
        with auth.connect() as db: row=dict(db.execute('SELECT * FROM oauth_flows WHERE digest=?',(oauth.digest(params['state'][0]),)).fetchone())
        return client,params,row

    def callback(self, client, provider, params, identity=None, error=None):
        query={'state':params['state'][0], **({'error':'access_denied'} if error else {'code':'isolated-test-code'})}
        with patch.object(oauth,'exchange_identity',return_value=identity or oauth.Identity('subject-1','new@example.in','Provider User')):
            status,_=client.request('GET',f'/api/auth/oauth/{provider}/callback?'+urlencode(query))
        self.assertEqual(status,303)
        client.csrf=client.cookies.get('kaushaliq_csrf','')
        return client.last_headers[b'location'].decode()

    def test_keep_current_atomic_owner_isolation_idempotency(self):
        self.user();self.user('other@example.in')
        a=self.login(); b=self.login(); outsider=self.login('other@example.in')
        with auth.connect() as db: db.execute('INSERT INTO sessions(jti,user_id,expires_at,revoked_at) VALUES(?,?,?,?)',('expired',a.request('GET','/api/auth/me')[1]['user']['id'],(auth.now()-timedelta(seconds=1)).isoformat(),None))
        status,result=a.request('POST','/api/v1/me/sessions/revoke-others',{'user_id':'ignored','current_session_id':'ignored'})
        self.assertEqual(status,200);self.assertEqual(result['revoked'],1)
        self.assertEqual(a.request('GET','/api/v1/me')[0],200)
        self.assertEqual(b.request('GET','/api/v1/me')[0],401)
        self.assertEqual(outsider.request('GET','/api/v1/me')[0],200)
        self.assertEqual(len(a.request('GET','/api/v1/me/sessions')[1]['items']),1)
        self.assertEqual(a.request('POST','/api/v1/me/sessions/revoke-others')[1]['revoked'],0)
        with auth.connect() as db: self.assertIsNone(db.execute("SELECT revoked_at FROM sessions WHERE jti='expired'").fetchone()[0])
        self.assertEqual(b.request('POST','/api/v1/me/sessions/revoke-others')[0],401)

    def test_everywhere_revokes_current_and_other_credentials(self):
        self.user();a=self.login();b=self.login();old_cookie=a.cookies[auth.COOKIE_NAME]
        self.assertEqual(a.request('POST','/api/v1/me/sessions/revoke-all',headers={'x-csrf-token':''})[0],403)
        status,result=a.request('POST','/api/v1/me/sessions/revoke-all')
        self.assertEqual(status,200);self.assertEqual(result['revoked'],2)
        self.assertNotIn(auth.COOKIE_NAME,a.cookies)
        a.cookies[auth.COOKIE_NAME]=old_cookie
        self.assertEqual(a.request('GET','/api/v1/me')[0],401);self.assertEqual(b.request('GET','/api/v1/me')[0],401)
        self.assertEqual(a.request('POST','/api/v1/me/sessions/revoke-all')[0],401)

    def test_concurrent_revoke_others_is_atomic(self):
        from src.accounts.sessions import revoke_account_sessions
        self.user();a=self.login();b=self.login();user=auth.session_user(a.cookies[auth.COOKIE_NAME])[0]
        with ThreadPoolExecutor(max_workers=2) as workers:
            results=list(workers.map(lambda _:revoke_account_sessions(user,keep_current=True),range(2)))
        self.assertEqual(sorted(results),[0,1]);self.assertEqual(a.request('GET','/api/v1/me')[0],200);self.assertEqual(b.request('GET','/api/v1/me')[0],401)

    def test_production_flow_cookie_flags_and_no_secrets_in_provider_state(self):
        settings.environment='production';settings.api_url='https://api.example.in';settings.frontend_url='https://app.example.in'
        settings.google_callback_url='https://api.example.in/api/auth/oauth/google/callback'
        c,params,_=self.begin()
        cookie=c.last_headers[b'set-cookie'].decode()
        self.assertIn('__Host-kaushaliq_oauth_google',cookie);self.assertIn('HttpOnly',cookie);self.assertIn('Secure',cookie);self.assertIn('SameSite=lax',cookie)
        self.assertNotIn(settings.google_client_secret,str(params));self.assertNotIn('client_secret',params)
        c.request('GET','/api/auth/providers');self.assertNotIn('client_secret',str(c.request('GET','/api/auth/providers')[1]))

    def test_network_error_is_sanitized(self):
        from urllib.error import URLError
        with patch.object(oauth,'build_opener') as transport:
            transport.return_value.open.side_effect=URLError('sensitive-internal-details')
            with self.assertRaises(oauth.OAuthFailure) as exc:oauth.provider_json('https://oauth2.googleapis.com/token',form={'code':'private-code'})
        self.assertEqual(str(exc.exception),'oauth_provider_failed')

    def test_configuration_and_redirect_validation(self):
        settings.google_client_secret=''
        self.assertEqual(oauth.availability('google'),'NOT_CONFIGURED')
        c=Client();c.request('GET','/api/auth/csrf')
        self.assertEqual(c.request('POST','/api/auth/oauth/google/start',{})[0],503)
        settings.google_client_secret='test-secret'
        for url in ['https://evil.example/callback','http://localhost:8000/api/auth/oauth/google/callback?redirect=evil']:
            settings.google_callback_url=url; self.assertEqual(oauth.availability('google'),'CONFIGURATION_ERROR')
        settings.google_callback_url='http://localhost:8000/api/auth/oauth/google/callback'
        for target in ['https://evil.example','//evil.example','/%2f%2fevil.example','/settings\\evil','/auth/signin','/unknown']:
            self.assertEqual(c.request('POST','/api/auth/oauth/google/start',{'return_to':target})[0],400)
        settings.environment='production';self.assertEqual(oauth.availability('google'),'CONFIGURATION_ERROR')

    def test_start_csrf_pkce_and_hashed_state(self):
        c=Client(); self.assertEqual(c.request('POST','/api/auth/oauth/google/start',{})[0],403)
        c,p,flow=self.begin()
        expected=base64.urlsafe_b64encode(hashlib.sha256(flow['verifier'].encode()).digest()).rstrip(b'=').decode()
        self.assertEqual(p['code_challenge'],[expected]);self.assertEqual(p['code_challenge_method'],['S256'])
        self.assertEqual(p['scope'],['openid email profile']);self.assertEqual(p['nonce'],[flow['nonce']])
        self.assertNotEqual(flow['digest'],p['state'][0]);self.assertNotEqual(flow['browser_digest'],c.cookies[oauth.cookie_name('google')])

    def test_state_browser_binding_expiry_provider_and_replay(self):
        a,p,flow=self.begin(); b=Client()
        self.assertIn('oauth_state_invalid',self.callback(b,'google',p));self.assertFalse(b.request('GET','/api/auth/session')[1]['authenticated'])
        self.assertIn('oauth_state_invalid',self.callback(a,'github',p))
        with auth.connect() as db: db.execute('UPDATE oauth_flows SET expires_at=? WHERE digest=?',((auth.now()-timedelta(seconds=1)).isoformat(),flow['digest']))
        self.assertIn('oauth_state_invalid',self.callback(a,'google',p))
        a,p,flow=self.begin();self.callback(a,'google',p)
        self.assertIn('oauth_state_invalid',self.callback(a,'google',p))
        with auth.connect() as db:
            consumed=db.execute('SELECT * FROM oauth_flows WHERE digest=?',(flow['digest'],)).fetchone()
            self.assertTrue(consumed['consumed_at']);self.assertEqual(consumed['verifier'],'');self.assertEqual(consumed['nonce'],'')

    def test_cancel_provider_error_and_duplicate_params(self):
        c,p,_=self.begin();self.assertIn('oauth_cancelled',self.callback(c,'google',p,error=True))
        self.assertFalse(c.request('GET','/api/auth/session')[1]['authenticated'])
        c,p,_=self.begin()
        with patch.object(oauth,'exchange_identity',side_effect=oauth.OAuthFailure('oauth_provider_failed')):
            c.request('GET','/api/auth/oauth/google/callback?'+urlencode({'state':p['state'][0],'code':'test'}))
        self.assertIn(b'oauth_provider_failed',c.last_headers[b'location'])
        c,p,_=self.begin(); c.request('GET','/api/auth/oauth/google/callback?state='+p['state'][0]+'&state=another&code=test')
        self.assertIn(b'oauth_state_invalid',c.last_headers[b'location'])

    def test_google_and_github_use_normal_sessions_logout_and_revocation(self):
        for provider in ['google','github']:
            with self.subTest(provider=provider):
                identity=oauth.Identity('stable-'+provider,provider+'@example.in','Provider User')
                a,p,_=self.begin(provider);self.assertEqual(self.callback(a,provider,p,identity),settings.frontend_url+'/intelligence')
                token=jwt.decode(a.cookies[auth.COOKIE_NAME],settings.jwt_secret,algorithms=['HS256'])
                self.assertEqual(token['exp']-token['iat'],8*3600);self.assertEqual(set(token),{'sub','jti','iat','exp'})
                account=a.request('GET','/api/auth/session')[1]['user'];self.assertEqual(account['provider'],provider);self.assertFalse(account['passwordEnabled'])
                with auth.connect() as db:
                    user=db.execute('SELECT * FROM users WHERE id=?',(account['id'],)).fetchone();self.assertEqual(user['password_hash'],b'');self.assertTrue(user['email_verified'])
                b,p,_=self.begin(provider);self.callback(b,provider,p,identity)
                self.assertEqual(len(a.request('GET','/api/v1/me/sessions')[1]['items']),2)
                self.assertEqual(a.request('POST','/api/v1/me/sessions/revoke-others')[1]['revoked'],1)
                self.assertEqual(b.request('GET','/api/v1/me')[0],401)
                self.assertEqual(a.request('POST','/api/auth/logout')[0],200);self.assertFalse(a.request('GET','/api/auth/session')[1]['authenticated'])

    def test_email_collision_never_autolinks_and_explicit_link_succeeds(self):
        self.user();identity=oauth.Identity('google-id','existing@example.in','Existing')
        c,p,_=self.begin();self.assertIn('oauth_account_conflict',self.callback(c,'google',p,identity))
        self.assertFalse(c.request('GET','/api/auth/session')[1]['authenticated'])
        a=self.login();current=a.cookies[auth.COOKIE_NAME];a,p,_=self.begin(client=a,link=True)
        self.assertIn('oauth_connected=google',self.callback(a,'google',p,identity));self.assertEqual(current,a.cookies[auth.COOKIE_NAME])
        self.assertTrue(a.request('GET','/api/v1/me/connected-accounts')[1]['items'][0]['connected'])
        c,p,_=self.begin();self.callback(c,'google',p,oauth.Identity('google-id','changed@example.in','Changed'))
        self.assertEqual(c.request('GET','/api/auth/me')[1]['user']['id'],a.request('GET','/api/auth/me')[1]['user']['id'])

    def test_link_requires_recent_live_session_and_cannot_take_other_identity(self):
        self.user();a=self.login();a,p,flow=self.begin(client=a,link=True)
        a.request('POST','/api/auth/logout')
        self.assertIn('oauth_link_session_expired',self.callback(a,'google',p))
        a=self.login()
        with auth.connect() as db: db.execute('UPDATE sessions SET expires_at=? WHERE jti=?',((auth.now()+timedelta(hours=7)).isoformat(),auth.session_user(a.cookies[auth.COOKIE_NAME])[0]['jti']))
        self.assertEqual(a.request('POST','/api/v1/me/connected-accounts/google')[0],403)
        c,p,_=self.begin();self.callback(c,'google',p)
        a=self.login();a,p,_=self.begin(client=a,link=True)
        self.assertIn('oauth_account_conflict',self.callback(a,'google',p))

    def signed_google(self, flow, **changes):
        claims={'sub':'google-subject','iss':'https://accounts.google.com','aud':'test-client','iat':auth.now().timestamp(),'exp':(auth.now()+timedelta(minutes=5)).timestamp(),'nonce':flow['nonce'],'email':'verified@example.in','email_verified':True,'name':'Test'}
        claims.update(changes)
        return jwt.encode(claims,self.key,algorithm='RS256',headers={'kid':'test-key'})

    def test_google_signature_issuer_audience_nonce_email_and_pkce(self):
        _,_,flow=self.begin()
        for changes in [{}, {'iss':'https://evil.example'}, {'aud':'other-client'}, {'nonce':'wrong'}, {'email_verified':False}, {'exp':0}, {'azp':'other'}]:
            token=self.signed_google(flow,**changes)
            with patch.object(oauth,'provider_json',return_value={'id_token':token}) as http, patch.object(jwt.PyJWKClient,'get_signing_key_from_jwt') as jwks:
                jwks.return_value.key=self.key.public_key()
                if changes:
                    with self.assertRaises(oauth.OAuthFailure): oauth.google_identity('test-code',flow)
                else: self.assertEqual(oauth.google_identity('test-code',flow).subject,'google-subject')
                self.assertEqual(http.call_args.kwargs['form']['code_verifier'],flow['verifier'])
        with patch.object(oauth,'provider_json',return_value={'id_token':self.signed_google(flow)}),patch.object(jwt.PyJWKClient,'get_signing_key_from_jwt') as jwks:
            jwks.return_value.key=rsa.generate_private_key(public_exponent=65537,key_size=2048).public_key()
            with self.assertRaises(oauth.OAuthFailure):oauth.google_identity('test-code',flow)

    def test_github_private_verified_primary_email_and_minimal_scope(self):
        _,params,flow=self.begin('github');self.assertEqual(params['scope'],['user:email'])
        for emails in [[],[{'email':'p@example.in','verified':False,'primary':True}],[{'email':'p@example.in','verified':True,'primary':True}]]:
            with patch.object(oauth,'provider_json',side_effect=[{'access_token':'test-only-token','token_type':'bearer'},{'id':123,'email':None,'login':'test'},emails]) as http:
                if not emails or not emails[0]['verified']:
                    with self.assertRaises(oauth.OAuthFailure) as exc:oauth.github_identity('test-code',flow)
                    self.assertEqual(exc.exception.code,'oauth_email_unverified')
                else:self.assertEqual(oauth.github_identity('test-code',flow).email,'p@example.in')
                self.assertEqual(http.call_args_list[0].kwargs['form']['code_verifier'],flow['verifier'])
                self.assertEqual(http.call_args_list[2].args[0],'https://api.github.com/user/emails')

    def test_access_log_redacts_callback_secrets(self):
        for path in ('/api/auth/oauth/google/callback', '/api/auth/%6fauth/github/callback'):
            record=logging.LogRecord('uvicorn.access',logging.INFO,'',1,'%s - "%s %s HTTP/%s" %d',('ip','GET',path+'?code=private&state=private','1.1',303),None)
            oauth.OAuthAccessLogFilter().filter(record)
            self.assertNotIn('private',record.getMessage());self.assertIn('/callback',record.getMessage())


if __name__=='__main__': unittest.main()
