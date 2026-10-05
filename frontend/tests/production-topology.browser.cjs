// Offline production-topology test: real production auth, temporary DB, mocked identity exchange.
// Browser URLs use HTTPS/public origin; interception emulates the external rewrite, not Vercel's edge.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const http = require('node:http'), net = require('node:net'), crypto = require('node:crypto');
const { spawn } = require('node:child_process'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const frontend = path.resolve(__dirname, '..'), backendDir = path.resolve(frontend, '../backend');
const origin = 'https://kaushaliq.vercel.app';
const checks = [], failures = [];
const pass = name => { checks.push(name); console.log('PASS ' + name); };
function describeFailure(error) {
  const stack = error && typeof error.stack === 'string' ? error.stack.split('\n') : [];
  return [String(error?.name || 'Error') + ': ' + String(error?.message || error).split('\n')[0], ...stack.slice(1).filter(line => line.trim().startsWith('at '))].join('\n');
}
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kaushaliq-topology-'));
const password = crypto.randomBytes(24).toString('base64url') + 'Aa9!';
const testJwtSecret = crypto.randomBytes(48).toString('hex');
const testOAuthSecret = 'isolated-test-secret';
let backend, browser;
async function port() { return new Promise(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)); }); }); }
function upstream(url, method = 'GET', headers = {}, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method, headers }, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    }); request.on('error', reject); request.end(body);
  });
}
async function api(page, route, method = 'GET', body, token) {
  return page.evaluate(async ({ route, method, body, token }) => {
    const response = await fetch('/api' + route, { method, credentials: 'include', headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { 'X-CSRF-Token': token } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, value: await response.json() };
  }, { route, method, body, token });
}
async function mutation(page, route) {
  const challenge = await api(page, '/auth/csrf');
  return api(page, route, 'POST', undefined, challenge.value.csrfToken);
}
async function login(context) {
  const page = await context.newPage(); await page.goto(origin + '/auth/signin');
  await page.getByLabel('Email', { exact: true }).fill('topology@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(origin + '/intelligence'); return page;
}
(async () => {
  try {
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(frontend, 'vercel.json'), 'utf8')), {
      rewrites: [{ source: '/api/:path*', destination: 'https://kaushaliq.onrender.com/api/:path*' }],
    });
    pass('Single Vercel config rewrites the complete API path to Render');
    const apiPort = await port(), target = 'http://127.0.0.1:' + apiPort;
    const fixture = path.join(temporary, 'server.py');
    fs.writeFileSync(fixture, `import os, sys
sys.path.insert(0, os.environ['TEST_BACKEND'])
from src.main import app
from src.routes import auth
from src.accounts import oauth
import bcrypt, uvicorn
with auth.connect() as db:
    db.execute('INSERT INTO users(id,name,email,password_hash,created_at,email_verified,password_enabled) VALUES(?,?,?,?,?,1,1)', ('topology-user','Topology Test','topology@example.invalid',bcrypt.hashpw(os.environ['TEST_PASSWORD'].encode(),bcrypt.gensalt(rounds=12)),auth.now().isoformat()))
def identity(provider, code, flow):
    if code != 'isolated-test-code': raise oauth.OAuthFailure('oauth_provider_failed')
    return oauth.Identity('topology-'+provider,provider+'@example.invalid','Topology Provider')
oauth.exchange_identity = identity
uvicorn.run(app, host='127.0.0.1', port=int(sys.argv[1]), log_level='error', access_log=False)
`);
    let backendLaunchFailure = null, backendOutput = '';
    backend = spawn(process.env.PYTHON || 'python', [fixture, String(apiPort)], { cwd: temporary, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: {
      ...process.env, TEST_BACKEND: backendDir, TEST_PASSWORD: password, ENVIRONMENT: 'production',
      FRONTEND_URL: origin, API_URL: origin, AUTH_DATABASE_PATH: path.join(temporary, 'auth.sqlite3'),
      RESUME_STORAGE_PATH: path.join(temporary, 'resumes'), JWT_SECRET: testJwtSecret,
      AUTH_SESSION_TTL: '8h', AUTH_COOKIE_SAMESITE: 'lax', DEMO_ACCOUNT_ENABLED: 'false', DEMO_ACCOUNT_PASSWORD: '',
      EMAIL_PROVIDER: '', EMAIL_API_KEY: '', SMS_PROVIDER: '', SMS_API_KEY: '',
      GOOGLE_CLIENT_ID: 'isolated-test-client', GOOGLE_CLIENT_SECRET: testOAuthSecret, GOOGLE_CALLBACK_URL: origin + '/api/auth/oauth/google/callback',
      GITHUB_CLIENT_ID: 'isolated-test-client', GITHUB_CLIENT_SECRET: testOAuthSecret, GITHUB_CALLBACK_URL: origin + '/api/auth/oauth/github/callback',
    } });
    for (const stream of [backend.stdout, backend.stderr]) stream.on('data', chunk => { backendOutput = (backendOutput + chunk.toString()).slice(-12000); });
    backend.once('error', error => { backendLaunchFailure = error.code || error.name; });
    let ready = false;
    for (let i = 0; i < 100; i++) { try { ready = (await upstream(target + '/api/health')).status === 200; if (ready) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    const safeBackendOutput = backendOutput.replaceAll(password, '[redacted]').replaceAll(testJwtSecret, '[redacted]').replaceAll(testOAuthSecret, '[redacted]');
    assert.ok(ready, `Isolated production backend must start${backendLaunchFailure ? `; process launch failed (${backendLaunchFailure})` : backend.exitCode !== null ? `; child exited (${backend.exitCode})` : '; health endpoint did not become ready'}${safeBackendOutput ? `\n${safeBackendOutput.trim()}` : ''}`);
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
    let dropBinding = false, apiCalls = 0;
    async function context() {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      context.on('page', page => page.on('pageerror', () => failures.push('Browser runtime error')));
      await context.route('**/*', async route => {
        try {
          const request = route.request(), url = new URL(request.url());
          if (['accounts.google.com', 'github.com'].includes(url.hostname)) {
            const provider = url.hostname === 'github.com' ? 'github' : 'google';
            const callback = new URL(url.searchParams.get('redirect_uri'));
            assert.equal(callback.href, origin + '/api/auth/oauth/' + provider + '/callback');
            assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
            assert.ok(url.searchParams.get('state'));
            if (provider === 'google') assert.ok(url.searchParams.get('nonce'));
            const binding = (await context.cookies(origin)).find(cookie => cookie.name === '__Host-kaushaliq_oauth_' + provider);
            assert.ok(binding?.secure && binding.httpOnly && binding.sameSite === 'Lax');
            if (dropBinding) await context.clearCookies({ name: binding.name });
            callback.searchParams.set('state', url.searchParams.get('state'));
            callback.searchParams.set('code', 'isolated-test-code');
            return route.fulfill({ status: 302, headers: { location: callback.href }, body: '' });
          }
          assert.equal(url.origin, origin, 'Production browser must never call Render directly');
          if (url.pathname.startsWith('/api/')) {
            apiCalls++;
            const headers = await request.allHeaders(); delete headers.host; delete headers['content-length'];
            const response = await upstream(target + url.pathname + url.search, request.method(), headers, request.postDataBuffer());
            const forwarded = Object.fromEntries(Object.entries(response.headers).filter(([key]) => !['connection', 'transfer-encoding', 'content-length'].includes(key)).map(([key, value]) => [key, Array.isArray(value) ? value.join('\n') : String(value)]));
            return route.fulfill({ status: response.status, headers: forwarded, body: response.body });
          }
          const dist = path.join(frontend, 'dist');
          let file = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
          assert.ok(file.startsWith(dist + path.sep) || file === dist);
          if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
          const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
          return route.fulfill({ contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
        } catch (error) { const diagnostic = describeFailure(error); failures.push('Topology routing assertion failed\n' + diagnostic); console.error(diagnostic); await route.abort(); }
      }); return context;
    }
    const a = await context(), b = await context();
    const page = await login(a), second = await login(b);
    assert.equal((await api(page, '/auth/session')).value.authenticated, true);
    const cookies = await a.cookies(origin);
    const session = cookies.find(cookie => cookie.name === '__Host-kaushaliq_session');
    const csrf = cookies.find(cookie => cookie.name === 'kaushaliq_csrf');
    assert.ok(session?.httpOnly && session.secure && session.sameSite === 'Lax');
    assert.ok(csrf?.secure && csrf.sameSite === 'Lax' && csrf.domain === 'kaushaliq.vercel.app');
    pass('Built frontend logs in through same-origin API with Secure/Lax CSRF and HttpOnly session cookies');
    const credentials = { email: 'topology@example.invalid', password };
    assert.equal((await api(page, '/auth/login', 'POST', credentials, 'mismatch')).status, 403);
    assert.equal((await api(page, '/auth/login', 'POST', credentials)).status, 403);
    const denied = await upstream(target + '/api/auth/login', 'POST', { 'Content-Type': 'application/json', Origin: 'https://untrusted.invalid', Cookie: 'kaushaliq_csrf=' + csrf.value, 'X-CSRF-Token': csrf.value }, JSON.stringify(credentials));
    assert.equal(denied.status, 403);
    await a.clearCookies({ name: 'kaushaliq_csrf' });
    assert.equal((await api(page, '/auth/login', 'POST', credentials, csrf.value)).status, 403);
    pass('Missing cookie, missing/mismatched token and disallowed Origin still return 403');
    assert.equal((await api(page, '/v1/me/sessions')).value.items.length, 2);
    assert.equal((await mutation(page, '/v1/me/sessions/revoke-others')).status, 200);
    assert.equal((await api(page, '/auth/session')).value.authenticated, true);
    assert.equal((await api(second, '/v1/me')).status, 401);
    assert.equal((await api(page, '/v1/me/sessions')).value.items.length, 1);
    assert.equal((await mutation(page, '/v1/me/sessions/revoke-others')).status, 200);
    assert.equal((await mutation(page, '/v1/me/sessions/revoke-all')).status, 200);
    assert.equal((await api(page, '/auth/session')).value.authenticated, false);
    pass('Current-session preservation, persisted revocation and sign-out-everywhere work through the proxy');
    for (const provider of ['Google', 'GitHub']) {
      await page.goto(origin + '/auth/signin');
      const button = page.getByRole('button', { name: 'Continue with ' + provider, exact: true });
      await page.waitForFunction(() => !document.querySelector('.social-auth button').disabled);
      assert.equal(await page.getByRole('button', { name: /Facebook/i }).count(), 0);
      assert.equal(Object.hasOwn((await api(page, '/auth/providers')).value.oauth, 'facebook'), false);
      const oauthDiagnostics = provider === 'Google' ? {
        lastNavigationUrl: null,
        lastResponseStatus: null,
        lastLocation: null,
      } : null;
      const safeOAuthUrl = value => {
        try {
          const url = new URL(value);
          for (const key of [...url.searchParams.keys()]) {
            if (/^(state|code|nonce|code_challenge|code_verifier|client_secret|access_token|id_token|refresh_token)$/i.test(key)) {
              url.searchParams.set(key, '[redacted]');
            }
          }
          url.username = '';
          url.password = '';
          return url.href;
        } catch { return '[invalid-url]'; }
      };
      const isGoogleOAuthUrl = value => {
        try {
          const url = new URL(value);
          return (url.origin === origin && /^\/api\/auth\/oauth\/google\/(start|callback)$/.test(url.pathname))
            || (url.hostname === 'accounts.google.com' && url.pathname === '/o/oauth2/v2/auth');
        } catch { return false; }
      };
      if (oauthDiagnostics) {
        page.on('request', request => {
          if (isGoogleOAuthUrl(request.url())) console.log('OAUTH_DIAG request ' + safeOAuthUrl(request.url()));
        });
        page.on('response', response => {
          if (!isGoogleOAuthUrl(response.url())) return;
          void response.allHeaders().then(headers => {
            const location = headers.location ? safeOAuthUrl(headers.location) : null;
            oauthDiagnostics.lastResponseStatus = response.status();
            oauthDiagnostics.lastLocation = location;
            console.log('OAUTH_DIAG response ' + JSON.stringify({ url: safeOAuthUrl(response.url()), status: response.status(), location }));
          }).catch(() => {
            oauthDiagnostics.lastResponseStatus = response.status();
            oauthDiagnostics.lastLocation = null;
            console.log('OAUTH_DIAG response ' + JSON.stringify({ url: safeOAuthUrl(response.url()), status: response.status(), location: null }));
          });
        });
        page.on('framenavigated', frame => {
          if (frame !== page.mainFrame()) return;
          oauthDiagnostics.lastNavigationUrl = safeOAuthUrl(frame.url());
          console.log('OAUTH_DIAG main-frame ' + oauthDiagnostics.lastNavigationUrl);
        });
        console.log('OAUTH_DIAG before-click ' + safeOAuthUrl(page.url()));
      }
      await button.click();
      if (oauthDiagnostics) {
        console.log('OAUTH_DIAG after-click ' + safeOAuthUrl(page.url()));
        console.log('OAUTH_DIAG before-wait ' + safeOAuthUrl(page.url()));
      }
      try {
        await page.waitForURL(origin + '/intelligence');
      } catch (error) {
        if (oauthDiagnostics) {
          console.error('OAUTH_DIAG wait-failed ' + JSON.stringify({
            currentUrl: safeOAuthUrl(page.url()),
            expectedUrl: origin + '/intelligence',
            lastNavigationUrl: oauthDiagnostics.lastNavigationUrl,
            lastOAuthResponseStatus: oauthDiagnostics.lastResponseStatus,
            lastOAuthLocation: oauthDiagnostics.lastLocation,
            pageOpen: !page.isClosed(),
          }));
        }
        throw error;
      }
      assert.equal((await api(page, '/auth/session')).value.user.provider, provider.toLowerCase());
      assert.equal((await api(page, '/v1/me/sessions')).value.items.length, 1);
      assert.equal((await mutation(page, '/auth/logout')).status, 200);
      assert.equal((await api(page, '/auth/session')).value.authenticated, false);
      pass(provider + ' start/callback retain production browser binding and create a normal revocable session (mock identity)');
    }
    dropBinding = true;
    await page.goto(origin + '/auth/signin');
    await page.waitForFunction(() => !document.querySelector('.social-auth button').disabled);
    await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
    await page.waitForURL(/oauth_error=oauth_state_invalid/);
    assert.equal((await api(page, '/auth/session')).value.authenticated, false);
    pass('Callback with missing browser-binding cookie fails closed; Facebook is absent from UI and provider response');
    assert.ok(apiCalls > 20); assert.deepEqual(failures, []);
    pass('All browser API traffic stayed on the public HTTPS origin; no live provider or production mutation was used');
    await a.close(); await b.close();
  } catch (error) { const diagnostic = describeFailure(error); failures.push('Production topology verification failed\n' + diagnostic); console.error(diagnostic); process.exitCode = 1; }
  finally {
    if (browser) await browser.close();
    if (backend && backend.exitCode === null) { backend.kill(); await new Promise(resolve => { backend.once('exit', resolve); setTimeout(resolve, 3000).unref(); }); }
    const output = process.env.KAUSHALIQ_TEST_OUTPUT || temporary;
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'topology-results.json'), JSON.stringify({ checks, failures, verification: 'LOCAL EMULATION ONLY; Vercel edge and live provider consoles not deployed/tested' }, null, 2));
    if (failures.length) console.error('FAIL ' + failures.join('; '));
  }
})();
