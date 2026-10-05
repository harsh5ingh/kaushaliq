const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{startStack}=require('./test-stack.cjs');
const frontend=path.resolve(__dirname,'..'),output=process.env.KAUSHALIQ_TEST_OUTPUT || path.resolve(frontend,'../docs/phase-2.9.1.1/verification');
fs.mkdirSync(output,{recursive:true}); const checks=[],screenshots=[],errors=[];
let stack,browser;const pass=name=>{checks.push(name);console.log('PASS '+name);};
async function capture(page,file){await page.screenshot({path:path.join(output,file),animations:'disabled'});screenshots.push(file);}
async function login(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(stack.base+'/auth/signin');await page.getByLabel('Email',{exact:true}).fill(stack.demo.email);await page.getByLabel('Password',{exact:true}).fill(stack.demo.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(/intelligence/);return page;}
async function settings(page){await page.goto(stack.base+'/settings');await page.getByText('Current session',{exact:true}).waitFor();}
async function active(context){return (await(await context.request.get(stack.base+'/api/v1/me/sessions')).json()).items;}
(async()=>{try{
  stack=await startStack(frontend,{emailDelivery:false,demo:true});browser=await chromium.launch({channel:'msedge',headless:true});
  const a=await browser.newContext({viewport:{width:1440,height:1000}}),b=await browser.newContext();const p=await login(a),q=await login(b);
  await settings(p);assert.equal((await active(a)).length,2);
  let calls=0;p.on('request',r=>{if(r.method()==='POST'&&/sessions\/revoke-/.test(r.url()))calls++;});
  const opener=p.getByRole('button',{name:'Sign out all other sessions',exact:true});
  await opener.click();const dialog=p.getByRole('dialog',{name:'Sign out other sessions?',exact:true});await dialog.waitFor();
  assert.equal(await dialog.getAttribute('aria-describedby'),'session-confirm-description');
  assert.equal(await dialog.getByRole('button',{name:'Cancel',exact:true}).evaluate(el=>el===document.activeElement),true);
  for(let i=0;i<9;i++){await p.keyboard.press('Tab');assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);}
  await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await opener.evaluate(el=>el===document.activeElement),true);
  await opener.click();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await opener.click();await p.mouse.click(4,4);await dialog.waitFor({state:'hidden'});
  assert.equal(calls,0);assert.equal((await active(a)).length,2);pass('Confirmation, Cancel/Escape/backdrop, initial focus, Tab containment and restoration make no revocation request');
  await p.route('**/api/v1/me/sessions/revoke-others',r=>r.fulfill({status:500,contentType:'application/json',body:'{"detail":"request_failed"}'}));
  await opener.click();await dialog.getByRole('button',{name:'Keep this device signed in',exact:true}).click();await dialog.getByRole('alert').waitFor();
  assert.equal((await active(a)).length,2);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await p.unroute('**/api/v1/me/sessions/revoke-others');
  pass('Backend failure remains an error and does not fabricate signout success');
  let release;const gate=new Promise(resolve=>release=resolve);await p.route('**/api/v1/me/sessions/revoke-others',async r=>{await gate;await r.continue();});
  await opener.click();await dialog.getByRole('button',{name:'Keep this device signed in',exact:true}).click();
  assert.equal(await dialog.getByRole('button',{name:'Sign out everywhere',exact:true}).isDisabled(),true);await p.keyboard.press('Escape');assert.equal(await dialog.isVisible(),true);
  release();await p.getByText('Other sessions signed out.',{exact:true}).waitFor();await p.unroute('**/api/v1/me/sessions/revoke-others');
  assert.equal((await active(a)).length,1);assert.equal((await b.request.get(stack.base+'/api/v1/me')).status(),401);assert.equal((await a.request.get(stack.base+'/api/v1/me')).status(),200);
  await q.goto(stack.base+'/profile');await q.waitForURL(/auth\/signin/);
  await opener.click();await dialog.getByRole('button',{name:'Keep this device signed in',exact:true}).click();await p.getByText('Other sessions signed out.',{exact:true}).waitFor();
  pass('Keep-current action refreshes the list, rejects old browser credentials, remains authenticated and is idempotent');
  const matrix=[[1440,'dark','en-IN'],[1280,'light','hi-IN'],[1024,'dark','hi-IN'],[768,'light','en-IN'],[390,'dark','hi-IN'],[390,'light','en-IN']];
  for(const [width,theme,locale]of matrix){await p.setViewportSize({width,height:900});await p.evaluate(({theme,locale})=>{localStorage.setItem('kaushaliq.theme.v1',theme);localStorage.setItem('kaushaliq.locale.v1',locale);},{theme,locale});await p.goto(stack.base+'/settings');await p.locator('.session-list li').waitFor();await p.locator('.personal-section').filter({has:p.locator('.session-list')}).getByRole('button').last().click();
    await p.locator('.session-confirmation').waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await p.locator('.session-confirmation').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}),true);
    await capture(p,`session-confirmation-${theme}-${locale}-${width}.png`);await p.keyboard.press('Escape');}
  await p.emulateMedia({reducedMotion:'reduce',colorScheme:'light'});await p.evaluate(()=>{localStorage.setItem('kaushaliq.theme.v1','system');localStorage.setItem('kaushaliq.locale.v1','en-IN');});await settings(p);assert.equal(await p.locator('html').getAttribute('data-theme'),'light');
  pass('Six inspected dialog viewports cover five widths, both themes/languages, system preference and reduced motion without overflow');
  const c=await browser.newContext();await login(c);await p.getByRole('button',{name:'Sign out all other sessions',exact:true}).click();await p.getByRole('button',{name:'Sign out everywhere',exact:true}).click();await p.waitForURL(/auth\/signin\?reason=signed-out-all/);
  await p.getByText('You have been signed out on all devices and browsers.',{exact:true}).waitFor();assert.equal((await c.request.get(stack.base+'/api/v1/me')).status(),401);assert.equal((await(await a.request.get(stack.base+'/api/auth/session')).json()).authenticated,false);
  await p.goto(stack.base+'/profile');await p.waitForURL(/auth\/signin/);pass('Signout-everywhere revokes current and other sessions, clears auth immediately and protects private routes');
  await a.close();await b.close();await c.close();await stack.stop();

  stack=await startStack(frontend,{oauth:true});const o=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'}),v=await o.newPage();v.on('pageerror',e=>errors.push(e.message));let outcome='success';
  for(const host of ['accounts.google.com','github.com'])await o.route('https://'+host+'/**',async r=>{const u=new URL(r.request().url());assert.equal(u.searchParams.get('code_challenge_method'),'S256');assert.ok(u.searchParams.get('state'));const destination=new URL(u.searchParams.get('redirect_uri'));destination.searchParams.set('state',outcome==='state-invalid'?'invalid-state':u.searchParams.get('state'));
    if(outcome==='cancel')destination.searchParams.set('error','access_denied');else destination.searchParams.set('code',outcome==='missing-email'?'missing-email':outcome==='failure'?'provider-failed':'test-success');await r.fulfill({status:302,headers:{location:destination.href},body:''});});
  await v.goto(stack.base+'/auth/signin');const google=v.getByRole('button',{name:'Continue with Google',exact:true}),github=v.getByRole('button',{name:'Continue with GitHub',exact:true});await google.waitFor();await v.waitForFunction(()=>!document.querySelector('.social-auth button').disabled);
  assert.equal(await github.isDisabled(),false);assert.equal(await v.getByRole('button',{name:/Facebook/i}).count(),0);await capture(v,'provider-controls-dark-en-1440.png');
  await google.click();await v.waitForURL(stack.base+'/intelligence');assert.equal((await(await o.request.get(stack.base+'/api/auth/session')).json()).user.provider,'google');assert.equal((await active(o)).length,1);
  await v.goto(stack.base+'/settings');await v.getByText('This account uses provider sign-in. Password and contact changes require a password that is not currently configured for this account.',{exact:true}).first().waitFor();
  const staleCsrf=(await o.cookies()).find(c=>c.name==='kaushaliq_csrf').value;
  assert.equal((await o.request.post(stack.base+'/api/auth/logout',{headers:{'X-CSRF-Token':staleCsrf,Origin:stack.base}})).status(),200);
  const expiredLink=v.waitForResponse(r=>new URL(r.url()).pathname==='/api/auth/oauth/github/link');
  await v.getByRole('button',{name:'Connect GitHub',exact:true}).click();assert.equal((await expiredLink).status(),401);await v.waitForURL(/auth\/signin/);
  pass('Revoked session at the OAuth link endpoint immediately clears stale frontend authentication');
  await v.waitForFunction(()=>!document.querySelector('.social-auth button').disabled);await google.click();await v.waitForURL(stack.base+'/settings');assert.equal((await active(o)).length,1);
  await v.goto(stack.base+'/settings');await v.getByRole('button',{name:'Connect GitHub',exact:true}).waitFor();
  const linkCsrf=(await o.cookies()).find(c=>c.name==='kaushaliq_csrf').value;
  for(const method of ['post','delete'])assert.equal((await o.request[method](stack.base+'/api/v1/me/connected-accounts/github',{headers:{'X-CSRF-Token':linkCsrf,Origin:stack.base}})).status(),503);
  assert.equal((await(await o.request.get(stack.base+'/api/v1/me/connected-accounts')).json()).items.find(i=>i.provider==='github').connected,false);
  const explicitLink=v.waitForRequest(r=>r.method()==='POST'&&new URL(r.url()).pathname==='/api/auth/oauth/github/link');
  await v.getByRole('button',{name:'Connect GitHub',exact:true}).click();await explicitLink;await v.waitForURL(/oauth_connected=github/);await v.getByText('GitHub is connected to your account.',{exact:true}).waitFor();assert.equal((await active(o)).length,1);
  await capture(v.locator('.personal-section').filter({has:v.getByRole('heading',{name:'Connected accounts',exact:true})}),'connected-accounts-dark-en-1440.png');
  await v.getByRole('button',{name:'Open account menu',exact:true}).click();await v.getByRole('button',{name:'Sign out',exact:true}).click();await v.waitForURL(stack.base+'/');
  await v.goto(stack.base+'/auth/signin');await github.click();await v.waitForURL(stack.base+'/intelligence');assert.equal((await(await o.request.get(stack.base+'/api/auth/session')).json()).user.provider,'github');
  await v.goto(stack.base+'/settings');assert.equal((await active(o)).length,1);await v.getByRole('button',{name:'Open account menu',exact:true}).click();await v.getByRole('button',{name:'Sign out',exact:true}).click();await v.waitForURL(stack.base+'/');
  pass('Direct connected-account mutations stay unavailable with configured providers; Settings uses the authenticated OAuth link route; callbacks preserve the current session and linked GitHub login/logout works');
  for(const [mode,text]of [['cancel','Provider sign-in was cancelled or consent was declined.'],['state-invalid','This sign-in request expired or could not be verified. Please start again.'],['missing-email','A verified primary email is required. Check your provider email settings and try again.'],['failure','Provider sign-in could not be completed. Please try again.']]){outcome=mode;await v.goto(stack.base+'/auth/signin');await v.waitForFunction(()=>!document.querySelectorAll('.social-auth button')[1].disabled);await github.click();await v.waitForURL(/oauth_error=/);await v.getByRole('alert').filter({hasText:text}).waitFor();assert.equal((await(await o.request.get(stack.base+'/api/auth/session')).json()).authenticated,false);}
  await v.setViewportSize({width:390,height:844});await v.evaluate(()=>{localStorage.setItem('kaushaliq.theme.v1','light');localStorage.setItem('kaushaliq.locale.v1','hi-IN');});await v.reload();await v.getByRole('alert').waitFor();assert.equal(await v.locator('html').getAttribute('lang'),'hi');assert.equal(await v.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await capture(v,'oauth-error-light-hi-390.png');
  pass('Cancellation, invalid state, missing verified email and provider failure never create sessions; safe errors are bilingual');
  await o.close();assert.deepEqual(errors,[]);
}catch(e){errors.push(String(e));console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,screenshots,errors,providerVerification:'MOCK PROVIDERS ONLY — no live provider success claimed'},null,2));if(browser)await browser.close();if(stack)await stack.stop();}})();
